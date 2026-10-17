import { SNOOZE_MS } from '~/lib/limit';
import { SETTINGS_KEY, type Settings } from '~/lib/settings';
import { SITE_IDS } from '~/lib/sites';
import { updateToolbarIcon } from '~/lib/toolbar-icon';
import { KEEP_DAYS, USAGE_PREFIX, dayKey, lastDayKeys, type DayUsage, type UsageBatch } from '~/lib/usage';

// The single writer for usage stats. Content scripts in every tab send
// batches here, and a queue applies them one at a time so two tabs can't
// overwrite each other's numbers.
const MAX_BATCH_MS = 5 * 60_000;
const MAX_BATCH_PX = 10_000_000;

function isBatch(msg: unknown): msg is UsageBatch {
  const m = msg as UsageBatch;
  return (
    m?.type === 'usage' &&
    SITE_IDS.includes(m.site) &&
    Number.isFinite(m.ms) && m.ms >= 0 && m.ms <= MAX_BATCH_MS &&
    Number.isFinite(m.px) && m.px >= 0 && m.px <= MAX_BATCH_PX
  );
}

async function record(batch: UsageBatch) {
  const key = dayKey();
  const stored = await browser.storage.local.get(key);
  const day = (stored[key] as DayUsage | undefined) ?? {};
  const isNewDay = Object.keys(day).length === 0;
  const site = day[batch.site] ?? { ms: 0, px: 0 };
  day[batch.site] = { ms: site.ms + batch.ms, px: site.px + batch.px };
  await browser.storage.local.set({ [key]: day });
  if (isNewDay) await pruneOldDays();
}

// "5 more minutes" on the limit reminder: one snooze for every tab.
async function snooze() {
  const stored = await browser.storage.local.get(SETTINGS_KEY);
  const settings = stored[SETTINGS_KEY] as Settings | undefined;
  if (!settings?.limit) return;
  settings.limit.snoozedUntil = Date.now() + SNOOZE_MS;
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
}

async function pruneOldDays() {
  const keep = new Set(lastDayKeys(KEEP_DAYS));
  const all = await browser.storage.local.get(null);
  const old = Object.keys(all).filter((k) => k.startsWith(USAGE_PREFIX) && !keep.has(k));
  if (old.length) await browser.storage.local.remove(old);
}

// Chrome doesn't add content scripts to tabs that were already open when the
// extension is installed or updated (Firefox does), so those tabs would get no
// hiding or tracking until refreshed. WXT retires any older copy of a script
// when a new one starts, so injecting again is safe.
type ScriptFiles = NonNullable<Parameters<typeof browser.scripting.executeScript>[0]['files']>;

async function injectIntoOpenTabs() {
  for (const script of browser.runtime.getManifest().content_scripts ?? []) {
    const tabs = await browser.tabs.query({ url: script.matches ?? [] });
    for (const tab of tabs) {
      if (tab.id === undefined || tab.discarded) continue;
      const target = { tabId: tab.id };
      try {
        if (script.css?.length) await browser.scripting.insertCSS({ target, files: script.css as ScriptFiles });
        if (script.js?.length) await browser.scripting.executeScript({ target, files: script.js as ScriptFiles });
      } catch {
        // The tab may have closed or navigated away; it gets scripts on its next load.
      }
    }
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    // The welcome page opens once, on a fresh install, never on updates.
    if (reason === 'install') browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') }).catch(() => {});
    if (!import.meta.env.FIREFOX && (reason === 'install' || reason === 'update')) injectIntoOpenTabs();
  });

  let queue = Promise.resolve();
  browser.runtime.onMessage.addListener((msg, sender) => {
    if (sender.id !== browser.runtime.id) return;
    const type = (msg as { type?: unknown })?.type;
    if (type === 'close-tab' && sender.tab?.id !== undefined) browser.tabs.remove(sender.tab.id).catch(() => {});
    else if (type === 'snooze') snooze().catch(() => {});
    else if (isBatch(msg)) queue = queue.then(() => record(msg)).then(updateToolbarIcon).catch(() => {});
  });

  // The icon follows the limit and today's time: on start, after each batch and when settings change.
  updateToolbarIcon().catch(() => {});
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && SETTINGS_KEY in changes) updateToolbarIcon().catch(() => {});
  });
});
