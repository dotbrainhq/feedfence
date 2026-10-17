<script lang="ts">
  import Switch from './Switch.svelte';
  import { DEFAULT_FOCUS, focusStatus, inFocus, type FocusHours } from '~/lib/schedule';
  import type { Settings } from '~/lib/settings';

  let { settings, save, onback }: { settings: Settings; save: (change: (draft: Settings) => void) => void; onback: () => void } =
    $props();

  // Monday first, the way most weeks are read. Values match Date.getDay().
  const DAYS = [
    { id: 1, short: 'M', name: 'Monday' },
    { id: 2, short: 'T', name: 'Tuesday' },
    { id: 3, short: 'W', name: 'Wednesday' },
    { id: 4, short: 'T', name: 'Thursday' },
    { id: 5, short: 'F', name: 'Friday' },
    { id: 6, short: 'S', name: 'Saturday' },
    { id: 0, short: 'S', name: 'Sunday' },
  ];
  const PRESETS = [
    { id: 'focus', label: 'Focus' },
    { id: 'strict', label: 'Strict' },
  ] as const;

  let now = $state(new Date());
  const f = $derived<FocusHours>({ ...DEFAULT_FOCUS, ...settings.focus });
  const status = $derived(focusStatus(f, now));
  const running = $derived(inFocus(f, now));

  // Keeps the line under the title right while the popup stays open.
  $effect(() => {
    const id = setInterval(() => (now = new Date()), 30_000);
    return () => clearInterval(id);
  });

  const update = (change: (focus: FocusHours) => void) =>
    save((draft) => {
      const next = { ...DEFAULT_FOCUS, ...draft.focus };
      change(next);
      draft.focus = next;
    });

  const toggleDay = (day: number) =>
    update((x) => (x.days = x.days.includes(day) ? x.days.filter((d) => d !== day) : [...x.days, day]));

  const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const fromTime = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h! * 60 + m! : null;
  };
  const setTime = (key: 'start' | 'end', value: string) => {
    const minutes = fromTime(value);
    if (minutes !== null) update((x) => (x[key] = minutes));
  };

  const presetName = $derived(f.preset === 'strict' ? 'Strict' : 'Focus');
  const crossesMidnight = $derived(f.end < f.start);
</script>

<div class="head">
  <div class="title">
    <button class="back" onclick={onback} aria-label="All sites" title="All sites">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
    </button>
    <h2>Focus hours</h2>
  </div>
  <Switch checked={f.on} label="Focus hours on" disabled={!settings.enabled} onchange={(v) => update((x) => (x.on = v))} />
</div>

<p class="status" class:running>
  {#if !settings.enabled}
    Feedfence is off everywhere
  {:else if f.on && !f.days.length}
    Pick at least one day
  {:else if f.on && f.start === f.end}
    Pick an end time different from the start
  {:else}
    {status}
  {/if}
</p>

<div class="body" class:off={!f.on}>
  <span class="label" id="focus-preset">During focus hours, hide like</span>
  <div class="seg" role="group" aria-labelledby="focus-preset">
    {#each PRESETS as p (p.id)}
      <button aria-pressed={f.preset === p.id} onclick={() => update((x) => (x.preset = p.id))}>{p.label}</button>
    {/each}
  </div>

  <span class="label" id="focus-days">Days</span>
  <div class="days" role="group" aria-labelledby="focus-days">
    {#each DAYS as d (d.id)}
      <button aria-pressed={f.days.includes(d.id)} aria-label={d.name} title={d.name} onclick={() => toggleDay(d.id)}>{d.short}</button>
    {/each}
  </div>

  <div class="times">
    <label>
      <span class="label">From</span>
      <input type="time" step="300" value={toTime(f.start)} onchange={(e) => setTime('start', e.currentTarget.value)} />
    </label>
    <label>
      <span class="label">Until</span>
      <input type="time" step="300" value={toTime(f.end)} onchange={(e) => setTime('end', e.currentTarget.value)} />
    </label>
  </div>
  {#if crossesMidnight}<p class="hint">Runs past midnight into the next morning.</p>{/if}

  <p class="note">
    Every site hides at least what {presetName} hides, then goes back to its own settings. Sites you turned off stay off,
    and Show everything for 5 min still works.
  </p>
</div>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: 0 var(--space-lg) var(--space-sm);
  }

  .title {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    margin-left: -6px;
  }

  .back {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    cursor: pointer;
  }

  .back svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: var(--text-2);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .back:hover {
    background: var(--surface-2);
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.5rem;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .status {
    margin: 0;
    padding: 0 var(--space-lg) var(--space-md);
    font-size: 0.8125rem;
    color: var(--text-2);
  }

  .status.running {
    font-weight: 600;
    color: var(--accent-ink);
  }

  .body {
    display: grid;
    gap: var(--space-xs);
    padding: 0 var(--space-lg);
    transition: opacity var(--dur) var(--ease-out);
  }

  .body.off {
    opacity: 0.6;
  }

  .label {
    font-size: 0.75rem;
    color: var(--text-3);
  }

  .seg {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-bottom: var(--space-sm);
    padding: 3px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
  }

  .seg button,
  .days button {
    border: 0;
    background: transparent;
    color: var(--text-2);
    font: inherit;
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .seg button {
    padding: 5px 0;
    border-radius: 6px;
  }

  .seg button[aria-pressed='true'] {
    background: var(--surface-2);
    color: var(--text);
  }

  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
    margin-bottom: var(--space-sm);
  }

  .days button {
    aspect-ratio: 1;
    max-height: 36px;
    border: 1px solid var(--line);
    border-radius: 50%;
  }

  .days button[aria-pressed='true'] {
    border-color: var(--primary-bg);
    background: var(--primary-bg);
    color: var(--primary-fg);
  }

  .days button:hover {
    border-color: var(--accent);
  }

  .times {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .times label {
    display: grid;
    gap: 2px;
  }

  input {
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .back:focus-visible,
  .seg button:focus-visible,
  .days button:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 1px;
  }

  .hint,
  .note {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-3);
  }

  .note {
    margin-top: var(--space-sm);
    line-height: 1.45;
  }
</style>
