# Contributing to Feedfence

Every change follows the same path, from a one-word typo to a new feature.

## The path

1. **Issue:** open one, or pick an existing one. It gets a type label (`bug`, `enhancement` or `documentation`), one `area:` label and a milestone.
2. **Branch:** start from an up-to-date `main` and name it `fix/<issue>-<slug>`, `feat/<issue>-<slug>`, `docs/<issue>-<slug>` or `chore/<slug>`.
3. **Commits:** a short subject in the imperative ("Hide Shorts on the subscriptions page"), with a body that explains why when it isn't obvious.
4. **Pull request:** fill in the template. The description says `Closes #<issue>`.
5. **Merge:** squash-merge once the `CI passed` check is green. `main` is protected, so direct pushes are rejected.

## Before you open a pull request

Run these and make sure they pass:

```
npm run check
npm test
npm run build
npm run lint:firefox
```

Unit tests sit next to the code they cover (`src/lib/*.test.ts`). Add one when you change the limit, usage, settings or export logic.

Then load the build in Chrome and Firefox and try the change by hand. Add before and after screenshots for anything someone can see.

## Fixing a broken hide rule

Sites change their markup often, and this is the most common kind of fix.

- **Prefer stable attributes:** `data-testid`, `role`, `href` and custom element names like `ytd-*` survive redesigns better than class names.
- **Avoid text matching:** words like "Shorts" or "Sponsored" change with the user's language.
- **Hide, don't remove:** use `display: none`. Removing nodes breaks the site's own code.
- **Check a second language:** confirm the rule still works with the site set to a language other than English.

## Performance rules

Feedfence runs on every page of the sites it supports, so it has to stay light.

- No frameworks or large libraries in content scripts.
- No timers that poll. React to events instead.
- No network requests.
- Keep each content script under 3 KB gzipped.
