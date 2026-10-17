import type { ContentScriptContext } from '#imports';
import {
  DEFAULT_SETTINGS,
  FOCUS_NOW_KEY,
  SECTIONS,
  SETTINGS_KEY,
  activeHides,
  siteSettings,
  type FocusNow,
  type HideSite,
  type Settings,
} from './settings';

// Each site's stylesheet ships in the manifest and loads before the page
// renders. Its rules are gated by data-ff-<section> attributes on <html>, so
// this only flips attributes from settings. It reads browser.storage directly
// instead of WXT's storage helper to keep content scripts small.
/** `onApply` runs after each change with the sections now hidden, for site-specific follow-up work. */
export function runHiding(ctx: ContentScriptContext, site: HideSite, onApply?: (hidden: Set<string>) => void) {
  const root = document.documentElement;
  let resume: number | undefined;
  let settings: Settings = DEFAULT_SETTINGS;
  let focus: FocusNow = null;

  const apply = () => {
    const on = new Set(activeHides(settings, site, Date.now(), focus));
    for (const section of SECTIONS[site]) root.toggleAttribute(`data-ff-${section}`, on.has(section));
    onApply?.(on);

    // A pause ends on its own: one timer, set from the stored end time.
    clearTimeout(resume);
    const left = siteSettings(settings, site).pausedUntil - Date.now();
    if (left > 0) resume = ctx.setTimeout(apply, left + 50);
  };

  const read = (stored: Record<string, unknown>) => {
    settings = (stored[SETTINGS_KEY] as Settings | undefined) ?? DEFAULT_SETTINGS;
    focus = (stored[FOCUS_NOW_KEY] as FocusNow | undefined) ?? null;
    apply();
  };
  const load = () => browser.storage.local.get([SETTINGS_KEY, FOCUS_NOW_KEY]).then(read);
  load();

  const onChanged = (changes: Record<string, unknown>, area: string) => {
    if (area === 'local' && (SETTINGS_KEY in changes || FOCUS_NOW_KEY in changes)) load();
  };
  browser.storage.onChanged.addListener(onChanged);
  ctx.onInvalidated(() => browser.storage.onChanged.removeListener(onChanged));
}
