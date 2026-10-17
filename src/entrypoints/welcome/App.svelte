<script lang="ts">
  import { onMount } from 'svelte';
  import CustomLimit from '~/components/CustomLimit.svelte';
  import { LIMIT_OPTIONS, changeLimit, effectiveLimit, formatLimit, isCustomLimit } from '~/lib/limit';
  import {
    DEFAULT_SETTINGS,
    HIDE_SITES,
    presetMap,
    siteSettings,
    type Preset,
    type Settings,
    type Theme,
  } from '~/lib/settings';
  import { settingsItem } from '~/lib/settings-store';
  import { THEME_CACHE_KEY } from '../popup/theme';

  const PRESETS: { id: Preset; name: string; lead: string; items: string[] }[] = [
    { id: 'light', name: 'Light', lead: 'Just the ads', items: ['Sponsored posts', 'Promoted tiles and cards'] },
    {
      id: 'focus',
      name: 'Focus',
      lead: 'Ads, plus the parts built to keep you scrolling',
      items: ['Shorts, Reels and Stories', 'Suggested posts and trends', 'Related videos and end screens'],
    },
    {
      id: 'strict',
      name: 'Strict',
      lead: 'Only what you came for',
      items: ['Everything in Focus', 'Home feeds and For you', 'Sidebars and menu extras'],
    },
  ];

  const isFirefox = import.meta.env.FIREFOX;

  let settings = $state<Settings>(structuredClone(DEFAULT_SETTINGS));
  let saved = $state(false);

  const theme = $derived<Theme>(settings.theme ?? 'auto');
  const limit = $derived(effectiveLimit(settings.limit));
  /** The preset every site shares, or null once sites differ. */
  const preset = $derived.by(() => {
    const presets = new Set(HIDE_SITES.map((site) => siteSettings(settings, site).preset));
    return presets.size === 1 ? [...presets][0]! : null;
  });

  onMount(() => {
    settingsItem.getValue().then((value) => (settings = value));
    return settingsItem.watch((value) => (settings = value));
  });

  $effect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_CACHE_KEY, theme);
    } catch {}
  });

  function save(change: (draft: Settings) => void) {
    const draft = $state.snapshot(settings) as Settings;
    change(draft);
    settings = draft;
    settingsItem.setValue(draft);
    saved = true;
  }

  const choosePreset = (id: Preset) =>
    save((draft) => {
      for (const site of HIDE_SITES) draft[site] = { ...siteSettings(draft, site), preset: id, hide: presetMap(site, id) };
    });

  // The first choice here follows the usual rule (raising waits a day). After that,
  // changing your mind on this page applies at once: it's setup, not a way around a reminder.
  let limitSetHere = false;
  let customOpen = $state(false);
  const chooseLimit = (minutes: number | null) => {
    customOpen = false;
    save((draft) => {
      const next = limitSetHere ? { minutes } : changeLimit(draft.limit, minutes);
      draft.limit = { ...next, snoozedUntil: draft.limit?.snoozedUntil };
    });
    limitSetHere = true;
  };

  // Arrow keys move between presets, as in any radio group.
  function onPresetKey(e: KeyboardEvent, i: number) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = PRESETS[(i + step + PRESETS.length) % PRESETS.length]!;
    choosePreset(next.id);
    document.getElementById(`preset-${next.id}`)?.focus();
  }

  const done = () =>
    browser.tabs.getCurrent().then((tab) => (tab?.id !== undefined ? browser.tabs.remove(tab.id) : window.close()));
</script>

