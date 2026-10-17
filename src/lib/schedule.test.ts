import { describe, expect, it } from 'vitest';
import { DEFAULT_FOCUS, focusStatus, formatClock, formatDays, inFocus, nextFocusChange, type FocusHours } from './schedule';

// October 2026: the 12th is a Monday, the 16th a Friday, the 17th a Saturday.
const at = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m);
const weekdays: FocusHours = { ...DEFAULT_FOCUS, on: true };
const nights: FocusHours = { on: true, days: [1, 2, 3, 4, 5], start: 22 * 60, end: 2 * 60, preset: 'focus' };

describe('inFocus', () => {
  it('is on between start and end on chosen days, end excluded', () => {
    expect(inFocus(weekdays, at(12, 9))).toBe(true);
    expect(inFocus(weekdays, at(12, 16, 59))).toBe(true);
    expect(inFocus(weekdays, at(12, 17))).toBe(false);
    expect(inFocus(weekdays, at(12, 8, 59))).toBe(false);
    expect(inFocus(weekdays, at(17, 10))).toBe(false);
  });

  it('runs past midnight for the day it starts on', () => {
    expect(inFocus(nights, at(16, 23))).toBe(true); // Friday night
    expect(inFocus(nights, at(17, 1, 30))).toBe(true); // early Saturday, still Friday's range
    expect(inFocus(nights, at(17, 23))).toBe(false); // Saturday isn't chosen
    expect(inFocus(nights, at(12, 1))).toBe(false); // early Monday: Sunday isn't chosen
  });

  it('is off when turned off, with no days, or an empty range', () => {
    expect(inFocus(DEFAULT_FOCUS, at(12, 10))).toBe(false);
    expect(inFocus({ ...weekdays, days: [] }, at(12, 10))).toBe(false);
    expect(inFocus({ ...weekdays, end: weekdays.start }, at(12, 9))).toBe(false);
    expect(inFocus(undefined, at(12, 10))).toBe(false);
  });
});

describe('nextFocusChange', () => {
  it('finds the end of today’s range, then the next start', () => {
    expect(nextFocusChange(weekdays, at(12, 10))).toEqual(at(12, 17));
    expect(nextFocusChange(weekdays, at(12, 18))).toEqual(at(13, 9));
  });

  it('skips the weekend', () => {
    expect(nextFocusChange(weekdays, at(16, 17, 30))).toEqual(at(19, 9));
  });

  it('ends a night range the next morning', () => {
    expect(nextFocusChange(nights, at(16, 23))).toEqual(at(17, 2));
  });

  it('never changes when off', () => {
    expect(nextFocusChange(DEFAULT_FOCUS, at(12, 10))).toBeNull();
  });
});

describe('labels', () => {
  it('writes clock times and day sets the way the popup shows them', () => {
    expect(formatClock(9 * 60, 'en-US')).toBe('9:00 AM');
    expect(formatClock(17 * 60 + 5, 'en-US')).toBe('5:05 PM');
    expect(formatClock(17 * 60 + 5, 'de-DE')).toBe('17:05');
    expect(formatDays([1, 2, 3, 4, 5])).toBe('Weekdays');
    expect(formatDays([6, 0])).toBe('Weekends');
    expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Every day');
    expect(formatDays([5, 1, 3])).toBe('Mon, Wed, Fri');
    expect(formatDays([0, 1])).toBe('Mon, Sun');
  });

  it('says what happens next', () => {
    expect(focusStatus(weekdays, at(12, 10), 'en-US')).toBe('On now until 5:00 PM');
    expect(focusStatus(weekdays, at(12, 8), 'en-US')).toBe('Next: today 9:00 AM');
    expect(focusStatus(weekdays, at(12, 18), 'en-US')).toBe('Next: tomorrow 9:00 AM');
    expect(focusStatus(weekdays, at(16, 18), 'de-DE')).toBe('Next: Monday 9:00');
    expect(focusStatus(DEFAULT_FOCUS, at(12, 10))).toBe('Off');
  });
});
