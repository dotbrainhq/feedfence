import { dayKey } from './usage';

/** The daily limit for all tracked sites together. */
export interface LimitSettings {
  /** Minutes per day, or null for no limit. */
  minutes: number | null;
  /** A raise or removal waiting for the next day. */
  pending?: { minutes: number | null; from: string };
  /** Epoch ms. The at-limit reminder stays away until then ("5 more minutes"). */
  snoozedUntil?: number;
}

export const LIMIT_OPTIONS = [30, 60, 90, 120, 180, 240] as const;
export const SNOOZE_MS = 5 * 60 * 1000;

const tomorrowKey = (now = new Date()) => {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  return dayKey(d);
};

/** Today's limit in minutes, with any pending change that has come due. */
export function effectiveLimit(limit: LimitSettings | undefined, today = dayKey()): number | null {
  if (!limit) return null;
  if (limit.pending && today >= limit.pending.from) return limit.pending.minutes;
  return limit.minutes;
}

/**
 * Applies a new limit. A stricter limit (lower, or a first limit) applies
 * now; a looser one (higher, or none) waits for tomorrow, so a tempted
 * moment can't undo the limit for today.
 */
export function changeLimit(limit: LimitSettings | undefined, next: number | null, now = new Date()): LimitSettings {
  const current = effectiveLimit(limit, dayKey(now));
  if (next === current) return { minutes: current };
  const stricter = next !== null && (current === null || next < current);
  if (stricter) return { minutes: next };
  return { minutes: current, pending: { minutes: next, from: tomorrowKey(now) } };
}

export function formatLimit(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
