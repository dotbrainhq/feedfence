import './hide.css';
import { DEFAULT_SETTINGS, SETTINGS_KEY, YOUTUBE_SECTIONS, activeHides, type Settings } from '~/lib/settings';

// The stylesheet ships in the manifest and loads before the page renders.
// Each rule is gated by a data-ff-<section> attribute on <html>, so this
// script only flips attributes: no DOM scanning, no observers, no polling.
// It reads browser.storage directly instead of WXT's storage helper to keep
// the script small, since it loads on every YouTube page.
export default defineContentScript({
  // Desktop only for now; the mobile site uses different elements.
  matches: ['*://www.youtube.com/*'],
  runAt: 'document_start',
  main(ctx) {
    const root = document.documentElement;
    let resume: ReturnType<typeof setTimeout> | undefined;

    const apply = (settings: Settings = DEFAULT_SETTINGS) => {
      const on = new Set(activeHides(settings));
      for (const section of YOUTUBE_SECTIONS) root.toggleAttribute(`data-ff-${section}`, on.has(section));

      // A pause ends on its own: one timer, set from the stored end time.
      clearTimeout(resume);
      const left = settings.youtube.pausedUntil - Date.now();
      if (left > 0) resume = setTimeout(() => apply(settings), left + 50);
    };

    browser.storage.local.get(SETTINGS_KEY).then((stored) => apply(stored[SETTINGS_KEY] as Settings | undefined));

    const onChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area === 'local' && SETTINGS_KEY in changes) apply(changes[SETTINGS_KEY]?.newValue as Settings | undefined);
    };
    browser.storage.onChanged.addListener(onChanged);
    ctx.onInvalidated(() => {
      browser.storage.onChanged.removeListener(onChanged);
      clearTimeout(resume);
    });
  },
});
