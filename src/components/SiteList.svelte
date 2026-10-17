<script lang="ts">
  import Switch from './Switch.svelte';
  import { DEFAULT_FOCUS, focusStatus, inFocus } from '~/lib/schedule';
  import { HIDE_SITES, SECTIONS, activeHides, siteSettings, type HideSite, type Settings } from '~/lib/settings';
  import { SITES, siteName } from '~/lib/sites';

  let {
    settings,
    save,
    here,
    onopen,
    onfocus,
  }: {
    settings: Settings;
    save: (change: (draft: Settings) => void) => void;
    here: HideSite | null;
    onopen: (site: HideSite) => void;
    onfocus: () => void;
  } = $props();

  const now = Date.now();
  const focus = $derived({ ...DEFAULT_FOCUS, ...settings.focus });
  const focusNow = $derived(inFocus(focus, new Date(now)) ? focus.preset : null);
  const focusLine = $derived(
    focus.on ? `${focusStatus(focus, new Date(now))} · ${focus.preset === 'strict' ? 'Strict' : 'Focus'}` : 'Off',
  );

  // Sites with time tracking but no hide rules yet.
  const trackedOnly = SITES.filter((s) => !(HIDE_SITES as string[]).includes(s.id)).map((s) => s.name);
  const trackedList = trackedOnly.length > 1 ? `${trackedOnly.slice(0, -1).join(', ')} and ${trackedOnly.at(-1)}` : (trackedOnly[0] ?? '');

  function status(site: HideSite): string {
    const s = siteSettings(settings, site);
    if (!settings.enabled) return 'Feedfence is off everywhere';
    if (!s.enabled) return 'Off';
    if (s.pausedUntil > now) return `Everything shows for ${Math.max(1, Math.ceil((s.pausedUntil - now) / 60000))} more min`;
    const total = SECTIONS[site].length;
    const hidden = activeHides(settings, site, now, focusNow).length;
    return `${hidden} of ${total} sections hidden${focusNow ? ' for focus hours' : ''}`;
  }

  const setEnabled = (site: HideSite, enabled: boolean) =>
    save((draft) => {
      const s = siteSettings(draft, site);
      s.enabled = enabled;
      draft[site] = s;
    });
</script>

<ul class="list">
  <li class="focus-row">
    <button class="open" onclick={onfocus}>
      <span class="text">
        <span class="name">Focus hours</span>
        <span class="status" class:running={focusNow}>{focusLine}</span>
      </span>
      <svg class="chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
    </button>
    <Switch
      checked={focus.on}
      label="Focus hours on"
      disabled={!settings.enabled}
      onchange={(v) => save((draft) => (draft.focus = { ...DEFAULT_FOCUS, ...draft.focus, on: v }))}
    />
  </li>
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

{#if trackedList}<p class="note">{trackedList}: time only for now.</p>{/if}

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
    padding: 10px 0;
    border: 0;
    background: transparent;
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .focus-row {
    border-bottom-width: 2px;
  }

  .status.running {
    font-weight: 600;
    color: var(--accent-ink);
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
