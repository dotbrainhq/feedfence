<script lang="ts">
  import { untrack } from 'svelte';
  import { CUSTOM_MAX, CUSTOM_MIN, formatLimit, parseCustomMinutes } from '~/lib/limit';

  let { current, onset }: { current: number | null; onset: (minutes: number) => void } = $props();

  // Starts from the current limit once; after that the field is the user's. A number field binds to a
  // number, or null while it's empty or not a number.
  let input = $state<number | null>(untrack(() => current) ?? 45);
  const minutes = $derived(parseCustomMinutes(String(input ?? '')));
  let tried = $state(false);

  function submit(e: SubmitEvent) {
    e.preventDefault();
    tried = true;
    if (minutes !== null) onset(minutes);
  }

  const focusOnMount = (el: HTMLInputElement) => el.select();
</script>

<form class="custom" onsubmit={submit} novalidate>
  <label>
    <span>Minutes a day</span>
    <input
      type="number"
      inputmode="numeric"
      min={CUSTOM_MIN}
      max={CUSTOM_MAX}
      step="5"
      bind:value={input}
      aria-describedby="custom-hint"
      aria-invalid={tried && minutes === null}
      use:focusOnMount
    />
  </label>
  <button type="submit">Set</button>
  <p id="custom-hint" class:error={tried && minutes === null} aria-live="polite">
    {#if minutes !== null}
      {formatLimit(minutes)} a day
    {:else}
      Enter {CUSTOM_MIN} to {CUSTOM_MAX} minutes.
    {/if}
  </p>
</form>

<style>
  .custom {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 6px var(--space-sm);
  }

  label {
    display: grid;
    gap: 2px;
    font-size: 0.75rem;
    color: var(--text-3);
  }

  input {
    width: 92px;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  input[aria-invalid='true'] {
    border-color: #b42318;
  }

  button {
    padding: 6px 14px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--primary-bg);
    color: var(--primary-fg);
    font: inherit;
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  button:hover {
    background: var(--primary-hover);
  }

  input:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  p {
    flex-basis: 100%;
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-3);
  }

  p.error {
    color: #b42318;
  }

  :global(:root[data-theme='dark']) p.error {
    color: #fda29b;
  }

  :global(:root[data-theme='dark']) input[aria-invalid='true'] {
    border-color: #fda29b;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme='light'])) p.error {
      color: #fda29b;
    }

    :global(:root:not([data-theme='light'])) input[aria-invalid='true'] {
      border-color: #fda29b;
    }
  }
</style>
