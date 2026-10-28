import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  // Firefox defaults to MV2 in WXT; the plan targets MV3 in both browsers.
  manifestVersion: 3,
  // The Firefox source zip goes to add-on reviewers. It lists what goes in rather than what stays out, so
  // private/ (plans and brand files kept off GitHub) and any new local folder can't end up in it.
  zip: {
    includeSources: [
      'src/**',
      'public/**',
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'svelte.config.js',
      'wxt.config.ts',
      'README.md',
      'LICENSE*',
    ],
  },
  manifest: ({ browser }) => ({
    // Chrome and Edge show the extension's own name as the store title, so their build carries the
    // words people search for. Firefox sets its listing name separately and keeps the short one.
    name: browser === 'firefox' ? 'Feedfence' : 'Feedfence: Hide Shorts & Reels, Track Screen Time',
    description:
      'Hide feeds, Shorts, Reels and sponsored posts on social sites, and see your time and scrolling there.',
    // scripting: Chrome only, to add content scripts to tabs open at install or update.
    // alarms: to start and end focus hours on time. Neither shows a permission prompt.
    permissions: browser === 'firefox' ? ['storage', 'alarms'] : ['storage', 'alarms', 'scripting'],
    homepage_url: 'https://dotbrainhq.com',
    action: { default_title: 'Feedfence' },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'feedfence@dotbrainhq',
          // 140 is the first version with the built-in data consent key AMO requires.
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
        // Android got the data consent key in 142.
        gecko_android: { strict_min_version: '142.0' },
      },
    }),
  }),
});