<main>
  <header class="top">
    <svg class="logo" viewBox="0 0 128 128" aria-hidden="true">
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
    <span class="word">feed<em>fence</em></span>
  </header>

  <section class="hero">
    <div>
      <p class="kicker">Feedfence is on</p>
      <h1>Hide the parts of social sites you didn't ask for.</h1>
      <p class="sub">Two quick choices and you're set. Both save as you go, and you can change them anytime from the toolbar.</p>
    </div>
    <svg class="loop" viewBox="10 30 108 68" aria-hidden="true">
      <path class="track" d="M64 64 C52 38 18 38 18 64 C18 90 52 90 64 64 C76 38 110 38 110 64" />
      <path class="draw" d="M64 64 C52 38 18 38 18 64 C18 90 52 90 64 64 C76 38 110 38 110 64" pathLength="100" />
      <circle class="dot" cx="90" cy="84" r="7" />
    </svg>
  </section>

  <section class="step" aria-labelledby="step-hide">
    <span class="num" aria-hidden="true">1</span>
    <div class="body">
      <h2 id="step-hide">How much to hide</h2>
      <p class="note">For YouTube, X, Reddit, LinkedIn and Facebook. Each site can be fine-tuned later in the popup.</p>
      <div class="presets" role="radiogroup" aria-labelledby="step-hide">
        {#each PRESETS as p, i (p.id)}
          <button
            id={`preset-${p.id}`}
            class="preset"
            role="radio"
            aria-checked={preset === p.id}
            tabindex={preset === p.id || (preset === null && i === 0) ? 0 : -1}
            onclick={() => choosePreset(p.id)}
            onkeydown={(e) => onPresetKey(e, i)}
          >
            <span class="name">
              {p.name}
              {#if p.id === 'focus'}<span class="tag">Recommended</span>{/if}
            </span>
            <span class="lead">{p.lead}</span>
            <ul>
              {#each p.items as item (item)}<li>{item}</li>{/each}
            </ul>
          </button>
        {/each}
      </div>
      {#if preset === null}<p class="note">Your sites use different settings. Pick one to apply it everywhere.</p>{/if}
    </div>
  </section>

  <section class="step" aria-labelledby="step-limit">
    <span class="num" aria-hidden="true">2</span>
    <div class="body">
      <h2 id="step-limit">A daily limit <span class="opt">optional</span></h2>
      <p class="note">One limit across all social sites. When you reach it, a reminder offers to close the tab or give you 5 more minutes.</p>
      <div class="chips" role="group" aria-label="Daily limit">
        <button aria-pressed={limit === null} onclick={() => chooseLimit(null)}>No limit</button>
        {#each LIMIT_OPTIONS as m (m)}
          <button aria-pressed={limit === m} onclick={() => chooseLimit(m)}>{formatLimit(m)}</button>
        {/each}
        <button aria-pressed={isCustomLimit(limit)} aria-expanded={customOpen} onclick={() => (customOpen = !customOpen)}>
          {isCustomLimit(limit) && limit !== null ? formatLimit(limit) : 'Custom'}
        </button>
      </div>
      {#if customOpen}
        <div class="custom-row"><CustomLimit current={limit} onset={chooseLimit} /></div>
      {/if}
    </div>
  </section>

  <section class="facts" aria-label="What Feedfence keeps">
    <div>
      <h3>Counts only real use</h3>
      <p>Time adds up while a social tab is in front and you're using it, or a video is playing.</p>
    </div>
    <div>
      <h3>Stays in this browser</h3>
      <p>Time and scroll distance are kept for 30 days on this device. No account, no analytics, no network requests.</p>
    </div>
    <div>
      <h3>Pin it for the numbers</h3>
      {#if isFirefox}
        <p>Open the Extensions menu in the toolbar, then Feedfence's gear, then Pin to Toolbar.</p>
      {:else}
        <p>Click the puzzle piece in the toolbar, then the pin next to Feedfence.</p>
      {/if}
    </div>
  </section>

  <footer class="end">
    <span class="status" role="status">{saved ? 'Saved' : ''}</span>
    <button class="done" onclick={done}>Done</button>
  </footer>
</main>

<style>
  main {
    max-width: 880px;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-lg) 48px;
  }

  .top {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .logo {
    width: 32px;
    height: 32px;
  }

  .word {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.375rem;
    letter-spacing: -0.03em;
  }

  .word em {
    font-style: normal;
    color: var(--accent-ink);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-xl);
    padding: 56px 0 48px;
  }

  .kicker {
    margin: 0 0 var(--space-sm);
    font-weight: 600;
    font-size: 0.8125rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-ink);
  }

  h1 {
    margin: 0;
    max-width: 16ch;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(2rem, 6vw, 3.25rem);
    letter-spacing: -0.035em;
    line-height: 1.02;
  }

  .sub {
    max-width: 46ch;
    margin: var(--space-lg) 0 0;
    font-size: 1rem;
    color: var(--text-2);
  }

  .loop {
    width: 220px;
    overflow: visible;
  }

  .loop path {
    fill: none;
    stroke-width: 10;
    stroke-linecap: round;
  }

  .track {
    stroke: var(--surface-2);
  }

  .draw {
    stroke: var(--accent);
    stroke-dasharray: 100 100;
    stroke-dashoffset: 100;
    animation: draw var(--dur-draw) var(--ease-out) 200ms forwards;
  }

  .dot {
    fill: var(--accent);
    opacity: 0;
    transform-box: fill-box;
    animation: land 240ms var(--ease-out) 1100ms forwards;
  }

  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes land {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .step {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr);
    gap: var(--space-lg);
    padding: var(--space-xl) 0;
    border-top: 1px solid var(--line);
  }

  .num {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 3rem;
    line-height: 0.9;
    color: var(--accent);
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.5rem;
    letter-spacing: -0.02em;
  }

  .opt {
    margin-left: 6px;
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.8125rem;
    letter-spacing: 0;
    color: var(--text-3);
  }

  .note {
    margin: var(--space-xs) 0 var(--space-lg);
    color: var(--text-2);
  }

  .presets {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .preset {
    display: grid;
    align-content: start;
    gap: var(--space-xs);
    padding: var(--space-lg);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color var(--dur) var(--ease-out);
  }

  .preset:hover {
    border-color: var(--accent);
  }

  .preset[aria-checked='true'] {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }

  .preset:focus-visible,
  .chips button:focus-visible,
  .done:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .name {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: -0.02em;
  }

  .tag {
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--primary-bg);
    color: var(--primary-fg);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.6875rem;
    letter-spacing: 0;
  }

  .lead {
    font-weight: 600;
    color: var(--text-2);
  }

  .preset ul {
    margin: var(--space-sm) 0 0;
    padding: 0;
    list-style: none;
    color: var(--text-2);
  }

  .preset li {
    position: relative;
    padding-left: 16px;
  }

  .preset li::before {
    content: '';
    position: absolute;
    top: 0.6em;
    left: 2px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .chips button {
    padding: 8px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .chips button:hover {
    border-color: var(--accent);
  }

  .chips button[aria-pressed='true'] {
    border-color: var(--primary-bg);
    background: var(--primary-bg);
    color: var(--primary-fg);
  }

  .custom-row {
    margin-top: var(--space-md);
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-lg);
    margin-top: var(--space-md);
    padding: var(--space-xl);
    border-radius: var(--radius);
    background: var(--surface-2);
  }

  h3 {
    margin: 0 0 var(--space-xs);
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .facts p {
    margin: 0;
    color: var(--text-2);
  }

  .end {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-lg);
    padding-top: var(--space-xl);
  }

  .status {
    color: var(--text-3);
  }

  .done {
    padding: 12px 28px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--primary-bg);
    color: var(--primary-fg);
    font: inherit;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }

  .done:hover {
    background: var(--primary-hover);
  }

  @media (max-width: 720px) {
    .hero {
      grid-template-columns: minmax(0, 1fr);
      padding: 32px 0;
    }

    .loop {
      display: none;
    }

    .step {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-sm);
    }

    .num {
      font-size: 2rem;
    }

    .presets,
    .facts {
      grid-template-columns: minmax(0, 1fr);
    }

    .done {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .draw {
      animation: none;
      stroke-dashoffset: 0;
    }

    .dot {
      animation: none;
      opacity: 1;
    }
  }
</style>
