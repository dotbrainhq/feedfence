import { describe, expect, it } from 'vitest';
import {
  EIFFEL_TOWER_M,
  dayKey,
  formatDistance,
  formatMinutes,
  landmark,
  lastDayKeys,
  pxToMeters,
  splitDuration,
  totalMs,
  totalPx,
} from './usage';

describe('day keys', () => {
  it('uses the local calendar date, zero-padded', () => {
    expect(dayKey(new Date(2026, 0, 5, 0, 1))).toBe('usage:2026-01-05');
    expect(dayKey(new Date(2026, 11, 31, 23, 59))).toBe('usage:2026-12-31');
  });

  it('lists the last days oldest first, ending today, across a month end', () => {
    expect(lastDayKeys(3, new Date(2026, 10, 1, 12))).toEqual(['usage:2026-10-30', 'usage:2026-10-31', 'usage:2026-11-01']);
  });
});

describe('totals', () => {
  it('adds every site and handles a day with no records', () => {
    const day = { youtube: { ms: 60000, px: 100 }, x: { ms: 30000, px: 50 } };
    expect(totalMs(day)).toBe(90000);
    expect(totalPx(day)).toBe(150);
    expect(totalMs(undefined)).toBe(0);
    expect(totalPx({})).toBe(0);
  });
});

describe('formatting time', () => {
  it('rounds to whole minutes and carries into hours', () => {
    expect(splitDuration(59.6 * 60000)).toEqual({ h: 1, m: 0 });
    expect(splitDuration(125 * 60000)).toEqual({ h: 2, m: 5 });
  });

  it('shows short visits as under a minute, never as zero', () => {
    expect(formatMinutes(10_000)).toBe('<1 min');
    expect(formatMinutes(0)).toBe('0 min');
    expect(formatMinutes(90 * 60000)).toBe('1 h 30 min');
  });
});

describe('scroll distance', () => {
  it('converts CSS pixels at 96 per inch', () => {
    expect(pxToMeters(96)).toBeCloseTo(0.0254, 6);
  });

  it('switches to kilometers at 1,000 m', () => {
    expect(formatDistance(999.4)).toBe('999 m');
    expect(formatDistance(1500)).toBe('1.5 km');
  });

  it('compares to the Eiffel Tower', () => {
    expect(landmark(EIFFEL_TOWER_M / 2)).toBe('about 50% of the way up the Eiffel Tower');
    expect(landmark(0)).toBe('about 1% of the way up the Eiffel Tower');
    expect(landmark(EIFFEL_TOWER_M)).toBe('about 1 Eiffel Tower');
    expect(landmark(EIFFEL_TOWER_M * 2.04)).toBe('about 2 Eiffel Towers');
  });
});
