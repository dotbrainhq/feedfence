import './hide.css';
import { runHiding } from '~/lib/hide-runtime';

// "For you" can't be hidden with CSS alone: it's the timeline Home opens on.
// When that section is hidden, the script picks the second Home tab
// (Following) by position, so it works in any language.
function openFollowing() {
  if (location.pathname !== '/home') return false;
  const tabs = document.querySelectorAll<HTMLElement>('[data-testid="primaryColumn"] [role="tablist"] [role="tab"]');
  if (tabs.length < 2) return false;
  if (tabs[0]!.getAttribute('aria-selected') === 'true') tabs[1]!.click();
  return true;
}

export default defineContentScript({
  matches: ['*://x.com/*'],
  runAt: 'document_start',
  main(ctx) {
    let hideForYou = false;
    let tries = 0;

    // The tabs render a moment after the page; check once per frame, for up to about 5 seconds.
    const whenTabsReady = () => {
      tries = 0;
      const step = () => {
        if (!hideForYou || openFollowing() || ++tries > 300) return;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    runHiding(ctx, 'x', (hidden) => {
      const was = hideForYou;
      hideForYou = hidden.has('foryou');
      if (hideForYou && !was) whenTabsReady();
    });

    // X changes pages without reloading. The Navigation API reports each change.
    const nav = (window as { navigation?: EventTarget }).navigation;
    if (nav) ctx.addEventListener(nav, 'navigatesuccess' as never, whenTabsReady);
    ctx.addEventListener(window, 'popstate', whenTabsReady);
  },
});
