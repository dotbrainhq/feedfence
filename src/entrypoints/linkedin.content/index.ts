import './hide.css';
import { runHiding } from '~/lib/hide-runtime';

// LinkedIn's 2026 layout has generated class names and no attribute that sets
// promoted or suggested posts apart, so a small labeler marks feed posts and
// sidebar cards with data-ff-li="<kind>" and the stylesheet hides by that.
// Posts are told apart by their visible label (in the languages below) and
// sidebar cards by where their links go. Each element is checked once.

// Label text per language. English is checked against live LinkedIn; the
// other languages need checking with LinkedIn set to them.
const PROMOTED = /^(Promoted|Promocionado|Promovido|Sponsorisé|Post sponsorisé|Gesponsert|Sponsorizzato|Gepromoot|Promowane|Sponsrad)\b/;
const SUGGESTED = /^(Suggested|Sugerido|Sugerencia|Suggestion|Suggéré|Vorgeschlagen|Suggerito|Voorgesteld|Sugerowane|Föreslaget)$/;
const RECOMMENDATION_LINKS = 'a[href*="/mynetwork/discover-hub"], a[href*="/jobs/"], a[href*="/news/"], a[href*="/premium"]';

const CARD_KINDS: [kind: string, selector: string][] = [
  ['games', 'a[href*="/games/"]'],
  ['stats', 'a[href*="/me/profile-views"], a[href*="/analytics/"]'],
  ['recommendations', RECOMMENDATION_LINKS],
  ['promoted', 'iframe'],
];

function postKind(item: Element): string | null {
  if (!item.querySelector('a[href]')) return null; // not rendered yet; check again later
  let seen = 0;
  for (const el of item.querySelectorAll('span, p, div')) {
    if (++seen > 400) break; // labels sit at the top of a post
    const text = el.firstChild?.nodeType === Node.TEXT_NODE ? el.firstChild.nodeValue!.trim() : '';
    if (!text || text.length > 40) continue;
    if (PROMOTED.test(text)) return 'promoted';
    if (SUGGESTED.test(text)) return 'suggested';
  }
  return item.querySelector(RECOMMENDATION_LINKS) ? 'recommendations' : 'none';
}

/** The children of `el`, skipping wrappers that have a single child. */
function partsOf(el: Element): Element[] {
  let level = el;
  for (let i = 0; i < 8 && level.children.length === 1; i++) level = level.children[0]!;
  return [...level.children];
}

/** Marks the smallest card that holds only one kind of link, so a mixed card keeps its other parts. */
function markCard(card: Element, depth = 0) {
  if (card.hasAttribute('data-ff-li') || depth > 3) return;
  const kinds = CARD_KINDS.filter(([, sel]) => card.querySelector(sel)).map(([kind]) => kind);
  if (!kinds.length) return;
  // People and company links are the content of a card (who to follow, your pages), not its kind.
  const links = card.querySelectorAll('a[href]:not([href*="/in/"]):not([href*="/company/"]):not([href*="/showcase/"])').length;
  const kindLinks = kinds.reduce((n, k) => n + card.querySelectorAll(CARD_KINDS.find(([kind]) => kind === k)![1]).length, 0);
  if (kinds.length === 1 && (kindLinks >= links || kinds[0] === 'promoted' && links === 0)) {
    card.setAttribute('data-ff-li', kinds[0]!);
    return;
  }
  for (const part of partsOf(card)) markCard(part, depth + 1);
}

function scan() {
  const feed = document.querySelector('[data-testid="mainFeed"]');
  if (feed) {
    for (const item of feed.children) {
      if (item.hasAttribute('data-ff-li')) continue;
      const kind = postKind(item);
      if (kind) item.setAttribute('data-ff-li', kind);
    }
  }
  for (const aside of document.querySelectorAll('aside')) {
    for (const card of partsOf(aside)) markCard(card);
  }
}

export default defineContentScript({
  matches: ['*://www.linkedin.com/*'],
  runAt: 'document_start',
  main(ctx) {
    runHiding(ctx, 'linkedin');

    // One scan per frame at most, before paint, so new posts are marked before they show.
    let queued = false;
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    };
    const observer = new MutationObserver(queue);
    const start = () => {
      observer.observe(document.body, { childList: true, subtree: true });
      queue();
    };
    if (document.body) start();
    else ctx.addEventListener(document, 'DOMContentLoaded', start);
    ctx.onInvalidated(() => observer.disconnect());
  },
});
