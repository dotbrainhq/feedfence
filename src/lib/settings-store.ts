import { storage } from '#imports';
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings } from './settings';

/** Settings with WXT's storage helper, for the popup and background. */
export const settingsItem = storage.defineItem<Settings>(`local:${SETTINGS_KEY}`, {
  fallback: DEFAULT_SETTINGS,
});
