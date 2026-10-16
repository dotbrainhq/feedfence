/** Sites with hide rules, and the sections each one can hide. */
export const SECTIONS = {
  youtube: ['shorts', 'home', 'related', 'comments', 'endscreen', 'sponsored'],
  linkedin: ['promoted', 'suggested', 'recommendations', 'games', 'stats', 'feed'],
} as const;

export type HideSite = keyof typeof SECTIONS;
export const HIDE_SITES = Object.keys(SECTIONS) as HideSite[];
export type Preset = 'light' | 'focus' | 'strict';
export type Theme = 'auto' | 'light' | 'dark';
export type HideMap = Record<string, boolean>;

export interface SiteSettings {
  enabled: boolean;
  /** Null once the user changes a single switch away from a preset. */
  preset: Preset | null;
  hide: HideMap;
  /** Epoch ms. Everything shows until then ("Show everything for 5 min"). */
  pausedUntil: number;
}

export interface Settings {
  enabled: boolean;
  /** Popup theme. Auto follows the light or dark mode the browser reports. Missing in settings saved before 0.1.0. */
  theme?: Theme;
  youtube: SiteSettings;
  /** Missing in settings saved before LinkedIn support. */
  linkedin?: SiteSettings;
}

// Each preset adds to the one before it. Things people use on purpose
// (YouTube comments, posting on LinkedIn) stay visible in every preset.
const PRESET_SECTIONS: Record<HideSite, Record<Preset, string[]>> = {
  youtube: {
    light: ['sponsored'],
    focus: ['sponsored', 'shorts', 'related', 'endscreen'],
    strict: ['sponsored', 'shorts', 'related', 'endscreen', 'home'],
  },
  linkedin: {
    light: ['promoted'],
    focus: ['promoted', 'suggested', 'recommendations', 'games'],
    strict: ['promoted', 'suggested', 'recommendations', 'games', 'stats', 'feed'],
  },
};

export function presetMap(site: HideSite, preset: Preset): HideMap {
  const on = PRESET_SECTIONS[site][preset];
  return Object.fromEntries(SECTIONS[site].map((s) => [s, on.includes(s)]));
}

const defaultSite = (site: HideSite): SiteSettings => ({
  enabled: true,
  preset: 'focus',
  hide: presetMap(site, 'focus'),
  pausedUntil: 0,
});

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  theme: 'auto',
  youtube: defaultSite('youtube'),
  linkedin: defaultSite('linkedin'),
};

export const PAUSE_MS = 5 * 60 * 1000;

/** storage.local key. Content scripts read it directly to stay small. */
export const SETTINGS_KEY = 'settings';

export function siteSettings(settings: Settings, site: HideSite): SiteSettings {
  return settings[site] ?? defaultSite(site);
}

/** The sections to hide right now, after the global switch, site switch and pause. */
export function activeHides(settings: Settings, site: HideSite, now = Date.now()): string[] {
  const s = siteSettings(settings, site);
  if (!settings.enabled || !s.enabled || s.pausedUntil > now) return [];
  return SECTIONS[site].filter((section) => s.hide[section]);
}

/** Which preset a hide map matches, if any. */
export function matchPreset(site: HideSite, hide: HideMap): Preset | null {
  for (const preset of ['light', 'focus', 'strict'] as const) {
    const map = presetMap(site, preset);
    if (SECTIONS[site].every((s) => map[s] === Boolean(hide[s]))) return preset;
  }
  return null;
}
