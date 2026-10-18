import { SITE_IDS, type SiteId } from './sites';
import { USAGE_PREFIX, dayKey, totalMs, totalPx, type DayUsage } from './usage';

/** Monday of the week holding this date. Weeks start on Monday. */
export function weekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const addDays = (date: Date, n: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

export interface WeekDay {
  /** 0 is Monday. */
  index: number;
  ms: number;
  /** The same weekday last week, or null when there's nothing to compare with. */
  lastMs: number | null;
  /** Later this week, so not counted yet. */
  future: boolean;
}

export interface WeekSummary {
  /** Days of this week so far, today included: 1 on Monday, 7 on Sunday. */
  daysSoFar: number;
  ms: number;
  px: number;
  /** The same days of last week, or null in a first week (no records from before last Monday). */
  lastMs: number | null;
  days: WeekDay[];
  sites: { id: SiteId; ms: number; lastMs: number | null }[];
}

/**
 * This week so far against the same days of last week, from stored `usage:` days. A comparison only
 * appears once records reach back to last Monday, so a first week isn't measured against empty days.
 */
export function summarizeWeek(stored: Record<string, unknown>, today = new Date()): WeekSummary {
  const monday = weekStart(today);
  const lastMonday = addDays(monday, -7);
  const daysSoFar = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - monday.getTime()) / 86_400_000) + 1;
  const day = (d: Date) => stored[dayKey(d)] as DayUsage | undefined;
  const earliest = Object.keys(stored).filter((k) => k.startsWith(USAGE_PREFIX)).sort()[0];
  const compare = earliest !== undefined && earliest <= dayKey(lastMonday);

  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const future = i >= daysSoFar;
    return {
      index: i,
      ms: future ? 0 : totalMs(day(addDays(monday, i))),
      lastMs: compare ? totalMs(day(addDays(lastMonday, i))) : null,
      future,
    };
  });
  const thisWeek = days.filter((d) => !d.future);
  const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
  const siteMs = (start: Date, id: SiteId) => sum(thisWeek.map((d) => day(addDays(start, d.index))?.[id]?.ms ?? 0));

  return {
    daysSoFar,
    ms: sum(thisWeek.map((d) => d.ms)),
    px: sum(thisWeek.map((d) => totalPx(day(addDays(monday, d.index))))),
    lastMs: compare ? sum(thisWeek.map((d) => d.lastMs ?? 0)) : null,
    days,
    sites: SITE_IDS.map((id) => ({ id, ms: siteMs(monday, id), lastMs: compare ? siteMs(lastMonday, id) : null })),
  };
}
