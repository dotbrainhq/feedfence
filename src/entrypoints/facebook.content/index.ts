import './hide.css';
import { runHiding } from '~/lib/hide-runtime';

// Facebook gives suggested posts and the right column's sponsored block no
// stable attribute, so a small labeler marks them with data-ff-fb="<kind>"
// and the stylesheet hides by that. Each feed item is checked once.

// A post from a page or group you don't follow shows a Follow or Join button.
// English is checked against live Facebook; the other languages need checking.
const FOLLOW = /^(Follow|Join|Seguir|Unirse|Suivre|Rejoindre|Folgen|Beitreten|Segui|Unisciti|Volgen|Lid worden|Obserwuj|Dołącz|Följ|Gå med|Takip et|Katıl|Participar)$/;

function feedItemKind(item: Element): string | null {
  if (!item.querySelector('a[href]')) return null; // not rendered yet; check again later
  // A Stories carousel placed in the feed. Regular posts can link one story
  // (the poster's photo ring), so it takes several distinct ones.
  const stories = new Set([...item.querySelectorAll('a[href*="/stories/"]')].map((a) => a.getAttribute('href')));
  if (stories.size >= 3) return 'stories';
  let seen = 0;
  for (const el of item.querySelectorAll('span, div[role="button"], a')) {
    if (++seen > 300) break; // the button sits in the post header
    if (el.childElementCount === 0 && FOLLOW.test(el.textContent!.trim())) return 'suggested';
  }
  return 'none';
}

/**
 * The right column's sponsored section: climb from its outside (l.php) links
 * while the block holds no other links, so the "Sponsored" heading is
 * included and friend requests or birthdays below it are not.
 */
function markRightRail() {
  const rail = document.querySelector('[data-pagelet="RightRail"]');
  const link = rail?.querySelector('a[href*="l.php"]');
  if (!rail || !link) return;
  let block: Element = link;
  while (block.parentElement && block.parentElement !== rail && !block.parentElement.querySelector('a[href]:not([href*="l.php"])')) {
    block = block.parentElement;
  }
  if (!block.hasAttribute('data-ff-fb')) block.setAttribute('data-ff-fb', 'promoted');
}

/**
 * The friend requests block in the right column: climb from a request link
 * while the block holds a single heading, so its "Friend requests" heading is
 * included and birthdays, ads or contacts under their own headings are not.
 */
function markRequests() {
  const rail = document.querySelector('[data-pagelet="RightRail"]');
  let block = rail?.querySelector('a[href*="/friends/requests"]');
  if (!rail || !block || block.closest('[data-ff-fb]')) return;
  const headings = (el: Element) => el.querySelectorAll('h2, h3, [role="heading"]').length;
  while (block.parentElement && block.parentElement !== rail && headings(block.parentElement) <= 1) block = block.parentElement;
  block.setAttribute('data-ff-fb', 'requests');
}

function scan() {
  for (const item of document.querySelectorAll('[data-pagelet^="FeedUnit"]:not([data-ff-fb])')) {
    const kind = feedItemKind(item);
    if (kind) item.setAttribute('data-ff-fb', kind);
  }
  markRightRail();
  markRequests();
}

export default defineContentScript({
  matches: ['*://www.facebook.com/*'],
  runAt: 'document_start',
  main(ctx) {
    runHiding(ctx, 'facebook');

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
