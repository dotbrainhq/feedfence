import './hide.css';
import { runHiding } from '~/lib/hide-runtime';

export default defineContentScript({
  // Desktop only for now; the mobile site uses different elements.
  matches: ['*://www.youtube.com/*'],
  runAt: 'document_start',
  main(ctx) {
    // YouTube sizes the video on window resize, not when its column changes.
    // When hiding related videos frees the side column, a resize event lets
    // the player grow into it (and shrink back when the column returns).
    const nudgePlayer = () => requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

    let relatedHidden: boolean | undefined;
    runHiding(ctx, 'youtube', (hidden) => {
      const now = hidden.has('related');
      if (relatedHidden !== undefined && now !== relatedHidden) nudgePlayer();
      relatedHidden = now;
    });
    ctx.addEventListener(document, 'yt-navigate-finish' as keyof DocumentEventMap, nudgePlayer);
  },
});
