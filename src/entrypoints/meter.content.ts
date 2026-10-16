import { SITE_MATCHES, siteForHost } from '~/lib/sites';
import type { UsageBatch } from '~/lib/usage';

const IDLE_MS = 60_000;
const FLUSH_MS = 60_000;

// Counts active time and scroll distance, and sends them to the background
// script in batches. Everything is driven by browser events: the only timers
// are the idle cutoff (reset by activity) and a once-a-minute flush.
export default defineContentScript({
  matches: SITE_MATCHES,
  main(ctx) {
    const site = siteForHost(location.hostname);
    if (!site) return;

    let ms = 0;
    let px = 0;
    let since = 0; // performance.now() when the current active stretch began, 0 when not counting
    let lastInput = 0;
    let idleTimer: number | undefined;
    const playing = new Set<EventTarget>();
    const scrollTops = new WeakMap<Element, number>();

    const inView = () => document.visibilityState === 'visible' && document.hasFocus();

    const stop = (at = performance.now()) => {
      if (since) ms += Math.max(0, at - since);
      since = 0;
    };

    const flush = () => {
      if (since) {
        const now = performance.now();
        stop(now);
        since = now;
      }
      if (ms < 500 && px < 1) return;
      const batch: UsageBatch = { type: 'usage', site, ms: Math.round(ms), px: Math.round(px) };
      ms = 0;
      px = 0;
      // After an extension update the old script loses its connection; drop the batch quietly.
      try {
        browser.runtime.sendMessage(batch).catch(() => {});
      } catch {}
    };

    const onIdle = () => {
      // A playing video counts as watching, even without input.
      if (playing.size && inView()) {
        idleTimer = ctx.setTimeout(onIdle, IDLE_MS);
        return;
      }
      stop(lastInput + IDLE_MS);
      flush();
    };

    const onActivity = () => {
      const now = performance.now();
      if (since && now - lastInput < 1000) return; // already counting; skip the timer churn
      lastInput = now;
      if (!since && inView()) since = now;
      clearTimeout(idleTimer);
      idleTimer = ctx.setTimeout(onIdle, IDLE_MS);
    };

    const onLeave = () => {
      stop();
      flush();
    };

    const opts = { capture: true, passive: true } as const;
    for (const type of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']) {
      ctx.addEventListener(window, type as keyof WindowEventMap, onActivity, opts);
    }
    ctx.addEventListener(window, 'focus', onActivity);
    ctx.addEventListener(window, 'blur', onLeave);
    ctx.addEventListener(window, 'pagehide', onLeave);
    ctx.addEventListener(document, 'visibilitychange', () => (document.visibilityState === 'visible' ? onActivity() : onLeave()));

    // Media events don't bubble, but they can be caught on the way down.
    ctx.addEventListener(document, 'play', (e) => (playing.add(e.target!), onActivity()), true);
    for (const type of ['pause', 'ended', 'emptied'] as const) {
      ctx.addEventListener(document, type, (e) => playing.delete(e.target!), true);
    }

    // Scroll events don't bubble either. Capturing them also covers inner
    // scroll areas, like the Shorts player or a feed inside a panel.
    ctx.addEventListener(
      document,
      'scroll',
      (e) => {
        const el = e.target === document ? document.scrollingElement : (e.target as Element);
        if (!el) return;
        const top = el.scrollTop;
        const prev = scrollTops.get(el);
        if (prev !== undefined) px += Math.abs(top - prev);
        scrollTops.set(el, top);
        onActivity();
      },
      opts,
    );

    // Start the page's own scroll position now, so the first scroll counts too.
    if (document.scrollingElement) scrollTops.set(document.scrollingElement, document.scrollingElement.scrollTop);

    ctx.setInterval(flush, FLUSH_MS);
    ctx.onInvalidated(onLeave);
    onActivity();
  },
});
