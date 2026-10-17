<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/cover-dark.png">
  <img src=".github/assets/cover-light.png" alt="Feedfence: hide the parts of social sites you didn't ask for. A browser extension for Chrome and Firefox. Next to the tagline, the Feedfence popup on YouTube shows 48 minutes spent today and switches that hide Shorts, home recommendations, related videos and sponsored tiles.">
</picture>

# Feedfence

A browser extension that hides the parts of social sites you didn't ask for, and shows where your time goes. Made by DotbrainLLC.

Feedfence is in early development. Nothing is published to the Chrome Web Store or Firefox Add-ons yet.

## What it does

- **Hides sections:** Shorts, Reels, recommendations, trends, sidebars and sponsored posts, one switch each.
- **Tracks time:** active time per site per day, counted only while the tab is visible and you're using it.
- **Measures scrolling:** an approximate distance per day, compared to a landmark.
- **Sets soft limits:** an optional daily limit with a gentle reminder and a 5-minute escape.

It covers YouTube, X, Reddit, LinkedIn, Instagram and Facebook. Feedfence isn't affiliated with any of these sites.

## Privacy

Everything stays in your browser. Feedfence has no account, no analytics and makes no network requests. Your time and scroll data live in local extension storage, and you can export them as CSV or delete them at any time from **Your data** in the popup.

## Development

You need Node 22 or later and npm. The project uses [WXT](https://wxt.dev), Svelte 5 and TypeScript.

```
npm install
npm run dev
```

`npm run dev` rebuilds as you edit. Load `.output/chrome-mv3-dev` once as an unpacked extension (steps below), and it reloads itself after each change. For Firefox, run `npm run dev:firefox` and load `.output/firefox-mv3-dev`.

| Command | What it does |
|---|---|
| `npm run build` | Builds Chrome and Firefox versions into `.output/`. |
| `npm run check` | Type-checks the TypeScript and Svelte code. |
| `npm run lint:firefox` | Runs the Firefox add-on linter on the Firefox build. It downloads `web-ext` on first use. |
| `npm run zip` | Packs both builds for store upload, plus the Firefox source ZIP. |

To load a build by hand in Chrome, open `chrome://extensions`, turn on Developer mode, click "Load unpacked" and pick `.output/chrome-mv3`. In Firefox, open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on" and pick `.output/firefox-mv3/manifest.json`.

## Project layout

| Path | What's in it |
|---|---|
| `src/entrypoints/` | The popup, background script and, later, one content script per site. |
| `src/assets/tokens.css` | Colors, type and spacing from the brand kit. |
| `public/icon/` | Extension icons at 16, 32, 48 and 128 px. |

## Docs

- [Contributing](CONTRIBUTING.md): how changes move from issue to merge.
- [Security policy](SECURITY.md): how to report a security issue.

## Help

Found a bug or have an idea? [Open an issue](https://github.com/dotbrainhq/feedfence/issues/new/choose).
