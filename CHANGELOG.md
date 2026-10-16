# Changelog

Every change worth knowing about in Feedfence. Versions follow [semantic versioning](https://semver.org).

## Unreleased

### Fixed

- Chrome: tabs already open when Feedfence is installed or updated now get hiding and tracking without a refresh.
- Popup: both tabs fit in the space browsers allow, so there are no scrollbars.
- Removed `web-ext` from the dependencies, which drops the `node-forge` security alert. The Firefox lint downloads it on demand.

### Added

- Time and scroll tracking on YouTube, X, Reddit, LinkedIn, Instagram and Facebook. Time counts only while a tab is in front and in use, or a video is playing.
- Popup: a Today tab with total time, scroll distance compared to the Eiffel Tower, and each site's time with its last 7 days.
- Popup: choose an Auto, Light or Dark theme.
- YouTube: hide Shorts, home recommendations, related videos, comments, end screen suggestions and sponsored tiles, with Light, Focus and Strict presets.
- Popup: per-section switches that apply right away, an on/off switch for YouTube and for Feedfence as a whole, and "Show everything for 5 min".
- Project setup: WXT, Svelte 5 and TypeScript, building for Chrome and Firefox from one codebase.
- Extension icons at 16, 32, 48 and 128 px.
- Placeholder popup with the Feedfence brand.
- Issue and pull request templates, security policy and CI.
