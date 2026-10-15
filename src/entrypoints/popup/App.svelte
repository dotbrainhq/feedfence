<script lang="ts">
  import { onMount } from 'svelte';
  import Switch from '~/components/Switch.svelte';
  import {
    DEFAULT_SETTINGS,
    PAUSE_MS,
    PRESETS,
    YOUTUBE_SECTIONS,
    matchPreset,
    type Preset,
    type Settings,
    type YoutubeSection,
  } from '~/lib/settings';
  import { settingsItem } from '~/lib/settings-store';

  const SECTIONS: Record<YoutubeSection, { label: string; note?: string }> = {
    shorts: { label: 'Shorts', note: 'Everywhere on the site' },
    home: { label: 'Home page recommendations', note: 'Search and subscriptions stay' },
    related: { label: 'Related videos', note: 'Next to the player' },
    comments: { label: 'Comments' },
    endscreen: { label: 'End screen suggestions', note: 'Cards and suggestions on the player' },
    sponsored: { label: 'Sponsored tiles', note: 'Video ads are left alone' },
  };
  const PRESET_NAMES: { id: Preset; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'focus', label: 'Focus' },
    { id: 'strict', label: 'Strict' },
  ];

  let settings = $state<Settings>(structuredClone(DEFAULT_SETTINGS));
  let now = $state(Date.now());

  const site = $derived(settings.youtube);
  const paused = $derived(site.pausedUntil > now);
  const minutesLeft = $derived(Math.max(1, Math.ceil((site.pausedUntil - now) / 60000)));

  onMount(() => {
    settingsItem.getValue().then((value) => (settings = value));
    return settingsItem.watch((value) => (settings = value));
  });

  // The countdown only ticks while the popup is open and a pause is running.
  $effect(() => {
    if (!paused) return;
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  function save(change: (draft: Settings) => void) {
    const draft = $state.snapshot(settings) as Settings;
    change(draft);
    settings = draft;
    settingsItem.setValue(draft);
  }

  const setPreset = (preset: Preset) =>
    save((s) => {
      s.youtube.preset = preset;
      s.youtube.hide = { ...PRESETS[preset] };
    });

  const setSection = (section: YoutubeSection, hide: boolean) =>
    save((s) => {
      s.youtube.hide[section] = hide;
      s.youtube.preset = matchPreset(s.youtube.hide);
    });

  const pause = () => {
    now = Date.now();
    save((s) => (s.youtube.pausedUntil = now + PAUSE_MS));
  };
  const resume = () => save((s) => (s.youtube.pausedUntil = 0));

  const hiddenCount = $derived(YOUTUBE_SECTIONS.filter((s) => site.hide[s]).length);
  const active = $derived(settings.enabled && site.enabled);
</script>

<main>
  <header class="bar">
    <div class="brand">
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <rect width="128" height="128" rx="30" fill="var(--forest)" />
        <path
          d="M64 64 C53 36 16 36 16 64 C16 92 53 92 64 64 C75 36 112 36 112 64"
          fill="none"
          stroke="var(--lime)"
          stroke-width="17"
          stroke-linecap="round"
        />
        <circle cx="91" cy="86" r="12" fill="var(--lime)" />
      </svg>
      <span>feed<em>fence</em></span>
    </div>
    <span class="label">{settings.enabled ? 'On' : 'Off'}</span>
    <Switch
      checked={settings.enabled}
      label="Feedfence on everywhere"
      onchange={(v) => save((s) => (s.enabled = v))}
    />
  </header>

  <section class="site" aria-labelledby="site-name">
    <div class="site-head">
      <div>
        <h1 id="site-name">YouTube</h1>
        <p class="status">
          {#if !settings.enabled}
            Feedfence is off everywhere
          {:else if !site.enabled}
            Off on YouTube
          {:else if paused}
            Everything shows for {minutesLeft} more min
          {:else}
            <b>{hiddenCount} {hiddenCount === 1 ? 'section' : 'sections'}</b> hidden
          {/if}
        </p>
      </div>
      <Switch
        checked={site.enabled}
        label="Feedfence on YouTube"
        disabled={!settings.enabled}
        onchange={(v) => save((s) => (s.youtube.enabled = v))}
      />
    </div>

    <div class="seg" role="group" aria-label="Preset">
      {#each PRESET_NAMES as p (p.id)}
        <button aria-pressed={site.preset === p.id} disabled={!active} onclick={() => setPreset(p.id)}>
          {p.label}
        </button>
      {/each}
    </div>

    <ul class="hides">
      {#each YOUTUBE_SECTIONS as section (section)}
        <li>
          <span>
            {SECTIONS[section].label}
            {#if SECTIONS[section].note}<small>{SECTIONS[section].note}</small>{/if}
          </span>
          <Switch
            checked={site.hide[section]}
            label={`Hide ${SECTIONS[section].label.toLowerCase()}`}
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
  </section>

  <footer class="foot">
    <span class="label">Changes apply right away</span>
  </footer>
</main>

<style>
  main {
    width: 360px;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg);
  }

  .brand {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 6px;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: -0.03em;
  }

  .brand svg {
    width: 22px;
    height: 22px;
  }

  .brand em {
    font-style: normal;
    color: var(--accent-ink);
  }

  .label {
    font-size: 0.75rem;
    color: var(--text-3);
  }

  .site-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-xs) var(--space-lg) var(--space-md);
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.75rem;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .status {
    margin: 2px 0 0;
    font-size: 0.8125rem;
    color: var(--text-2);
  }

  .status b {
    font-weight: 600;
    color: var(--accent-ink);
  }

  .seg {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0 var(--space-lg) var(--space-md);
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
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }

  .hides small {
    display: block;
    font-size: 0.75rem;
    color: var(--text-3);
  }

  .pause {
    padding: var(--space-md) var(--space-lg) var(--space-lg);
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

  .foot {
    padding: var(--space-md) var(--space-lg);
    border-top: 1px solid var(--line);
  }
</style>
