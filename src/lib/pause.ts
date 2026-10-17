import type { HideSite, Settings } from './settings';

/** The intention pause: a short wait before a social site, once per tab. */
export interface PauseSettings {
  on: boolean;
  sites: HideSite[];
  seconds: number;
}

export const DEFAULT_PAUSE: PauseSettings = {
  on: false,
  sites: ['youtube', 'linkedin', 'x', 'reddit', 'facebook'],
  seconds: 5,
};

/** sessionStorage key marking a tab that already went through the pause, so it shows once per tab. */
export const PAUSED_KEY = 'feedfence-paused';

/** Whether to pause before this site. Reads only what it needs, to keep the content script small. */
export function shouldPause(settings: Settings | undefined, site: HideSite): boolean {
  const p = settings?.pause;
  return Boolean(settings?.enabled !== false && p?.on && p.sites.includes(site) && settings?.[site]?.enabled !== false);
}
