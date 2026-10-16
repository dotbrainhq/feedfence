export const SITES = [
  { id: 'youtube', name: 'YouTube', host: 'www.youtube.com' },
  { id: 'x', name: 'X', host: 'x.com' },
  { id: 'reddit', name: 'Reddit', host: 'www.reddit.com' },
  { id: 'linkedin', name: 'LinkedIn', host: 'www.linkedin.com' },
  { id: 'instagram', name: 'Instagram', host: 'www.instagram.com' },
  { id: 'facebook', name: 'Facebook', host: 'www.facebook.com' },
] as const;

export type SiteId = (typeof SITES)[number]['id'];

export const SITE_IDS: readonly SiteId[] = SITES.map((s) => s.id);

export const SITE_MATCHES = SITES.map((s) => `*://${s.host}/*`);

export function siteForHost(host: string): SiteId | undefined {
  return SITES.find((s) => s.host === host)?.id;
}

export function siteName(id: SiteId): string {
  return SITES.find((s) => s.id === id)?.name ?? id;
}
