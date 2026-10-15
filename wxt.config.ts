import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  // Firefox defaults to MV2 in WXT; the plan targets MV3 in both browsers.
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'Feedfence',
    description:
      'Hide feeds, Shorts, Reels and sponsored posts on social sites, and see your time and scrolling there.',
    permissions: ['storage'],
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
