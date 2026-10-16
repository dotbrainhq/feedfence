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
  reddit: {
    promoted: { label: 'Ads', note: 'In feeds, the sidebar and comments' },
    suggested: { label: 'Community suggestions', note: 'Placed inside the feed' },
    recent: { label: 'Recent posts', note: 'The sidebar card' },
    popular: { label: 'Menu extras', note: 'Popular, News, Explore, Games, Resources' },
    sidebar: { label: 'The whole right sidebar', note: 'Community info and rules too' },
  },
  facebook: {
    promoted: { label: 'Sponsored posts and ads', note: 'In the feed and the right column' },
    reels: { label: 'Reels', note: 'In the feed, top bar and left menu' },
    suggested: { label: 'Suggested posts', note: "From pages and groups you don't follow" },
    stories: { label: 'Stories', note: 'At the top of and inside the feed' },
    menu: { label: 'Marketplace, Gaming and Watch', note: 'In the top bar and the left menu' },
    rightcol: { label: 'The whole right column', note: 'Friend requests, birthdays, contacts' },
  },
};
