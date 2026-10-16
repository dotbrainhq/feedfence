# Changelog

Every change worth knowing about in Feedfence. Versions follow [semantic versioning](https://semver.org).

## Unreleased

### Fixed

- LinkedIn: a sidebar card that holds an ad next to other content now hides only the ad.
- LinkedIn profile pages: suggestion cards in the sidebar ("People also viewed", "People you may know", viewer teasers) are hidden with Recommendations, and with Recommendations and ads hidden the sidebar collapses and the profile centers.
- Chrome: tabs already open when Feedfence is installed or updated now get hiding and tracking without a refresh.
- Popup: both tabs fit in the space browsers allow, so there are no scrollbars.
- Removed `web-ext` from the dependencies, which drops the `node-forge` security alert. The Firefox lint downloads it on demand.

### Added

- Reddit: hide ads, community suggestions in feeds, the Recent posts card, left menu extras (Popular, News, Explore, Games and Resources), or the whole right sidebar, with Light, Focus and Strict presets. The home feed centers once its sidebar is empty.
- X: hide ads, trends and news, who to follow, Premium and Grok prompts, the whole sidebar (the timeline re-centers), or the "For you" timeline (Home opens on Following instead), with Light, Focus and Strict presets.
- LinkedIn: hide promoted posts and ads, suggested posts, recommendations, games, your stats, or the whole feed, with Light, Focus and Strict presets.
- Popup: Today comes first, and a Sites tab lists every site with its status and on/off switch. Click a site for its settings; on a supported site the popup opens straight there.
- Layout closes up around hidden sections: on LinkedIn the feed re-centers and widens when the right sidebar is empty, and on YouTube the player takes the side column when related videos are hidden and nothing else is showing there.
- Time and scroll tracking on YouTube, X, Reddit, LinkedIn, Instagram and Facebook. Time counts only while a tab is in front and in use, or a video is playing.
- Popup: a Today tab with total time, scroll distance compared to the Eiffel Tower, and each site's time with its last 7 days.
- Popup: choose an Auto, Light or Dark theme.
- YouTube: hide Shorts, home recommendations, related videos, comments, end screen suggestions and sponsored tiles, with Light, Focus and Strict presets.
- Popup: per-section switches that apply right away, an on/off switch for YouTube and for Feedfence as a whole, and "Show everything for 5 min".
- Project setup: WXT, Svelte 5 and TypeScript, building for Chrome and Firefox from one codebase.
- Extension icons at 16, 32, 48 and 128 px.
- Placeholder popup with the Feedfence brand.
- Issue and pull request templates, security policy and CI.
