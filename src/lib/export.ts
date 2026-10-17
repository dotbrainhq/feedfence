import { SITES } from './sites';
import { USAGE_PREFIX, pxToMeters, type DayUsage } from './usage';

/** Stored usage days, keyed `usage:YYYY-MM-DD`, as CSV: one row per day and site, oldest first. */
export function usageCsv(days: Record<string, DayUsage>): string {
  const rows = ['date,site,active_minutes,scroll_meters'];
  for (const key of Object.keys(days).filter((k) => k.startsWith(USAGE_PREFIX)).sort()) {
    const date = key.slice(USAGE_PREFIX.length);
    for (const site of SITES) {
      const u = days[key]?.[site.id];
      if (!u) continue;
      rows.push(`${date},${site.name},${(u.ms / 60000).toFixed(1)},${Math.round(pxToMeters(u.px))}`);
    }
  }
  return rows.join('\n') + '\n';
}
