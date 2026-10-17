import { describe, expect, it } from 'vitest';
import { usageCsv } from './export';

const PX_PER_METER = 96 / 0.0254;

describe('usageCsv', () => {
  it('writes only the header when there are no records', () => {
    expect(usageCsv({})).toBe('date,site,active_minutes,scroll_meters\n');
  });

  it('writes one row per day and site, oldest day first, sites in the popup’s order', () => {
    const csv = usageCsv({
      'usage:2026-10-17': { x: { ms: 90_000, px: 0 }, youtube: { ms: 40 * 60_000, px: 1000 * PX_PER_METER } },
      'usage:2026-10-12': { facebook: { ms: 5 * 60_000, px: 0 } },
      settings: {} as never,
    });
    expect(csv.trim().split('\n')).toEqual([
      'date,site,active_minutes,scroll_meters',
      '2026-10-12,Facebook,5.0,0',
      '2026-10-17,YouTube,40.0,1000',
      '2026-10-17,X,1.5,0',
    ]);
  });
});
