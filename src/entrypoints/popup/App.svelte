<script lang="ts">
  import { onMount } from 'svelte';
  import SiteList from '~/components/SiteList.svelte';
  import SitePanel from '~/components/SitePanel.svelte';
  import Switch from '~/components/Switch.svelte';
  import ThemePicker from '~/components/ThemePicker.svelte';
  import TodayPanel from '~/components/TodayPanel.svelte';
  import { DEFAULT_SETTINGS, HIDE_SITES, type HideSite, type Settings, type Theme } from '~/lib/settings';
  import { settingsItem } from '~/lib/settings-store';
  import { siteForHost } from '~/lib/sites';
  import { THEME_CACHE_KEY } from './theme';

  type Tab = 'site' | 'today';

  let settings = $state<Settings>(structuredClone(DEFAULT_SETTINGS));
  let tab = $state<Tab | null>(null);
  /** The site whose settings are open, or null for the list of sites. */
  let site = $state<HideSite | null>(null);
  let here = $state<HideSite | null>(null);
  const TABS: { id: Tab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'site', label: 'Sites' },
  ];
  const theme = $derived<Theme>(settings.theme ?? 'auto');

  onMount(() => {
    settingsItem.getValue().then((value) => (settings = value));
    // On a site with hide rules the popup opens on that site; everywhere else, on Today.
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(([t]) => {
        const onSite = t?.url ? siteForHost(new URL(t.url).hostname) : undefined;
        if (onSite && (HIDE_SITES as string[]).includes(onSite)) {
          here = site = onSite as HideSite;
          tab = 'site';
        } else tab = 'today';
      })
      .catch(() => (tab = 'today'));
    return settingsItem.watch((value) => (settings = value));
  });

  $effect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    // A local copy lets main.ts apply the theme before the first paint next time.
    try {
      localStorage.setItem(THEME_CACHE_KEY, theme);
    } catch {}
  });

  function save(change: (draft: Settings) => void) {
    const draft = $state.snapshot(settings) as Settings;
    change(draft);
    settings = draft;
    settingsItem.setValue(draft);
  }

  function onTabKey(e: KeyboardEvent, i: number) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    const next = TABS[(i + step + TABS.length) % TABS.length]!;
    tab = next.id;
    document.getElementById(`tab-${next.id}`)?.focus();
  }
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

  {#if tab}
    <div class="tabs" role="tablist" aria-label="Views">
      {#each TABS as t, i (t.id)}
        <button
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={tab === t.id}
          aria-controls={`panel-${t.id}`}
          tabindex={tab === t.id ? 0 : -1}
          onclick={() => (tab = t.id)}
          onkeydown={(e) => onTabKey(e, i)}
        >
          {t.label}
        </button>
      {/each}
    </div>

    <div class="panel" id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {#if tab === 'site'}
        {#if site}
          <SitePanel {settings} {save} {site} onback={() => (site = null)} />
        {:else}
          <SiteList {settings} {save} {here} onopen={(s) => (site = s)} />
        {/if}
      {:else}
        <TodayPanel />
      {/if}
    </div>
  {/if}

  <footer class="foot">
    <ThemePicker value={theme} onchange={(t) => save((s) => (s.theme = t))} />
  </footer>
</main>

<style>
  main {
    width: 360px;
    min-height: 520px;
    display: flex;
    flex-direction: column;
  }

  .panel {
    flex: 1;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg) var(--space-sm);
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

  .tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2px;
    margin: var(--space-xs) var(--space-lg) var(--space-sm);
    padding: 3px;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
  }

  .tabs button {
    padding: 6px 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--text-2);
    font: inherit;
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .tabs button[aria-selected='true'] {
    background: var(--bg);
    color: var(--text);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
  }

  .tabs button:hover {
    color: var(--text);
  }

  .tabs button:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 1px;
  }

  .foot {
    display: flex;
    justify-content: flex-end;
    padding: var(--space-sm) var(--space-lg);
    border-top: 1px solid var(--line);
  }
</style>
