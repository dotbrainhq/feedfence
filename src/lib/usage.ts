import type { SiteId } from './sites';

/** One day of usage, stored under `usage:YYYY-MM-DD` in storage.local. */
export type DayUsage = Partial<Record<SiteId, { ms: number; px: number }>>;

export interface UsageBatch {
  type: 'usage';
  site: SiteId;
  ms: number;
  px: number;
}

export const USAGE_PREFIX = 'usage:';
export const KEEP_DAYS = 30;

/** Local calendar day, so "today" matches the user's clock. */
export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${USAGE_PREFIX}${y}-${m}-${d}`;
}

/** Storage keys for the last `n` days, oldest first, ending today. */
export function lastDayKeys(n: number, today = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (n - 1 - i));
    return dayKey(d);
  });
}

export const totalMs = (day: DayUsage | undefined) =>
  Object.values(day ?? {}).reduce((sum, s) => sum + (s?.ms ?? 0), 0);

export const totalPx = (day: DayUsage | undefined) =>
  Object.values(day ?? {}).reduce((sum, s) => sum + (s?.px ?? 0), 0);

export function splitDuration(ms: number): { h: number; m: number } {
  const minutes = Math.round(ms / 60000);
  return { h: Math.floor(minutes / 60), m: minutes % 60 };
}

export function formatMinutes(ms: number): string {
  if (ms > 0 && ms < 30_000) return '<1 min';
  const { h, m } = splitDuration(ms);
  return h ? `${h} h ${m} min` : `${m} min`;
}

// CSS defines 96 px per inch. Real screens differ, so distances are labeled approximate.
const METERS_PER_PX = 0.0254 / 96;
export const EIFFEL_TOWER_M = 330;

export const pxToMeters = (px: number) => px * METERS_PER_PX;

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function landmark(meters: number): string {
  const towers = meters / EIFFEL_TOWER_M;
  if (towers < 1) return `about ${Math.max(1, Math.round(towers * 100))}% of the way up the Eiffel Tower`;
  const rounded = Math.round(towers * 10) / 10;
  return `about ${rounded} ${rounded === 1 ? 'Eiffel Tower' : 'Eiffel Towers'}`;
}
