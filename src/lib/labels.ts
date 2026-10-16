import type { HideSite } from './settings';

/** Popup wording for each site's sections. Kept apart from settings so content scripts don't ship it. */
export const SECTION_LABELS: Record<HideSite, Record<string, { label: string; note?: string }>> = {
  youtube: {
    shorts: { label: 'Shorts', note: 'Everywhere on the site' },
    home: { label: 'Home page recommendations', note: 'Search and subscriptions stay' },
    related: { label: 'Related videos', note: 'Next to the player' },
    comments: { label: 'Comments' },
    endscreen: { label: 'End screen suggestions', note: 'Cards and suggestions on the player' },
    sponsored: { label: 'Sponsored tiles', note: 'Video ads are left alone' },
  },
  linkedin: {
    promoted: { label: 'Promoted posts and ads', note: 'In the feed and the sidebar' },
    suggested: { label: 'Suggested posts', note: "From people you don't follow" },
    recommendations: { label: 'Recommendations', note: 'People, jobs, news and Premium prompts' },
    games: { label: 'Games', note: "Today's puzzles" },
    stats: { label: 'Your stats', note: 'Profile viewers and post impressions' },
    feed: { label: 'The whole feed', note: 'Posting and search stay' },
  },
  x: {
    promoted: { label: 'Ads', note: 'Promoted posts in the timeline' },
    trends: { label: 'Trends and news', note: "What's happening in the sidebar" },
    follow: { label: 'Who to follow', note: 'Account suggestions' },
    premium: { label: 'Premium and Grok prompts', note: 'Upsell card, Grok buttons and menu links' },
    sidebar: { label: 'The whole sidebar', note: 'Search stays under Explore' },
    foryou: { label: '"For you" timeline', note: 'Home opens on Following instead' },
  },
};
