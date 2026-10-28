/**
 * Every address a site is served from. `hosts` share the desktop page that the hide rules are written
 * for; `trackOnly` serve a different page (mobile, or Reddit's old design), where Feedfence counts time
 * but can't hide anything. Bare and mobile addresses that redirect a desktop browser to one of these
 * (facebook.com, m.youtube.com and so on) don't need listing.
 *
 * Addresses and names are kept apart so scripts that only need the addresses don't ship the names.
 */
const SITE_HOSTS = {
  youtube: { hosts: ['www.youtube.com'], trackOnly: ['m.youtube.com'] },
  x: { hosts: ['x.com'], trackOnly: [] },
  reddit: { hosts: ['www.reddit.com'], trackOnly: ['old.reddit.com'] },
  linkedin: { hosts: ['www.linkedin.com'], trackOnly: [] },
  instagram: { hosts: ['www.instagram.com'], trackOnly: [] },
  facebook: { hosts: ['www.facebook.com', 'web.facebook.com'], trackOnly: ['m.facebook.com'] },
} as const satisfies Record<string, { hosts: readonly string[]; trackOnly: readonly string[] }>;

export type SiteId = keyof typeof SITE_HOSTS;

const NAMES: Record<SiteId, string> = {
  youtube: 'YouTube',
  x: 'X',
  reddit: 'Reddit',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

const allHosts = (id: SiteId): readonly string[] => [...SITE_HOSTS[id].hosts, ...SITE_HOSTS[id].trackOnly];

export const SITE_IDS = Object.keys(SITE_HOSTS) as SiteId[];

/** Each site with its name and addresses, in popup order. */
export const SITES = /* @__PURE__ */ SITE_IDS.map((id) => ({ id, name: NAMES[id], ...SITE_HOSTS[id] }));

/** Every address of every site, for the scripts that count time, show the limit and pause. */
export const SITE_MATCHES = SITE_IDS.flatMap((id) => allHosts(id).map((h) => `*://${h}/*`));

export function siteForHost(host: string): SiteId | undefined {
  return SITE_IDS.find((id) => allHosts(id).includes(host));
}

export function siteName(id: SiteId): string {
  return NAMES[id] ?? id;
}
