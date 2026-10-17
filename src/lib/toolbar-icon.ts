import { effectiveLimit, formatLimit } from './limit';
import { SETTINGS_KEY, type Settings } from './settings';
import { dayKey, totalMs, type DayUsage } from './usage';

// The toolbar glyph from the brand kit's small icon. The loop fills as today's
// time adds up and the dot lands at the limit, so a full icon means "full stop".
const LOOP = 'M64 64 C53 36 16 36 16 64 C16 92 53 92 64 64 C75 36 112 36 112 64';
const LOOP_LENGTH = 209.5; // measured from LOOP
const FOREST = '#003820';
const LIME = '#bef050';
const TRACK = 'rgb(190 240 80 / 0.3)';

function draw(size: number, share: number): ImageData {
  const c = new OffscreenCanvas(size, size).getContext('2d')!;
  c.scale(size / 128, size / 128);
  c.fillStyle = FOREST;
  c.beginPath();
  c.roundRect(0, 0, 128, 128, 30);
  c.fill();

  const loop = new Path2D(LOOP);
  c.lineWidth = 17;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = TRACK;
  c.stroke(loop);
  if (share > 0) {
    c.setLineDash([LOOP_LENGTH * share, LOOP_LENGTH]);
    c.strokeStyle = LIME;
    c.stroke(loop);
  }

  c.beginPath();
  c.arc(91, 86, 12, 0, Math.PI * 2);
  c.fillStyle = share >= 1 ? LIME : TRACK;
  c.fill();
  return c.getImageData(0, 0, size, size);
}

let shown = ''; // last icon drawn
let titled = ''; // last title set

let queue = Promise.resolve();

/** Sets the toolbar icon from today's usage and the daily limit. Cheap to call often. */
export function updateToolbarIcon() {
  // One update at a time, so an older read can't land after a newer one.
  queue = queue.then(apply, apply);
  return queue;
}

async function apply() {
  const key = dayKey();
  const stored = await browser.storage.local.get([SETTINGS_KEY, key]);
  const settings = stored[SETTINGS_KEY] as Settings | undefined;
  const limit = settings?.enabled === false ? null : effectiveLimit(settings?.limit, key);

  if (limit === null || typeof OffscreenCanvas === 'undefined') {
    if (shown === 'default') return;
    shown = titled = 'default';
    await browser.action.setIcon({ path: { 16: '/icon/16.png', 32: '/icon/32.png' } });
    await browser.action.setTitle({ title: 'Feedfence' });
    return;
  }

  const used = totalMs(stored[key] as DayUsage | undefined);
  // Steps of 5% keep redraws rare; the dot only lands at the limit itself.
  const share = used >= limit * 60_000 ? 1 : Math.min(0.95, Math.floor((used / (limit * 60_000)) * 20) / 20);
  if (String(share) !== shown) {
    shown = String(share);
    await browser.action.setIcon({ imageData: { 16: draw(16, share), 32: draw(32, share) } });
  }
  const title = `Feedfence: ${formatLimit(Math.round(used / 60_000))} of ${formatLimit(limit)} today`;
  if (title !== titled) {
    titled = title;
    await browser.action.setTitle({ title });
  }
}
