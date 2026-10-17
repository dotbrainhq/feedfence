import { describe, expect, it } from 'vitest';
import { changeLimit, effectiveLimit, formatLimit } from './limit';

// Local dates, so the tests read the same in any time zone.
const oct17 = new Date(2026, 9, 17, 15, 0);
const TODAY = 'usage:2026-10-17';
const TOMORROW = 'usage:2026-10-18';

describe('effectiveLimit', () => {
  it('is null with no limit saved', () => {
    expect(effectiveLimit(undefined, TODAY)).toBeNull();
    expect(effectiveLimit({ minutes: null }, TODAY)).toBeNull();
  });

  it('keeps today’s limit while a change waits for tomorrow', () => {
    const limit = { minutes: 30, pending: { minutes: 120, from: TOMORROW } };
    expect(effectiveLimit(limit, TODAY)).toBe(30);
    expect(effectiveLimit(limit, TOMORROW)).toBe(120);
    expect(effectiveLimit(limit, 'usage:2026-10-20')).toBe(120);
  });

  it('turns off on the day a pending Off starts', () => {
    expect(effectiveLimit({ minutes: 60, pending: { minutes: null, from: TOMORROW } }, TOMORROW)).toBeNull();
  });
});

describe('changeLimit', () => {
  it('applies a first limit at once', () => {
    expect(changeLimit(undefined, 60, oct17)).toEqual({ minutes: 60 });
    expect(changeLimit({ minutes: null }, 30, oct17)).toEqual({ minutes: 30 });
  });

  it('applies a lower limit at once', () => {
    expect(changeLimit({ minutes: 60 }, 30, oct17)).toEqual({ minutes: 30 });
  });

  it('makes a higher limit wait until tomorrow', () => {
    expect(changeLimit({ minutes: 60 }, 120, oct17)).toEqual({ minutes: 60, pending: { minutes: 120, from: TOMORROW } });
  });

  it('makes turning the limit off wait until tomorrow', () => {
    expect(changeLimit({ minutes: 60 }, null, oct17)).toEqual({ minutes: 60, pending: { minutes: null, from: TOMORROW } });
  });

  it('drops a pending change when today’s limit is chosen again', () => {
    expect(changeLimit({ minutes: 60, pending: { minutes: 120, from: TOMORROW } }, 60, oct17)).toEqual({ minutes: 60 });
  });

  it('lowers below today’s limit at once even with a raise pending', () => {
    expect(changeLimit({ minutes: 60, pending: { minutes: 120, from: TOMORROW } }, 30, oct17)).toEqual({ minutes: 30 });
  });

  it('treats a pending change that has started as today’s limit', () => {
    const started = { minutes: 30, pending: { minutes: 120, from: TODAY } };
    expect(changeLimit(started, 90, oct17)).toEqual({ minutes: 90 });
    expect(changeLimit(started, 180, oct17)).toEqual({ minutes: 120, pending: { minutes: 180, from: TOMORROW } });
  });

  it('starts a pending change on the next calendar day across a month end', () => {
    expect(changeLimit({ minutes: 30 }, 60, new Date(2026, 9, 31, 23, 50))).toEqual({
      minutes: 30,
      pending: { minutes: 60, from: 'usage:2026-11-01' },
    });
  });
});

describe('formatLimit', () => {
  it('writes minutes and hours the way the popup shows them', () => {
    expect(formatLimit(30)).toBe('30 min');
    expect(formatLimit(60)).toBe('1 h');
    expect(formatLimit(90)).toBe('1 h 30 min');
    expect(formatLimit(240)).toBe('4 h');
  });
});
