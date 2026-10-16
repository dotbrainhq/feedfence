<script lang="ts">
  import Switch from './Switch.svelte';
  import { HIDE_SITES, SECTIONS, siteSettings, type HideSite, type Settings } from '~/lib/settings';
  import { siteName } from '~/lib/sites';

  let {
    settings,
    save,
    here,
    onopen,
  }: {
    settings: Settings;
    save: (change: (draft: Settings) => void) => void;
    here: HideSite | null;
    onopen: (site: HideSite) => void;
  } = $props();

  const now = Date.now();

  function status(site: HideSite): string {
    const s = siteSettings(settings, site);
    if (!settings.enabled) return 'Feedfence is off everywhere';
    if (!s.enabled) return 'Off';
    if (s.pausedUntil > now) return `Everything shows for ${Math.max(1, Math.ceil((s.pausedUntil - now) / 60000))} more min`;
    const total = SECTIONS[site].length;
    const hidden = SECTIONS[site].filter((x) => s.hide[x]).length;
    return `${hidden} of ${total} sections hidden`;
  }

  const setEnabled = (site: HideSite, enabled: boolean) =>
    save((draft) => {
      const s = siteSettings(draft, site);
      s.enabled = enabled;
      draft[site] = s;
    });
</script>

<ul class="list">
  {#each HIDE_SITES as site (site)}
    <li>
      <button class="open" onclick={() => onopen(site)}>
        <span class="text">
          <span class="name">
            {siteName(site)}
            {#if here === site}<span class="here">This tab</span>{/if}
          </span>
          <span class="status">{status(site)}</span>
        </span>
        <svg class="chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
      </button>
      <Switch
        checked={siteSettings(settings, site).enabled}
        label={`Feedfence on ${siteName(site)}`}
        disabled={!settings.enabled}
        onchange={(v) => setEnabled(site, v)}
      />
    </li>
  {/each}
</ul>

<p class="note">More sites are on the way. Time is already counted on X, Reddit, Instagram and Facebook.</p>

<style>
  .list {
    margin: 0;
    padding: 0 var(--space-lg);
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    border-top: 1px solid var(--line);
  }

  li:last-child {
    border-bottom: 1px solid var(--line);
  }

  .open {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
    padding: var(--space-md) 0;
    border: 0;
    background: transparent;
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .text {
    display: grid;
    flex: 1;
    gap: 2px;
    min-width: 0;
  }

  .open:hover .name {
    color: var(--accent-ink);
  }

  .open:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  .name {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.125rem;
    letter-spacing: -0.02em;
    transition: color var(--dur-fast) var(--ease-out);
  }

  .here {
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.6875rem;
    letter-spacing: 0;
    color: var(--accent-ink);
  }

  .status {
    font-size: 0.8125rem;
    color: var(--text-2);
  }

  .chevron {
    width: 14px;
    height: 14px;
    margin-right: var(--space-sm);
    fill: none;
    stroke: var(--text-3);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .note {
    margin: 0;
    padding: var(--space-md) var(--space-lg);
    font-size: 0.75rem;
    color: var(--text-3);
  }
</style>
