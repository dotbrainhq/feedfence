import type { ContentScriptContext } from '#imports';
import { DEFAULT_SETTINGS, SECTIONS, SETTINGS_KEY, activeHides, siteSettings, type HideSite, type Settings } from './settings';

// Each site's stylesheet ships in the manifest and loads before the page
// renders. Its rules are gated by data-ff-<section> attributes on <html>, so
// this only flips attributes from settings. It reads browser.storage directly
// instead of WXT's storage helper to keep content scripts small.
/** `onApply` runs after each change with the sections now hidden, for site-specific follow-up work. */
export function runHiding(ctx: ContentScriptContext, site: HideSite, onApply?: (hidden: Set<string>) => void) {
  const root = document.documentElement;
  let resume: number | undefined;

  const apply = (settings: Settings = DEFAULT_SETTINGS) => {
    const on = new Set(activeHides(settings, site));
    for (const section of SECTIONS[site]) root.toggleAttribute(`data-ff-${section}`, on.has(section));
    onApply?.(on);

    // A pause ends on its own: one timer, set from the stored end time.
    clearTimeout(resume);
    const left = siteSettings(settings, site).pausedUntil - Date.now();
    if (left > 0) resume = ctx.setTimeout(() => apply(settings), left + 50);
  };

  browser.storage.local.get(SETTINGS_KEY).then((stored) => apply(stored[SETTINGS_KEY] as Settings | undefined));

  const onChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area === 'local' && SETTINGS_KEY in changes) apply(changes[SETTINGS_KEY]?.newValue as Settings | undefined);
  };
  browser.storage.onChanged.addListener(onChanged);
  ctx.onInvalidated(() => browser.storage.onChanged.removeListener(onChanged));
}
