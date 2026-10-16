<script lang="ts">
  import type { Theme } from '~/lib/settings';

  let { value, onchange }: { value: Theme; onchange: (theme: Theme) => void } = $props();

  const OPTIONS: { id: Theme; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];
</script>

<div class="theme" role="group" aria-label="Popup theme">
  <span>Theme</span>
  {#each OPTIONS as o (o.id)}
    <button aria-pressed={value === o.id} title={o.id === 'auto' ? 'Follow the browser' : undefined} onclick={() => onchange(o.id)}>
      {o.label}
    </button>
  {/each}
</div>

<style>
  .theme {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.75rem;
    color: var(--text-3);
  }

  span {
    margin-right: var(--space-xs);
  }

  button {
    padding: 3px 8px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--text-2);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  button[aria-pressed='true'] {
    background: var(--surface-2);
    color: var(--text);
  }

  button:hover {
    color: var(--text);
  }

  button:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 1px;
  }
</style>
