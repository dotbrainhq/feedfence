import { describe, expect, it } from 'vitest';
import { summarizeWeek, weekStart } from './week';

// October 2026: the 12th and 19th are Mondays, the 21st a Wednesday, the 25th a Sunday.
const key = (day: number, month = 10) => `usage:2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const min = (m: number) => m * 60_000;
const day = (youtube: number, x = 0, px = 0) => ({ youtube: { ms: min(youtube), px }, x: { ms: min(x), px: 0 } });

describe('weekStart', () => {
  it('goes back to Monday, and Sunday belongs to the week before it', () => {
    expect(weekStart(new Date(2026, 9, 21, 15))).toEqual(new Date(2026, 9, 19));
    expect(weekStart(new Date(2026, 9, 19, 0, 5))).toEqual(new Date(2026, 9, 19));
    expect(weekStart(new Date(2026, 9, 25, 23))).toEqual(new Date(2026, 9, 19));
  });

  it('crosses a month end', () => {
    expect(weekStart(new Date(2026, 10, 1))).toEqual(new Date(2026, 9, 26));
  });
});

describe('summarizeWeek', () => {
  const stored = {
    [key(12)]: day(30, 10), // last Monday
    [key(13)]: day(20),
    [key(14)]: day(40),
    [key(15)]: day(50), // last Thursday, after the compared days
    [key(19)]: day(15, 5, 1000), // this Monday
    [key(20)]: day(25),
    [key(21)]: day(10, 0, 500), // today, Wednesday
    settings: {},
  };

  it('adds up this week so far and the same days last week', () => {
    const w = summarizeWeek(stored, new Date(2026, 9, 21, 18));
    expect(w.daysSoFar).toBe(3);
    expect(w.ms).toBe(min(55));
    expect(w.px).toBe(1500);
    expect(w.lastMs).toBe(min(100)); // Monday to Wednesday last week: 40 + 20 + 40, Thursday left out
  });

  it('marks later days as not counted yet', () => {
    const w = summarizeWeek(stored, new Date(2026, 9, 21, 18));
    expect(w.days.map((d) => d.future)).toEqual([false, false, false, true, true, true, true]);
    expect(w.days[3]).toEqual({ index: 3, ms: 0, lastMs: min(50), future: true });
  });

  it('splits the week by site', () => {
    const w = summarizeWeek(stored, new Date(2026, 9, 21, 18));
    expect(w.sites.find((s) => s.id === 'youtube')).toEqual({ id: 'youtube', ms: min(50), lastMs: min(90) });
    expect(w.sites.find((s) => s.id === 'x')).toEqual({ id: 'x', ms: min(5), lastMs: min(10) });
    expect(w.sites.find((s) => s.id === 'reddit')).toEqual({ id: 'reddit', ms: 0, lastMs: 0 });
  });

  it('skips the comparison in a first week', () => {
    const first = { [key(13)]: day(20), [key(19)]: day(15) }; // records start after last Monday
    const w = summarizeWeek(first, new Date(2026, 9, 19, 9));
    expect(w.lastMs).toBeNull();
    expect(w.days.every((d) => d.lastMs === null)).toBe(true);
    expect(w.sites.every((s) => s.lastMs === null)).toBe(true);
    expect(summarizeWeek({}, new Date(2026, 9, 19)).ms).toBe(0);
  });

  it('counts all seven days on a Sunday', () => {
    expect(summarizeWeek(stored, new Date(2026, 9, 25, 22)).daysSoFar).toBe(7);
  });
});
