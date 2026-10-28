import { describe, expect, it } from 'vitest';
import { SITE_MATCHES, SITES, siteForHost } from './sites';

describe('siteForHost', () => {
  it('knows every address a site is served from', () => {
    expect(siteForHost('www.facebook.com')).toBe('facebook');
    expect(siteForHost('web.facebook.com')).toBe('facebook');
    expect(siteForHost('m.facebook.com')).toBe('facebook');
    expect(siteForHost('m.youtube.com')).toBe('youtube');
    expect(siteForHost('old.reddit.com')).toBe('reddit');
    expect(siteForHost('x.com')).toBe('x');
  });

  it('leaves other addresses on the same domains alone', () => {
    for (const host of ['studio.youtube.com', 'music.youtube.com', 'business.facebook.com', 'developers.facebook.com', 'example.com']) {
      expect(siteForHost(host)).toBeUndefined();
    }
  });
});

describe('SITE_MATCHES', () => {
  it('covers every address, desktop and track-only', () => {
    const hosts = SITES.flatMap((s) => [...s.hosts, ...s.trackOnly]);
    expect(SITE_MATCHES).toEqual(hosts.map((h) => `*://${h}/*`));
    expect(SITE_MATCHES).toContain('*://web.facebook.com/*');
  });
});
