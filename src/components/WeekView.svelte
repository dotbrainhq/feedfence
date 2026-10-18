<script lang="ts">
  import { onMount } from 'svelte';
  import { siteName } from '~/lib/sites';
  import { USAGE_PREFIX, formatDistance, formatMinutes, landmark, pxToMeters, splitDuration } from '~/lib/usage';
  import { summarizeWeek, type WeekSummary } from '~/lib/week';

  const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  let week = $state<WeekSummary | null>(null);

  const load = async () => {
    const all = await browser.storage.local.get(null);
    week = summarizeWeek(Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(USAGE_PREFIX))));
  };

  onMount(() => {
    load();
    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && Object.keys(changes).some((k) => k.startsWith(USAGE_PREFIX))) load();
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => browser.storage.onChanged.removeListener(onChanged);
  });

  const time = $derived(splitDuration(week?.ms ?? 0));
  const diffMs = $derived(week && week.lastMs !== null ? week.ms - week.lastMs : 0);
  const meters = $derived(pxToMeters(week?.px ?? 0));
  const max = $derived(Math.max(1, ...(week?.days.flatMap((d) => [d.ms, d.lastMs ?? 0]) ?? [])));
  const sites = $derived(
    (week?.sites ?? [])
      .filter((s) => s.ms > 0 || (s.lastMs ?? 0) > 0)
      .sort((a, b) => b.ms - a.ms || (b.lastMs ?? 0) - (a.lastMs ?? 0)),
  );
  const chartText = $derived(
    week
      ? week.days
          .filter((d) => !d.future)
          .map((d) => `${NAMES[d.index]} ${formatMinutes(d.ms)}${d.lastMs !== null ? `, last week ${formatMinutes(d.lastMs)}` : ''}`)
          .join('. ')
      : '',
  );
  const todayIndex = $derived((week?.daysSoFar ?? 1) - 1);
</script>

{#if week}
  <div class="head">
    <div class="big">
      {#if time.h}{time.h}<small>h</small>{/if}{#if time.m || !time.h}{time.m}<small>min</small>{/if}
    </div>
    <p class="delta">
      {#if week.lastMs === null}
        Your first week. Next week shows how it compares.
      {:else if Math.abs(diffMs) < 5 * 60000}
        About the same as this point last week
      {:else}
        <b>{formatMinutes(Math.abs(diffMs))} {diffMs < 0 ? 'less' : 'more'}</b> than this point last week
      {/if}
    </p>
    {#if meters >= 1}<p class="scroll-note"><b>{formatDistance(meters)}</b> scrolled, {landmark(meters)}</p>{/if}
  </div>

  <div class="chart" role="img" aria-label={chartText}>
    {#each week.days as d (d.index)}
      <div class="col" class:future={d.future} class:today={d.index === todayIndex}>
        <div class="bars">
          {#if d.lastMs !== null}<i class="last" style:height={`${(d.lastMs / max) * 100}%`}></i>{/if}
          {#if !d.future}<i class="this" style:height={`${Math.max(d.ms ? 4 : 0, (d.ms / max) * 100)}%`}></i>{/if}
        </div>
        <span class="day" aria-hidden="true">{LETTERS[d.index]}</span>
      </div>
    {/each}
  </div>
  {#if week.lastMs !== null}
    <p class="legend" aria-hidden="true"><i class="key this"></i>This week <i class="key last"></i>Last week</p>
  {/if}

  <ul class="sites">
    {#each sites as s (s.id)}
      <li>
        <span class="name">{siteName(s.id)}</span>
        {#if s.lastMs !== null}<span class="was">last week {formatMinutes(s.lastMs)}</span>{/if}
        <span class="t">{formatMinutes(s.ms)}</span>
      </li>
    {:else}
      <li class="empty">Nothing yet this week.</li>
    {/each}
  </ul>

  <p class="note">Weeks start on Monday and compare with the same days last week.</p>
{/if}

<style>
  .head {
    padding: 0 var(--space-lg) var(--space-sm);
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

  .delta {
    margin-bottom: var(--space-xs);
  }

  .delta b,
  .scroll-note b {
    font-weight: 600;
    color: var(--accent-ink);
  }

  .chart {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    padding: var(--space-sm) var(--space-lg) 0;
  }

  .col {
    display: grid;
    gap: 4px;
    justify-items: center;
  }

  .bars {
    position: relative;
    width: 100%;
    height: 64px;
  }

  .bars i {
    position: absolute;
    bottom: 0;
    border-radius: 4px 4px 2px 2px;
  }

  .bars .last {
    left: 0;
    right: 0;
    background: var(--surface-2);
  }

  .bars .this {
    left: 22%;
    right: 22%;
    background: var(--accent);
  }

  .day {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--text-3);
  }

  .today .day {
    color: var(--accent-ink);
  }

  .future .day {
    opacity: 0.5;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: var(--space-xs) 0 0;
    padding: 0 var(--space-lg);
    font-size: 0.6875rem;
    color: var(--text-3);
  }

  .key {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  .key.this {
    background: var(--accent);
  }

  .key.last {
    margin-left: var(--space-sm);
    background: var(--surface-2);
    box-shadow: inset 0 0 0 1px var(--line);
  }

  .sites {
    margin: var(--space-sm) 0 0;
    padding: 0 var(--space-lg);
    list-style: none;
  }

  li {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    padding: 6px 0;
    border-top: 1px solid var(--line);
    font-size: 0.875rem;
  }

  .name {
    flex: 1;
    font-weight: 600;
  }

  .was {
    font-size: 0.75rem;
    color: var(--text-3);
  }

  .t {
    min-width: 64px;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .empty {
    color: var(--text-3);
  }

  .note {
    margin: var(--space-sm) 0 var(--space-sm);
    padding: 0 var(--space-lg);
    font-size: 0.75rem;
    color: var(--text-3);
  }
</style>
