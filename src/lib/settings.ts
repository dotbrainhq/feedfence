import type { LimitSettings } from './limit';
import type { FocusHours } from './schedule';

/** Sites with hide rules, and the sections each one can hide. */
export const SECTIONS = {
  youtube: ['shorts', 'home', 'related', 'comments', 'endscreen', 'sponsored'],
  linkedin: ['promoted', 'suggested', 'recommendations', 'games', 'stats', 'feed'],
  x: ['promoted', 'trends', 'follow', 'premium', 'sidebar', 'foryou'],
  reddit: ['promoted', 'suggested', 'recent', 'popular', 'sidebar'],
  facebook: ['promoted', 'reels', 'suggested', 'stories', 'menu', 'rightcol'],
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
  /** Daily limit for all tracked sites together. Missing until someone sets one. */
  limit?: LimitSettings;
  focus?: FocusHours;
  youtube: SiteSettings;
  /** Missing in settings saved before support for the site. */
  linkedin?: SiteSettings;
  x?: SiteSettings;
  reddit?: SiteSettings;
  facebook?: SiteSettings;
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
  x: {
    light: ['promoted'],
    focus: ['promoted', 'trends', 'follow', 'premium', 'sidebar'],
    strict: ['promoted', 'trends', 'follow', 'premium', 'sidebar', 'foryou'],
  },
  reddit: {
    light: ['promoted'],
    focus: ['promoted', 'suggested', 'recent', 'popular'],
    strict: ['promoted', 'suggested', 'recent', 'popular', 'sidebar'],
  },
  facebook: {
    light: ['promoted'],
    focus: ['promoted', 'reels', 'suggested', 'stories'],
    strict: ['promoted', 'reels', 'suggested', 'stories', 'menu', 'rightcol'],
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
  youtube: /* @__PURE__ */ defaultSite('youtube'),
  linkedin: /* @__PURE__ */ defaultSite('linkedin'),
  x: /* @__PURE__ */ defaultSite('x'),
  reddit: /* @__PURE__ */ defaultSite('reddit'),
  facebook: /* @__PURE__ */ defaultSite('facebook'),
};

export const PAUSE_MS = 5 * 60 * 1000;

/** storage.local key. Content scripts read it directly to stay small. */
export const SETTINGS_KEY = 'settings';

/**
 * storage.local key for the preset focus hours apply right now, or null outside them. The background
 * script keeps it current with an alarm, so content scripts read one value instead of doing the math.
 */
export const FOCUS_NOW_KEY = 'focusNow';
export type FocusNow = 'focus' | 'strict' | null;

/**
 * A site's settings. While a preset is chosen, its sections come from the
 * preset's current definition, so changes to a preset in an update reach
 * people who picked it. Custom switch choices (preset null) are kept as saved.
 */
export function siteSettings(settings: Settings, site: HideSite): SiteSettings {
  const s = settings[site] ?? defaultSite(site);
  return s.preset ? { ...s, hide: presetMap(site, s.preset) } : s;
}

/** The sections to hide right now, after the global switch, site switch, pause and focus hours. */
export function activeHides(settings: Settings, site: HideSite, now = Date.now(), focus: FocusNow = null): string[] {
  const s = siteSettings(settings, site);
  if (!settings.enabled || !s.enabled || s.pausedUntil > now) return [];
  // During focus hours a site hides at least what the focus preset hides, never less than its own choice.
  const extra = focus ? presetMap(site, focus) : {};
  return SECTIONS[site].filter((section) => s.hide[section] || extra[section]);
}

/** Which preset a hide map matches, if any. */
export function matchPreset(site: HideSite, hide: HideMap): Preset | null {
  for (const preset of ['light', 'focus', 'strict'] as const) {
    const map = presetMap(site, preset);
    if (SECTIONS[site].every((s) => map[s] === Boolean(hide[s]))) return preset;
  }
  return null;
}
