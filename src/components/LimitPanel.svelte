<script lang="ts">
  import { onMount } from 'svelte';
  import { LIMIT_OPTIONS, changeLimit, effectiveLimit, formatLimit, isCustomLimit } from '~/lib/limit';
  import CustomLimit from './CustomLimit.svelte';
  import type { Settings } from '~/lib/settings';
  import { SITES } from '~/lib/sites';
  import { USAGE_PREFIX, dayKey, splitDuration, totalMs, type DayUsage } from '~/lib/usage';

  let { settings, save }: { settings: Settings; save: (change: (draft: Settings) => void) => void } = $props();

  const LOOP = 'M64 64 C52 38 18 38 18 64 C18 90 52 90 64 64 C76 38 110 38 110 64';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let today = $state<DayUsage | undefined>(undefined);
  let shownMs = $state(0);
  let drawn = $state(0); // loop share actually drawn, 0..100
  let choosing = $state(false);
  let customOpen = $state(false);

  const limit = $derived(effectiveLimit(settings.limit));
  const pending = $derived(settings.limit?.pending);
  const usedMs = $derived(totalMs(today));
  const share = $derived(limit ? Math.min(1, usedMs / (limit * 60000)) : 0);
  const reached = $derived(limit !== null && usedMs >= limit * 60000);
  const time = $derived(splitDuration(shownMs));
  const leftMin = $derived(limit ? Math.round(limit - usedMs / 60000) : 0);

  const tiles = $derived(SITES.map((s) => ({ name: s.name, ms: today?.[s.id]?.ms ?? 0 })));

  onMount(() => {
    const key = dayKey();
    const load = () => browser.storage.local.get(key).then((r) => (today = r[key] as DayUsage | undefined));
    load();
    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && Object.keys(changes).some((k) => k.startsWith(USAGE_PREFIX))) load();
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => browser.storage.onChanged.removeListener(onChanged);
  });

  // Draw the loop and count the number up together whenever the target changes.
  let started = false;
  $effect(() => {
    const targetShare = share * 100;
    const targetMs = usedMs;
    if (reduceMotion || started) {
      drawn = targetShare;
      shownMs = targetMs;
      return;
    }
    if (today === undefined) return;
    started = true;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min((now - start) / 900, 1);
      drawn = targetShare * ease(t);
      shownMs = targetMs * ease(t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  });

  const choose = (minutes: number | null) => {
    save((s) => (s.limit = { ...changeLimit(s.limit, minutes), snoozedUntil: s.limit?.snoozedUntil }));
    choosing = false;
    customOpen = false;
  };

  const tomorrowNote = $derived(
    pending ? (pending.minutes === null ? 'No limit from tomorrow' : `${formatLimit(pending.minutes)} from tomorrow`) : '',
  );
</script>

<div class="meter">
  <svg viewBox="10 30 108 68" role="img" aria-label={limit ? `${Math.round(usedMs / 60000)} of ${limit} minutes used today` : 'No daily limit set'}>
    <path class="track" d={LOOP} />
    {#if limit}
      <path class="fill" d={LOOP} pathLength="100" stroke-dasharray="100 100" stroke-dashoffset={100 - drawn} />
    {/if}
    <circle class="ghost" cx="90" cy="84" r="7" />
    <circle class="dot" class:landed={reached && drawn >= 99.5} cx="90" cy="84" r="7" />
  </svg>

  {#if limit}
    <div class="big">
      {#if time.h}{time.h}<small>h</small>{/if}{time.m}<small>min</small>
    </div>
    <p class="status">
      {#if leftMin > 0}
        <b>{formatLimit(leftMin)}</b> left of your {formatLimit(limit)} day
      {:else if leftMin === 0}
        You reached your {formatLimit(limit)} day
      {:else}
        {formatLimit(-leftMin)} past your {formatLimit(limit)} day
      {/if}
    </p>
  {:else}
    <p class="empty">No daily limit yet. Set one and the loop fills through your day.</p>
  {/if}
</div>

{#if limit && !choosing}
  <div class="tiles">
    {#each tiles as t (t.name)}
      <div class="tile">
        <span class="name">{t.name}</span>
        <span class="t">{Math.round(t.ms / 60000)}m</span>
      </div>
    {/each}
  </div>
{/if}

{#if choosing || !limit}
  <div class="choose" role="group" aria-label="Daily limit">
    {#each LIMIT_OPTIONS as m (m)}
      <button aria-pressed={limit === m} onclick={() => choose(m)}>{formatLimit(m)}</button>
    {/each}
    <button aria-pressed={isCustomLimit(limit)} aria-expanded={customOpen} onclick={() => (customOpen = !customOpen)}>
      {isCustomLimit(limit) && limit !== null ? formatLimit(limit) : 'Custom'}
    </button>
    {#if limit}<button aria-pressed={false} onclick={() => choose(null)}>Off</button>{/if}
  </div>
  {#if customOpen}
    <div class="custom-row"><CustomLimit current={limit} onset={choose} /></div>
  {/if}
  {#if limit}<p class="rule">Lowering applies now. Raising or turning off applies tomorrow.</p>{/if}
{/if}

<div class="foot">
  <span class="label">{tomorrowNote || (limit ? 'One limit for all your social sites' : 'Off by default')}</span>
  {#if limit && !choosing}<button class="link" onclick={() => (choosing = true)}>Change limit</button>{/if}
</div>

<style>
  .meter {
    padding: 0 var(--space-lg) var(--space-sm);
    text-align: center;
  }

  svg {
    display: block;
    width: 100%;
    max-width: 176px;
    height: auto;
    margin: 0 auto;
    overflow: visible;
  }

  .track,
  .fill {
    fill: none;
    stroke-width: 10;
    stroke-linecap: round;
  }

  .track {
    stroke: var(--surface-2);
  }

  .fill {
    stroke: var(--accent);
  }

  .ghost {
    fill: var(--surface-2);
  }

  .dot {
    fill: var(--accent);
    opacity: 0;
    transform: translateY(-10px);
    transform-box: fill-box;
    transform-origin: center;
    transition:
      opacity 240ms var(--ease-out),
      transform 240ms var(--ease-out);
  }

  .dot.landed {
    opacity: 1;
    transform: none;
  }

  .big {
    margin: var(--space-sm) 0 var(--space-xs);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 2.5rem;
    letter-spacing: -0.035em;
    line-height: 0.95;
    font-variant-numeric: tabular-nums;
  }

  .big small {
    margin: 0 6px 0 2px;
    font-size: 1.125rem;
    letter-spacing: -0.01em;
  }

  .status,
  .empty {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-2);
  }

  .status b {
    font-weight: 600;
    color: var(--accent-ink);
  }

  .empty {
    margin-top: var(--space-sm);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-lg);
  }

  .tile {
    display: grid;
    gap: 2px;
    min-width: 0;
    padding: 8px 10px;
    border-radius: var(--radius);
    background: var(--surface-2);
  }

  .tile .name {
    overflow: hidden;
    font-size: 0.75rem;
    color: var(--text-2);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .tile .t {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    font-variant-numeric: tabular-nums;
  }

  .choose {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: var(--space-sm) var(--space-lg) 0;
  }

  .choose button {
    padding: 6px 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text);
    font: inherit;
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .choose button[aria-pressed='true'] {
    border-color: var(--primary-bg);
    background: var(--primary-bg);
    color: var(--primary-fg);
  }

  .choose button:hover {
    border-color: var(--accent);
  }

  .choose button:focus-visible,
  .link:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .custom-row {
    padding: var(--space-sm) var(--space-lg) 0;
  }

  .rule {
    margin: var(--space-xs) 0 0;
    padding: 0 var(--space-lg);
    font-size: 0.75rem;
    color: var(--text-3);
  }

  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg) var(--space-sm);
  }

  .label {
    font-size: 0.75rem;
    color: var(--text-3);
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent-ink);
    font: inherit;
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .link:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .dot {
      transition: none;
    }
  }
</style>
