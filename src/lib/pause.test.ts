import { describe, expect, it } from 'vitest';
import { DEFAULT_PAUSE, shouldPause } from './pause';
import { DEFAULT_SETTINGS, type Settings } from './settings';

const withPause = (pause: Partial<typeof DEFAULT_PAUSE>, extra: Partial<Settings> = {}): Settings => ({
  ...structuredClone(DEFAULT_SETTINGS),
  pause: { ...DEFAULT_PAUSE, ...pause },
  ...extra,
});

describe('shouldPause', () => {
  it('is off by default and when no settings are saved', () => {
    expect(shouldPause(DEFAULT_SETTINGS, 'youtube')).toBe(false);
    expect(shouldPause(undefined, 'youtube')).toBe(false);
    expect(DEFAULT_PAUSE.on).toBe(false);
  });

  it('pauses on the chosen sites only', () => {
    const s = withPause({ on: true, sites: ['youtube', 'x'] });
    expect(shouldPause(s, 'youtube')).toBe(true);
    expect(shouldPause(s, 'x')).toBe(true);
    expect(shouldPause(s, 'reddit')).toBe(false);
  });

  it('stays out of the way when Feedfence or the site is off', () => {
    expect(shouldPause(withPause({ on: true }, { enabled: false }), 'youtube')).toBe(false);
    expect(shouldPause(withPause({ on: true }, { youtube: { ...DEFAULT_SETTINGS.youtube, enabled: false } }), 'youtube')).toBe(false);
  });
});
