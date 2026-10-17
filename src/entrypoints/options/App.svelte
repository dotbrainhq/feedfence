<script lang="ts">
  import { onMount } from 'svelte';
  import { usageCsv } from '~/lib/export';
  import type { Theme } from '~/lib/settings';
  import { settingsItem } from '~/lib/settings-store';
  import { KEEP_DAYS, USAGE_PREFIX, dayKey, type DayUsage } from '~/lib/usage';
  import { THEME_CACHE_KEY } from '../popup/theme';

  const PRIVACY_URL = 'https://dotbrainhq.com/privacy';

  let theme = $state<Theme>('auto');
  let days = $state<Record<string, DayUsage>>({});
  let confirming = $state(false);
  let notice = $state('');

  const keys = $derived(Object.keys(days).sort());
  const since = $derived(
    keys.length
      ? new Date(`${keys[0]!.slice(USAGE_PREFIX.length)}T00:00`).toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
  );

  const load = async () => {
    const all = await browser.storage.local.get(null);
    days = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(USAGE_PREFIX))) as Record<string, DayUsage>;
  };

  onMount(() => {
    settingsItem.getValue().then((s) => (theme = s.theme ?? 'auto'));
    const unwatch = settingsItem.watch((s) => (theme = s.theme ?? 'auto'));
    load();
    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && Object.keys(changes).some((k) => k.startsWith(USAGE_PREFIX))) load();
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => {
      unwatch();
      browser.storage.onChanged.removeListener(onChanged);
    };
  });

  $effect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_CACHE_KEY, theme);
    } catch {}
  });

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([usageCsv(days)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedfence-${dayKey().slice(USAGE_PREFIX.length)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function deleteHistory() {
    const all = await browser.storage.local.get(null);
    await browser.storage.local.remove(Object.keys(all).filter((k) => k.startsWith(USAGE_PREFIX)));
    confirming = false;
    notice = 'History deleted.';
    await load();
  }
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

  <h1>Your data</h1>
  <p class="lead">Everything Feedfence keeps stays in this browser. Nothing is sent anywhere.</p>

  <section class="card" aria-labelledby="stored">
    <h2 id="stored">What's stored</h2>
    <dl>
      <dt>Time and scroll records</dt>
      <dd>
        {#if keys.length}
          {keys.length} {keys.length === 1 ? 'day' : 'days'}, since {since}
        {:else}
          None yet
        {/if}
      </dd>
      <dt>Settings</dt>
      <dd>What to hide on each site, your daily limit and theme</dd>
    </dl>
    <p class="note">Records older than {KEEP_DAYS} days are deleted on their own. Records hold a total per site per day, never the pages you visited.</p>
  </section>

  <section class="card" aria-labelledby="export">
    <h2 id="export">Export</h2>
    <p>A spreadsheet file with one row per day and site: active minutes and approximate scroll distance in meters.</p>
    <button class="primary" onclick={exportCsv} disabled={!keys.length}>Download CSV</button>
  </section>

  <section class="card" aria-labelledby="delete">
    <h2 id="delete">Delete history</h2>
    <p>Removes every time and scroll record, today's included. Your settings stay.</p>
    {#if confirming}
      <div class="confirm" role="group" aria-label="Confirm delete">
        <p><b>Delete {keys.length} {keys.length === 1 ? 'day' : 'days'} of records?</b> This can't be undone.</p>
        <button class="danger" onclick={deleteHistory}>Delete</button>
        <button class="plain" onclick={() => (confirming = false)}>Cancel</button>
      </div>
    {:else}
      <button
        class="outline"
        disabled={!keys.length}
        onclick={() => {
          notice = '';
          confirming = true;
        }}>Delete history</button
      >
    {/if}
    <p class="status" role="status">{notice}</p>
  </section>

  <p class="foot">
    Removing Feedfence from your browser deletes everything, settings included.
    <a href={PRIVACY_URL} target="_blank" rel="noopener">Privacy policy</a>
  </p>
</main>

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-lg) 48px;
  }

  .top {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .logo {
    width: 28px;
    height: 28px;
  }

  .word {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: -0.03em;
  }

  .word em {
    font-style: normal;
    color: var(--accent-ink);
  }

  h1 {
    margin: 40px 0 var(--space-xs);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(2rem, 6vw, 2.75rem);
    letter-spacing: -0.035em;
    line-height: 1;
  }

  .lead {
    margin: 0 0 var(--space-xl);
    font-size: 1rem;
    color: var(--text-2);
  }

  .card {
    margin-bottom: var(--space-md);
    padding: var(--space-lg) var(--space-xl);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }

  h2 {
    margin: 0 0 var(--space-sm);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: -0.02em;
  }

  .card p {
    margin: 0 0 var(--space-md);
    color: var(--text-2);
  }

  dl {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: var(--space-xs) var(--space-lg);
    margin: 0 0 var(--space-md);
  }

  dt {
    font-weight: 600;
  }

  dd {
    margin: 0;
    color: var(--text-2);
  }

  .card .note {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-3);
  }

  button {
    padding: 10px 18px;
    border-radius: var(--radius-sm);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .primary {
    border: 0;
    background: var(--primary-bg);
    color: var(--primary-fg);
  }

  .primary:hover:not(:disabled) {
    background: var(--primary-hover);
  }

  .outline,
  .plain {
    border: 1px solid var(--line);
    background: transparent;
    color: var(--text);
  }

  .outline:hover:not(:disabled),
  .plain:hover {
    border-color: var(--accent);
  }

  .danger {
    margin-right: var(--space-sm);
    border: 0;
    background: #b42318;
    color: #fff;
  }

  .danger:hover {
    background: #912018;
  }

  .confirm p {
    color: var(--text);
  }

  .card .status {
    margin: var(--space-sm) 0 0;
    font-size: 0.875rem;
    color: var(--accent-ink);
  }

  .card .status:empty {
    display: none;
  }

  .foot {
    margin: var(--space-xl) 0 0;
    font-size: 0.875rem;
    color: var(--text-3);
  }

  .foot a {
    color: var(--accent-ink);
    font-weight: 600;
  }

  @media (max-width: 480px) {
    .card {
      padding: var(--space-lg);
    }

    dl {
      grid-template-columns: minmax(0, 1fr);
    }

    dd {
      margin-bottom: var(--space-sm);
    }
  }
</style>
