<script lang="ts">
  import { onMount } from 'svelte';
  import WeekView from './WeekView.svelte';
  import { SITES } from '~/lib/sites';
  import {
    EIFFEL_TOWER_M,
    USAGE_PREFIX,
    formatDistance,
    formatMinutes,
    landmark,
    lastDayKeys,
    pxToMeters,
    splitDuration,
    totalMs,
    totalPx,
    type DayUsage,
  } from '~/lib/usage';

  const DAYS = 7;
  const keys = lastDayKeys(DAYS);
  // Day names for the text version of the bars. The UI is English, so the names are too.
  const dayNames = keys.map((k) =>
    new Date(`${k.slice(USAGE_PREFIX.length)}T00:00`).toLocaleDateString('en', { weekday: 'long' }),
  );
  let days = $state<(DayUsage | undefined)[]>([]);
  let view = $state<'today' | 'week'>('today');

  const load = async () => {
    const stored = await browser.storage.local.get(keys);
    days = keys.map((k) => stored[k] as DayUsage | undefined);
  };

  onMount(() => {
    load();
    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && Object.keys(changes).some((k) => k.startsWith(USAGE_PREFIX))) load();
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => browser.storage.onChanged.removeListener(onChanged);
  });

  const today = $derived(days[DAYS - 1]);
  const todayMs = $derived(totalMs(today));
  const time = $derived(splitDuration(todayMs));

  // "Usual" is the average of earlier days this week that have any use.
  const usualMs = $derived.by(() => {
    const earlier = days.slice(0, -1).map(totalMs).filter((ms) => ms > 0);
    return earlier.length ? earlier.reduce((a, b) => a + b, 0) / earlier.length : null;
  });
  const diffMs = $derived(usualMs === null ? 0 : todayMs - usualMs);

  const meters = $derived(pxToMeters(totalPx(today)));
  const rulerFill = $derived(Math.min(1, meters / EIFFEL_TOWER_M));

  const rows = $derived(
    SITES.map((site) => {
      const week = days.map((d) => d?.[site.id]?.ms ?? 0);
      const max = Math.max(...week, 1);
      // Today's time is read from the row itself, so the text covers the six days before it.
      const text = `Previous 6 days: ${week
        .slice(0, -1)
        .map((ms, i) => `${dayNames[i]} ${formatMinutes(ms)}`)
        .join(', ')}`;
      return { ...site, ms: week[DAYS - 1] ?? 0, bars: week.map((ms) => ms / max), text, used: week.some((ms) => ms > 0) };
    }).sort((a, b) => b.ms - a.ms || Number(b.used) - Number(a.used)),
  );
</script>

<div class="views" role="group" aria-label="Period">
  <button aria-pressed={view === 'today'} onclick={() => (view = 'today')}>Today</button>
  <button aria-pressed={view === 'week'} onclick={() => (view = 'week')}>This week</button>
</div>

{#if view === 'week'}
  <WeekView />
{:else}
<div class="today">
  <div>
    <div class="big">
      {#if time.h}{time.h}<small>h</small>{/if}{#if time.m || !time.h}{time.m}<small>min</small>{/if}
    </div>
    <p class="delta">
      {#if usualMs === null}
        Your usual day shows up after a few days of use
      {:else if Math.abs(diffMs) < 5 * 60000}
        About the same as your usual day
      {:else}
        <b>{formatMinutes(Math.abs(diffMs))} {diffMs < 0 ? 'less' : 'more'}</b> than your usual day
      {/if}
    </p>
    <p class="scroll-note">
      <b>{formatDistance(meters)}</b> scrolled, {landmark(meters)}
    </p>
  </div>
  <div class="ruler" role="img" aria-label={`${Math.round(meters)} of ${EIFFEL_TOWER_M} meters, the height of the Eiffel Tower`}>
    <svg class="tower" viewBox="0 0 24 44" aria-hidden="true">
      <path d="M12 1 L13.2 9 L15 18 L17.6 29 L22.5 43 H16.5 C15.6 38 14 36 12 36 C10 36 8.4 38 7.5 43 H1.5 L6.4 29 L9 18 L10.8 9 Z M8 29 H16 M9.6 18 H14.4" />
    </svg>
    <div class="track"><div class="fill" style:height={`${rulerFill * 100}%`}></div></div>
  </div>
</div>

<ul class="sites">
  {#each rows as row (row.id)}
    <li class:unused={!row.used}>
      <span class="name">{row.name}</span>
      <span class="spark" aria-hidden="true">
        {#each row.bars as bar, i (i)}<i style:height={`${Math.max(8, bar * 100)}%`}></i>{/each}
      </span>
      <span class="time">{formatMinutes(row.ms)}</span>
      <span class="sr">{row.text}</span>
    </li>
  {/each}
</ul>

<p class="note">Counts time while a site's tab is open, in front, and in use. Distances are approximate.</p>
{/if}

<style>
  .views {
    display: flex;
    gap: 2px;
    padding: 0 var(--space-lg) var(--space-xs);
  }

  .views button {
    padding: 2px 8px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--text-3);
    font: inherit;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .views button:first-child {
    margin-left: -8px;
  }

  .views button[aria-pressed='true'] {
    background: var(--surface-2);
    color: var(--text);
  }

  .views button:hover {
    color: var(--text);
  }

  .views button:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 1px;
  }

  /* Read by screen readers, not shown. */
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .today {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-lg);
    align-items: end;
    padding: 0 var(--space-lg) var(--space-lg);
  }


  .big {
    margin: var(--space-xs) 0 var(--space-sm);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 2.75rem;
    letter-spacing: -0.035em;
    line-height: 0.95;
    font-variant-numeric: tabular-nums;
  }

  .big small {
    margin: 0 6px 0 2px;
    font-size: 1.25rem;
    letter-spacing: -0.01em;
  }

  .delta,
  .scroll-note {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-2);
  }

  .delta b {
    font-weight: 600;
    color: var(--accent-ink);
  }

  .scroll-note {
    margin-top: var(--space-md);
  }

  .scroll-note b {
    font-family: var(--font-display);
    font-size: 1rem;
    color: var(--text);
  }

  .ruler {
    display: grid;
    justify-items: center;
    gap: var(--space-xs);
  }

  .tower {
    width: 24px;
    height: 44px;
    fill: none;
    stroke: var(--text);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }

  .track {
    position: relative;
    width: 12px;
    height: 112px;
    overflow: hidden;
    border-radius: 6px;
    background: var(--surface-2);
  }

  .fill {
    position: absolute;
    inset: auto 0 0;
    border-radius: 6px;
    background: var(--accent);
    transition: height var(--dur-draw) var(--ease-out);
  }

  .sites {
    margin: 0;
    padding: 0 var(--space-lg);
    list-style: none;
  }

  .sites li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 54px 60px;
    align-items: center;
    gap: var(--space-md);
    padding: 5px 0;
    border-top: 1px solid var(--line);
  }

  .sites li.unused {
    color: var(--text-3);
  }

  .name {
    overflow: hidden;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .time {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--text-2);
  }

  .spark {
    display: flex;
    align-items: end;
    gap: 2px;
    height: 18px;
  }

  .spark i {
    display: block;
    width: 5px;
    border-radius: 1px;
    background: var(--line);
  }

  .spark i:last-child {
    background: var(--accent);
  }

  .unused .spark i {
    background: var(--line);
  }

  .note {
    margin: 0;
    padding: var(--space-md) var(--space-lg);
    font-size: 0.75rem;
    color: var(--text-3);
  }
</style>
