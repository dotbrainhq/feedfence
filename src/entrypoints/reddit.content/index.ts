import './hide.css';
import { runHiding } from '~/lib/hide-runtime';

// Reddit draws Popular, News and Explore inside the left menu's shadow DOM,
// where page styles can't reach. This adds one style inside that shadow root
// and turns it on or off with the setting.
const MENU_CSS = '#popular-posts, #news-posts, #explore-communities { display: none !important; }';

export default defineContentScript({
  matches: ['*://www.reddit.com/*'],
  runAt: 'document_start',
  main(ctx) {
    const root = document.documentElement;
    let hideMenu = false;

    const patchMenu = () => {
      const shadow = document.querySelector('left-nav-top-section')?.shadowRoot;
      if (!shadow) return false;
      let style = shadow.getElementById('ff-menu') as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = 'ff-menu';
        style.textContent = MENU_CSS;
        shadow.append(style);
      }
      style.disabled = !hideMenu;
      return true;
    };

    // The menu renders after the page starts; check once per frame, for up to about 5 seconds.
    const whenMenuReady = () => {
      let tries = 0;
      const step = () => {
        if (patchMenu() || ++tries > 300) return;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    // Some rules depend on the page (community lists are the point of Explore).
    const markPage = () => root.setAttribute('data-ff-rd-page', location.pathname.split('/')[1] || 'home');

    runHiding(ctx, 'reddit', (hidden) => {
      hideMenu = hidden.has('popular');
      whenMenuReady();
    });
    markPage();

    const onNavigate = () => {
      markPage();
      whenMenuReady();
    };
    const nav = (window as { navigation?: EventTarget }).navigation;
    if (nav) ctx.addEventListener(nav, 'navigatesuccess' as never, onNavigate);
    ctx.addEventListener(window, 'popstate', onNavigate);
  },
});
