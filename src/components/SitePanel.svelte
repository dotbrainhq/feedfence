<script lang="ts">
  import Switch from './Switch.svelte';
  import { SECTION_LABELS } from '~/lib/labels';
  import {
    PAUSE_MS,
    SECTIONS,
    matchPreset,
    presetMap,
    siteSettings,
    type HideSite,
    type Preset,
    type Settings,
  } from '~/lib/settings';
  import { formatClock, inFocus, nextFocusChange } from '~/lib/schedule';
  import { siteName } from '~/lib/sites';

  let {
    settings,
    save,
    site,
    onback,
  }: {
    settings: Settings;
    save: (change: (draft: Settings) => void) => void;
    site: HideSite;
    onback: () => void;
  } = $props();

  const PRESET_NAMES: { id: Preset; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'focus', label: 'Focus' },
    { id: 'strict', label: 'Strict' },
  ];

  let now = $state(Date.now());
  const s = $derived(siteSettings(settings, site));
  const sections = $derived(SECTIONS[site]);
  const labels = $derived(SECTION_LABELS[site]);
  const name = $derived(siteName(site));
  const paused = $derived(s.pausedUntil > now);
  const minutesLeft = $derived(Math.max(1, Math.ceil((s.pausedUntil - now) / 60000)));
  const hiddenCount = $derived(sections.filter((x) => s.hide[x]).length);
  const active = $derived(settings.enabled && s.enabled);
  // Focus hours add their preset's sections on top of this site's own choices.
  const focusUntil = $derived.by(() => {
    if (!inFocus(settings.focus, new Date(now))) return null;
    const end = nextFocusChange(settings.focus, new Date(now));
    return end ? formatClock(end.getHours() * 60 + end.getMinutes()) : '';
  });

  // The countdown only ticks while the popup is open and a pause is running.
  $effect(() => {
    if (!paused) return;
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  /** Changes this site's settings, creating them from defaults if they were never saved. */
  const saveSite = (change: (site: ReturnType<typeof siteSettings>) => void) =>
    save((draft) => {
      const current = siteSettings(draft, site);
      change(current);
      draft[site] = current;
    });

  const setPreset = (preset: Preset) =>
    saveSite((x) => {
      x.preset = preset;
      x.hide = presetMap(site, preset);
    });

  const setSection = (section: string, hide: boolean) =>
    saveSite((x) => {
      x.hide[section] = hide;
      x.preset = matchPreset(site, x.hide);
    });

  const pause = () => {
    now = Date.now();
    saveSite((x) => (x.pausedUntil = now + PAUSE_MS));
  };
  const resume = () => saveSite((x) => (x.pausedUntil = 0));
</script>

<div class="site-head">
  <div class="title">
    <button class="back" onclick={onback} aria-label="All sites" title="All sites">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
    </button>
    <h2>{name}</h2>
  </div>
  <Switch
    checked={s.enabled}
    label={`Feedfence on ${name}`}
    disabled={!settings.enabled}
    onchange={(v) => saveSite((x) => (x.enabled = v))}
  />
</div>

<p class="status">
  {#if !settings.enabled}
    Feedfence is off everywhere
  {:else if !s.enabled}
    Off on {name}
  {:else if paused}
    Everything shows on {name} for {minutesLeft} more min
  {:else}
    <b>{hiddenCount} {hiddenCount === 1 ? 'section' : 'sections'}</b> hidden on {name}
  {/if}
</p>
{#if active && !paused && focusUntil !== null}
  <p class="focus-note">
    Focus hours{focusUntil ? ` until ${focusUntil}` : ''} also hide what {settings.focus?.preset === 'strict' ? 'Strict' : 'Focus'} hides.
  </p>
{/if}

<div class="seg" role="group" aria-label="Preset">
  {#each PRESET_NAMES as p (p.id)}
    <button aria-pressed={s.preset === p.id} disabled={!active} onclick={() => setPreset(p.id)}>
      {p.label}
    </button>
  {/each}
</div>

<ul class="hides">
  {#each sections as section (section)}
    <li>
      <span>
        {labels[section]?.label}
        {#if labels[section]?.note}<small>{labels[section]?.note}</small>{/if}
      </span>
      <Switch
        checked={Boolean(s.hide[section])}
        label={`Hide ${labels[section]?.label.toLowerCase()}`}
        disabled={!active}
        onchange={(v) => setSection(section, v)}
      />
    </li>
  {/each}
</ul>

<div class="pause">
  {#if paused}
    <button class="btn secondary" onclick={resume}>Hide them again now</button>
  {:else}
    <button class="btn" disabled={!active || hiddenCount === 0} onclick={pause}>Show everything for 5 min</button>
  {/if}
</div>

<style>
  .site-head {
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

  .back:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 1px;
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
    padding: 0 var(--space-lg) var(--space-sm);
    font-size: 0.8125rem;
    color: var(--text-2);
  }

  .status b {
    font-weight: 600;
    color: var(--accent-ink);
  }

  .focus-note {
    margin: 0;
    padding: 0 var(--space-lg) var(--space-sm);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--accent-ink);
  }

  .seg {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0 var(--space-lg) var(--space-sm);
    padding: 3px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
  }

  .seg button {
    padding: 5px 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--text-2);
    font: inherit;
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .seg button[aria-pressed='true'] {
    background: var(--surface-2);
    color: var(--text);
  }

  .seg button:hover:not(:disabled) {
    color: var(--text);
  }

  .seg button:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 1px;
  }

  .seg button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hides {
    margin: 0;
    padding: 0 var(--space-lg);
    list-style: none;
  }

  .hides li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }

  .hides small {
    display: block;
    font-size: 0.75rem;
    color: var(--text-3);
  }

  .pause {
    padding: var(--space-sm) var(--space-lg);
  }

  .btn {
    width: 100%;
    padding: 10px 14px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--primary-bg);
    color: var(--primary-fg);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out);
  }

  .btn:hover:not(:disabled) {
    background: var(--primary-hover);
  }

  .btn:active:not(:disabled) {
    transform: translateY(1px);
  }

  .btn:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn.secondary {
    border: 1px solid var(--line);
    background: transparent;
    color: var(--text);
  }

  .btn.secondary:hover {
    background: var(--surface-2);
  }
</style>
