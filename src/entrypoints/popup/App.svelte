<script lang="ts">
  const version = browser.runtime.getManifest().version;
</script>

<main>
  <header>
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
    <span class="wordmark">feed<em>fence</em></span>
  </header>

  <p>Hiding and stats arrive in the next builds.</p>
  <p class="version">Version {version}</p>
</main>

<style>
  main {
    width: 360px;
    padding: var(--space-lg);
  }

  header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-lg);
  }

  svg {
    width: 28px;
    height: 28px;
  }

  .wordmark {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.375rem;
    letter-spacing: -0.03em;
  }

  .wordmark em {
    font-style: normal;
    color: var(--accent-ink);
  }

  p {
    margin: 0 0 var(--space-sm);
    color: var(--text-2);
  }

  .version {
    font-size: 0.75rem;
    color: var(--text-3);
  }
</style>
