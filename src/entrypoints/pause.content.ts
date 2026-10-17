import { PAUSED_KEY, shouldPause } from '~/lib/pause';
import { SETTINGS_KEY, type HideSite, type Settings } from '~/lib/settings';
import { SITE_MATCHES, siteForHost, siteName } from '~/lib/sites';

// Minified by hand: the stylesheet and markup are most of this script's size.
const STYLE = `:host{all:initial}.wrap{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:24px;background:rgb(0 56 32 / 0.97);color:#f9fdfa;font:15px/1.5 system-ui,sans-serif;animation:in 200ms ease-out}.card{max-width:340px;text-align:center}svg{width:96px;height:auto}h1{margin:16px 0 8px;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-0.02em}p{margin:0 0 24px;color:#b9d3c3}.btns{display:grid;gap:8px}button{padding:11px 16px;border-radius:10px;font:inherit;font-weight:700;cursor:pointer}.go{border:0;background:#bef050;color:#003820}.go:disabled{opacity:.55;cursor:default}.close{border:1px solid #24603f;background:transparent;color:#f9fdfa}.off{margin-top:8px;padding:6px;border:0;background:none;color:#b9d3c3;font-weight:600;text-decoration:underline}button:focus-visible{outline:2px solid #bef050;outline-offset:2px}@keyframes in{from{opacity:0}}`;

const MARKUP = `<div class="wrap" role="dialog" aria-modal="true" aria-labelledby="ff-t" aria-describedby="ff-d"><div class="card"><svg viewBox="10 30 108 68" aria-hidden="true"><path d="M64 64 C52 38 18 38 18 64 C18 90 52 90 64 64 C76 38 110 38 110 64" fill="none" stroke="#bef050" stroke-width="10" stroke-linecap="round"/></svg><h1 id="ff-t">What are you here for?</h1><p id="ff-d">Take a breath first. <span class="name"></span> opens in a moment.</p><div class="btns"><button class="go" type="button" disabled></button><button class="close" type="button">Close this tab</button></div><button class="off" type="button"></button></div></div>`;

// A short pause before a social site, once per tab: Continue unlocks after a few seconds, and
// closing the tab or turning the pause off for the site works right away.
export default defineContentScript({
  // Every tracked site; shouldPause only ever allows the five with hide rules.
  matches: SITE_MATCHES,
  runAt: 'document_start',
  main(ctx) {
    const site = siteForHost(location.hostname) as HideSite | undefined;
    if (!site) return;
    try {
      if (sessionStorage.getItem(PAUSED_KEY)) return;
    } catch {}
    let host: HTMLElement | undefined;
    const name = siteName(site);
    const pauseMedia = (e: Event) => (e.target as HTMLMediaElement).pause?.();

    const hide = () => {
      host?.remove();
      host = undefined;
      document.removeEventListener('play', pauseMedia, true);
    };

    const show = (seconds: number) => {
      host = document.createElement('feedfence-pause');
      const root = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = STYLE;
      root.append(style, new DOMParser().parseFromString(MARKUP, 'text/html').body.firstChild!);
      const wrap = root.querySelector('.wrap')!;
      const [go, close, off] = root.querySelectorAll('button');
      root.querySelector('.name')!.textContent = name;
      off!.textContent = `Don't pause on ${name}`;
      go!.onclick = () => {
        try {
          sessionStorage.setItem(PAUSED_KEY, '1');
        } catch {}
        hide();
      };
      close!.onclick = () => browser.runtime.sendMessage({ type: 'close-tab' });
      off!.onclick = () => {
        browser.runtime.sendMessage({ type: 'pause-off', site });
        hide();
      };
      let left = seconds;
      const tick = () => {
        go!.textContent = left > 0 ? `Continue in ${left}` : `Continue to ${name}`;
        go!.disabled = left > 0;
        if (left-- > 0) ctx.setTimeout(tick, 1000);
      };
      tick();
      // Keep keys and scrolling away from the page, and keep Tab inside the pause.
      wrap.addEventListener('keydown', (e) => {
        const k = e as KeyboardEvent;
        k.stopPropagation();
        if (k.key !== 'Tab') return;
        k.preventDefault();
        const order = [go!, close!, off!].filter((b) => !b.disabled);
        const at = order.indexOf(root.activeElement as HTMLButtonElement);
        order[(at + (k.shiftKey ? order.length - 1 : 1)) % order.length]!.focus();
      });
      for (const type of ['wheel', 'touchmove']) wrap.addEventListener(type, (e) => e.preventDefault(), { passive: false });
      document.documentElement.append(host);
      document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((m) => m.pause());
      document.addEventListener('play', pauseMedia, true);
      close!.focus();
    };

    browser.storage.local.get(SETTINGS_KEY).then((stored) => {
      const settings = stored[SETTINGS_KEY] as Settings | undefined;
      if (ctx.isValid && shouldPause(settings, site)) show(settings!.pause!.seconds);
    });
    // Turning the pause off in the popup lets this tab through.
    const onChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area === 'local' && host && SETTINGS_KEY in changes && !shouldPause(changes[SETTINGS_KEY]?.newValue as Settings, site)) hide();
    };
    browser.storage.onChanged.addListener(onChanged);
    ctx.onInvalidated(() => {
      browser.storage.onChanged.removeListener(onChanged);
      hide();
    });
  },
});
