# Site checks

Sites change their markup without notice, and a hide rule that worked last week can stop matching. Use this page to re-test a site after a report, before a release, or once a month. When you finish a site, update its **Last verified** line in the same pull request as any fix.

## Before you start

1. Run `npm run build`, then load `.output/chrome-mv3` in `chrome://extensions` (or `.output/firefox-mv3/manifest.json` from `about:debugging` in Firefox).
2. Sign in to the site in that browser. Most sections only show for signed-in accounts.
3. In the popup, set the site to **Strict**, so every switch is on. Turn switches off one at a time when a check below says so.
4. After checking in English, switch the site's language and check the rows marked *language*. Those rules match words, so they're the first to break.
5. Scroll for at least a minute on feed pages. Many sections only load further down.

A check passes when the section is gone, nothing around it is broken, and the layout closes up without an empty gap.

## YouTube

**Last verified:** October 17, 2026. Automated (`e2e`, 22 checks, and the layout test, 6 checks), signed out, in English and German.

| Switch | Where to look | Expected |
|---|---|---|
| Shorts | Home, search results, subscriptions, the left menu, a channel page | No Shorts shelf, tab or menu entry. Shorts links in search are gone. |
| Home page recommendations | youtube.com | The grid is replaced by "Home feed hidden by Feedfence." Search and the menu still work. |
| Related videos | Any video | No side column. The player takes the space, unless a playlist, live chat or an open panel needs it. |
| Comments | Any video, scroll down | No comments section. Description stays. |
| End screen suggestions | Skip to the last seconds of a video | No cards or video wall over the player. |
| Sponsored tiles | Home and search | No promoted tiles. Video ads before or during playback are left alone on purpose. |

Also check: going from a video back to search with Shorts hidden keeps them hidden, and turning Feedfence off brings everything back without a reload.

## LinkedIn

**Last verified:** October 16, 2026. By hand in Chrome, signed in, English. Feed and profile pages.

| Switch | Where to look | Expected |
|---|---|---|
| Promoted posts and ads | Feed, scroll down. The right sidebar. | No "Promoted" posts. Sidebar ads gone, and a card holding an ad next to other content keeps the other content. |
| Suggested posts | Feed | No "Suggested" posts from people you don't follow. *language* |
| Recommendations | Feed sidebar. Your profile and someone else's. | No people, jobs, news or Premium cards. On a profile, "People also viewed" and "People you may know" are gone. |
| Games | Feed sidebar | No puzzles card. |
| Your stats | Feed, left column | No profile viewers or post impressions. |
| The whole feed | Feed | "Feed hidden by Feedfence." Posting and search still work. |

Also check: on the feed and on a profile with Focus on, the empty right column collapses and the content centers.

## X

**Last verified:** October 16, 2026. By hand in Chrome, signed in, English. Home, a profile and Explore.

| Switch | Where to look | Expected |
|---|---|---|
| Ads | Home timeline, scroll down | No promoted posts. Not confirmed yet, see below. |
| Trends and news | Right sidebar | No "What's happening". |
| Who to follow | Right sidebar, and suggestion blocks in the timeline | No account suggestions. |
| Premium and Grok prompts | Right sidebar, the left menu, posts | No upsell card, Premium or Grok menu links, or Grok buttons on posts. |
| The whole sidebar | Home | No right sidebar, and the timeline centers. Search stays under Explore. |
| "For you" timeline | Open x.com/home | Home opens on Following. |

## Reddit

**Last verified:** October 16, 2026. Signed-in read-only checks in Chrome (home, a subreddit, Explore), English, plus the stand-in page test (9 checks).

| Switch | Where to look | Expected |
|---|---|---|
| Ads | Home feed, the sidebar, a post's comments, the header | No ad posts, sidebar ad or Advertise button. |
| Community suggestions | Home feed | No community suggestions inside the feed. On Explore, the lists stay. |
| Recent posts | Home sidebar | No Recent posts card. With ads also hidden, the empty sidebar collapses and the feed centers. |
| Menu extras | Left menu | No Popular, News, Explore, Games or Resources. Home and your communities stay. |
| The whole right sidebar | A subreddit | No sidebar, rules included, and the feed centers. In Focus the rules stay. |

## Facebook

**Last verified:** October 16, 2026. By hand in Chrome, signed in, English. Feed only.

| Switch | Where to look | Expected |
|---|---|---|
| Sponsored posts and ads | Feed, scroll down. The right column. | No sponsored posts. The right column's "Sponsored" section is gone, heading included. Feed posts not confirmed yet, see below. |
| Reels | Feed, the top bar, the left menu | No Reels posts or Reels shelf, and no Reels entries. |
| Suggested posts | Feed, scroll down | No posts with a Follow or Join button. *language* |
| Stories | Top of the feed, and carousels inside it | No Stories. |
| Marketplace, Gaming and Watch | Top bar and left menu | Those entries are gone. Groups stays. |
| The whole right column | Feed | No right column, and the feed centers. |

## Time tracking and the limit

Check these after changes to the meter, the limit or the background script, on any site.

1. Use a site for 10 minutes. The popup's Today shows 10 min, within a few seconds.
2. Leave the tab in the background for 5 minutes. Today doesn't grow.
3. Set a 30 min limit with more time than that used today, then open a social tab. The reminder shows and video pauses. "5 more minutes" clears it in every tab.
4. Reload Feedfence with a social tab open, then return to the tab. No errors in its console.
5. Set focus hours to end a minute from now, with Strict, and keep a YouTube tab open. Strict's sections hide right away and come back at the end minute, without a reload.

## Not confirmed yet

- **Facebook and X ads in the feed.** The test browser runs an ad blocker that removes them first. Check with the blocker off.
- **Other languages** for LinkedIn and Facebook suggested posts (rows marked *language*).
- **Reddit ads on comment pages and the Recent posts card**, beyond the stand-in page.
- **Firefox** for LinkedIn, X, Reddit and Facebook, and for the reminder, the toolbar icon and the welcome page.
- **Instagram** has tracking only. Hiding is parked in #21.
