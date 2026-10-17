import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  HIDE_SITES,
  SECTIONS,
  activeHides,
  matchPreset,
  presetMap,
  siteSettings,
  type Settings,
} from './settings';

const hidden = (map: Record<string, boolean>) => Object.keys(map).filter((k) => map[k]);
const withYouTube = (youtube: Partial<Settings['youtube']>): Settings => ({
  ...structuredClone(DEFAULT_SETTINGS),
  youtube: { ...DEFAULT_SETTINGS.youtube, ...youtube },
});

describe('presets', () => {
  it.each(HIDE_SITES)('each preset on %s hides everything the one before it does', (site) => {
    const light = hidden(presetMap(site, 'light'));
    const focus = hidden(presetMap(site, 'focus'));
    const strict = hidden(presetMap(site, 'strict'));
    expect(focus).toEqual(expect.arrayContaining(light));
    expect(strict).toEqual(expect.arrayContaining(focus));
    expect(light.length).toBeLessThan(focus.length);
    expect(focus.length).toBeLessThan(strict.length);
  });

  it.each(HIDE_SITES)('%s presets only name sections the site has', (site) => {
    for (const preset of ['light', 'focus', 'strict'] as const) {
      expect(Object.keys(presetMap(site, preset)).sort()).toEqual([...SECTIONS[site]].sort());
    }
  });

  it('keeps YouTube comments in every preset', () => {
    for (const preset of ['light', 'focus', 'strict'] as const) expect(presetMap('youtube', preset).comments).toBe(false);
  });

  it('matches a hide map back to its preset, and custom maps to none', () => {
    expect(matchPreset('x', presetMap('x', 'strict'))).toBe('strict');
    expect(matchPreset('x', { ...presetMap('x', 'focus'), foryou: true, trends: false })).toBeNull();
  });
});

describe('siteSettings', () => {
  it('starts every site on Focus', () => {
    for (const site of HIDE_SITES) {
      expect(DEFAULT_SETTINGS[site]?.preset).toBe('focus');
      expect(siteSettings({ enabled: true, youtube: DEFAULT_SETTINGS.youtube }, site).hide).toEqual(presetMap(site, 'focus'));
    }
  });

  it('follows the preset’s current sections, not an older saved copy', () => {
    const saved = withYouTube({ preset: 'focus', hide: { shorts: true } });
    expect(siteSettings(saved, 'youtube').hide).toEqual(presetMap('youtube', 'focus'));
  });

  it('keeps custom choices as saved', () => {
    const custom = { ...presetMap('youtube', 'light'), comments: true };
    expect(siteSettings(withYouTube({ preset: null, hide: custom }), 'youtube').hide).toEqual(custom);
  });
});

describe('activeHides', () => {
  const now = 1_000_000;

  it('hides the preset’s sections when everything is on', () => {
    expect(activeHides(DEFAULT_SETTINGS, 'youtube', now).sort()).toEqual(hidden(presetMap('youtube', 'focus')).sort());
  });

  it('hides nothing when Feedfence or the site is off', () => {
    expect(activeHides({ ...DEFAULT_SETTINGS, enabled: false }, 'youtube', now)).toEqual([]);
    expect(activeHides(withYouTube({ enabled: false }), 'youtube', now)).toEqual([]);
  });

  it('adds the focus preset’s sections during focus hours, keeping the site’s own', () => {
    const custom = withYouTube({ preset: null, hide: { ...presetMap('youtube', 'light'), comments: true } });
    const hiddenNow = activeHides(custom, 'youtube', now, 'strict').sort();
    expect(hiddenNow).toEqual([...new Set([...hidden(presetMap('youtube', 'strict')), 'comments'])].sort());
  });

  it('leaves a site that is off alone during focus hours', () => {
    expect(activeHides(withYouTube({ enabled: false }), 'youtube', now, 'strict')).toEqual([]);
  });

  it('hides nothing during a pause, and hides again once it ends', () => {
    const paused = withYouTube({ pausedUntil: now + 1 });
    expect(activeHides(paused, 'youtube', now)).toEqual([]);
    expect(activeHides(paused, 'youtube', now + 1).length).toBeGreaterThan(0);
  });
});
