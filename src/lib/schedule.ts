/**
 * Focus hours: on the chosen days, between start and end, every site hides at least what the chosen
 * preset hides. Times are minutes after local midnight. When end is earlier than start, the range
 * runs past midnight and belongs to the day it starts on.
 */
export interface FocusHours {
  on: boolean;
  /** 0 is Sunday, as Date.getDay() counts. */
  days: number[];
  start: number;
  end: number;
  preset: 'focus' | 'strict';
}

export const DEFAULT_FOCUS: FocusHours = { on: false, days: [1, 2, 3, 4, 5], start: 9 * 60, end: 17 * 60, preset: 'strict' };

const minuteOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Whether focus hours are running at this moment. */
export function inFocus(f: FocusHours | undefined, now: Date): boolean {
  if (!f?.on || f.start === f.end || !f.days.length) return false;
  const t = minuteOfDay(now);
  const day = now.getDay();
  if (f.start < f.end) return f.days.includes(day) && t >= f.start && t < f.end;
  return (f.days.includes(day) && t >= f.start) || (f.days.includes((day + 6) % 7) && t < f.end);
}

/** The next moment focus hours start or stop, or null when they never will. */
export function nextFocusChange(f: FocusHours | undefined, now: Date): Date | null {
  if (!f?.on || f.start === f.end || !f.days.length) return null;
  const current = inFocus(f, now);
  // Every start and end in the coming eight days, in time order; the first one that flips the state wins.
  const times: Date[] = [];
  for (let k = 0; k <= 8; k++) {
    for (const minutes of [f.start, f.end]) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k, 0, minutes);
      if (d > now) times.push(d);
    }
  }
  times.sort((a, b) => a.getTime() - b.getTime());
  return times.find((d) => inFocus(f, d) !== current) ?? null;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** A clock time in the browser's own format ("9:00 AM" or "09:00"), to match the time fields. */
export function formatClock(minutes: number, locale?: string): string {
  const d = new Date(2000, 0, 1, 0, minutes);
  return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

/** "Weekdays", "Every day", "Weekends" or a short list like "Mon, Wed, Fri". */
export function formatDays(days: number[]): string {
  const set = [...new Set(days)].sort((a, b) => a - b).join();
  if (set === '0,1,2,3,4,5,6') return 'Every day';
  if (set === '1,2,3,4,5') return 'Weekdays';
  if (set === '0,6') return 'Weekends';
  // Monday first, the way most weeks are read.
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d)).map((d) => DAY_NAMES[d]!.slice(0, 3)).join(', ');
}

/** One line for the popup: "On now until 17:00", "Next: Monday 9:00" or "Off". */
export function focusStatus(f: FocusHours | undefined, now: Date, locale?: string): string {
  if (!f?.on || !f.days.length || f.start === f.end) return 'Off';
  const next = nextFocusChange(f, now);
  if (inFocus(f, now)) return next ? `On now until ${formatClock(minuteOfDay(next), locale)}` : 'On now';
  if (!next) return 'Off';
  const sameDay = next.toDateString() === now.toDateString();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString() === next.toDateString();
  const when = sameDay ? 'today' : tomorrow ? 'tomorrow' : DAY_NAMES[next.getDay()];
  return `Next: ${when} ${formatClock(minuteOfDay(next), locale)}`;
}
