import { effectiveLimit, formatLimit } from '~/lib/limit';
import { SETTINGS_KEY, type Settings } from '~/lib/settings';
import { SITE_MATCHES } from '~/lib/sites';
import { USAGE_PREFIX, dayKey, totalMs, type DayUsage } from '~/lib/usage';

// Minified by hand: the stylesheet and markup are most of this script's size.
const STYLE = `:host{all:initial}.wrap{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;background:rgb(0 56 32 / 0.97);color:#f9fdfa;font:15px/1.5 system-ui,sans-serif;animation:in 200ms ease-out}.card{max-width:340px;text-align:center}svg{width:96px;height:auto}h1{margin:16px 0 8px;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-0.02em}p{margin:0 0 24px;color:#b9d3c3}.btns{display:grid;gap:8px}button{padding:11px 16px;border-radius:10px;font:inherit;font-weight:700;cursor:pointer}.close{border:0;background:#bef050;color:#003820}.more{border:1px solid #24603f;background:transparent;color:#f9fdfa}.more:hover{border-color:#bef050}button:focus-visible{outline:2px solid #bef050;outline-offset:2px}@keyframes in{from{opacity:0}}`;

const MARKUP = `<div class="wrap" role="dialog" aria-modal="true" aria-labelledby="ff-t" aria-describedby="ff-d"><div class="card"><svg viewBox="10 30 108 68" aria-hidden="true"><path d="M64 64 C52 38 18 38 18 64 C18 90 52 90 64 64 C76 38 110 38 110 64" fill="none" stroke="#bef050" stroke-width="10" stroke-linecap="round"/><circle cx="90" cy="84" r="7" fill="#bef050"/></svg><h1 id="ff-t">That's your <span class="limit"></span> for today</h1><p id="ff-d">You've spent <span class="used"></span> on social sites today.</p><div class="btns"><button class="close" type="button">Close this tab</button><button class="more" type="button">5 more minutes</button></div></div></div>`;

// Covers the page once today's time on all social sites reaches the daily
// limit. The background script closes the tab or records the snooze, so
// every open tab follows the same choice.
export default defineContentScript({
  matches: SITE_MATCHES,
  main(ctx) {
    let host: HTMLElement | undefined;
    let limitText: Element;
    let usedText: Element;
    let wake: number | undefined;

    const pauseMedia = (e: Event) => (e.target as HTMLMediaElement).pause?.();

    const show = (limit: number, used: number) => {
      if (!host) {
        host = document.createElement('feedfence-limit');
        const root = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = STYLE;
        // Parsed rather than set with innerHTML; the markup is a constant and the numbers go in as text.
        root.append(style, new DOMParser().parseFromString(MARKUP, 'text/html').body.firstChild!);
        const wrap = root.querySelector('.wrap')!;
        const close = root.querySelector<HTMLButtonElement>('.close')!;
        const more = root.querySelector<HTMLButtonElement>('.more')!;
        limitText = root.querySelector('.limit')!;
        usedText = root.querySelector('.used')!;
        close.onclick = () => browser.runtime.sendMessage({ type: 'close-tab' });
        more.onclick = () => browser.runtime.sendMessage({ type: 'snooze' });
        // Keep keys and scrolling away from the page: no video shortcuts, no feed scrolling underneath.
        wrap.addEventListener('keydown', (e) => {
          const k = e as KeyboardEvent;
          k.stopPropagation();
          if (k.key === 'Tab') {
            k.preventDefault();
            (root.activeElement === close ? more : close).focus();
          }
        });
        for (const type of ['wheel', 'touchmove']) wrap.addEventListener(type, (e) => e.preventDefault(), { passive: false });
        document.documentElement.append(host);
        document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((m) => m.pause());
        document.addEventListener('play', pauseMedia, true);
        close.focus();
      }
      limitText.textContent = formatLimit(limit);
      usedText.textContent = formatLimit(Math.round(used / 60_000));
    };

    const hide = () => {
      host?.remove();
      host = undefined;
      document.removeEventListener('play', pauseMedia, true);
    };

    const check = async () => {
      const key = dayKey();
      const stored = await browser.storage.local.get([SETTINGS_KEY, key]);
      const settings = stored[SETTINGS_KEY] as Settings | undefined;
      const limit = settings?.enabled === false ? null : effectiveLimit(settings?.limit, key);
      const used = totalMs(stored[key] as DayUsage | undefined);
      const snoozeLeft = (settings?.limit?.snoozedUntil ?? 0) - Date.now();
      clearTimeout(wake);
      if (snoozeLeft > 0) wake = ctx.setTimeout(check, snoozeLeft + 50);
      if (limit !== null && used >= limit * 60_000 && snoozeLeft <= 0) show(limit, used);
      else hide();
    };

    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && Object.keys(changes).some((k) => k === SETTINGS_KEY || k.startsWith(USAGE_PREFIX))) check();
    };
    browser.storage.onChanged.addListener(onChanged);
    // A new day starts with a fresh count; recheck when the tab comes back into view.
    ctx.addEventListener(document, 'visibilitychange', () => document.visibilityState === 'visible' && check());
    ctx.onInvalidated(() => {
      browser.storage.onChanged.removeListener(onChanged);
      hide();
    });
    check();
  },
});
