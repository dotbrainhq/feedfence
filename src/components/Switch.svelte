<script lang="ts">
  let {
    checked,
    label,
    disabled = false,
    onchange,
  }: { checked: boolean; label: string; disabled?: boolean; onchange: (next: boolean) => void } = $props();
</script>

<button
  class="switch"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  {disabled}
  onclick={() => onchange(!checked)}
></button>

<style>
  .switch {
    position: relative;
    flex: none;
    width: 34px;
    height: 20px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--switch-off);
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out);
  }

  .switch::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--knob);
    transition: transform var(--dur) var(--ease-out);
  }

  .switch[aria-checked='true'] {
    background: var(--switch-on);
  }

  .switch[aria-checked='true']::after {
    transform: translateX(14px);
    background: var(--knob-on);
  }

  .switch:hover:not(:disabled) {
    filter: brightness(0.95);
  }

  .switch:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .switch:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
