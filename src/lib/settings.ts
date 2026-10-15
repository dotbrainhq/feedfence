export const YOUTUBE_SECTIONS = [
  'shorts',
  'home',
  'related',
  'comments',
  'endscreen',
  'sponsored',
] as const;

export type YoutubeSection = (typeof YOUTUBE_SECTIONS)[number];
export type Preset = 'light' | 'focus' | 'strict';
export type HideMap = Record<YoutubeSection, boolean>;

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
  youtube: SiteSettings;
}

const none: HideMap = {
  shorts: false,
  home: false,
  related: false,
  comments: false,
  endscreen: false,
  sponsored: false,
};

// Comments stay visible in every preset: people use them on purpose.
export const PRESETS: Record<Preset, HideMap> = {
  light: { ...none, sponsored: true },
  focus: { ...none, sponsored: true, shorts: true, related: true, endscreen: true },
  strict: { ...none, sponsored: true, shorts: true, related: true, endscreen: true, home: true },
};

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  youtube: { enabled: true, preset: 'focus', hide: { ...PRESETS.focus }, pausedUntil: 0 },
};

export const PAUSE_MS = 5 * 60 * 1000;

/** storage.local key. The content script reads it directly to stay small. */
export const SETTINGS_KEY = 'settings';

/** The sections to hide right now, after the global switch, site switch and pause. */
export function activeHides(settings: Settings, now = Date.now()): YoutubeSection[] {
  const site = settings.youtube;
  if (!settings.enabled || !site.enabled || site.pausedUntil > now) return [];
  return YOUTUBE_SECTIONS.filter((s) => site.hide[s]);
}

/** Which preset a hide map matches, if any. */
export function matchPreset(hide: HideMap): Preset | null {
  for (const [name, map] of Object.entries(PRESETS) as [Preset, HideMap][]) {
    if (YOUTUBE_SECTIONS.every((s) => map[s] === hide[s])) return name;
  }
  return null;
}
