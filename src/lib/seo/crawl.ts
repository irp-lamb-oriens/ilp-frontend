/**
 * robots.txt rules and sitemap entries as plain data, so app/robots.ts,
 * app/sitemap.ts and tests/seo.test.mjs share one source.
 */
import { NOINDEX_PUBLIC, PRIVATE_PREFIXES, PUBLIC_ROUTES, SITE_URL, absoluteUrl, type ChangeFrequency } from "./site";

/**
 * Disallow rules. Each private prefix is blocked as the exact path ("$") and
 * as a folder ("/"), so "/lawyer" never blocks "/lawyers/apply".
 */
export function disallowRules(): string[] {
  const rules: string[] = [];
  for (const p of PRIVATE_PREFIXES) rules.push(`${p}$`, `${p}/`);
  for (const p of Object.keys(NOINDEX_PUBLIC)) rules.push(p);
  return rules;
}

export function robotsData() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: disallowRules() }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/** Date the public copy last changed in a way worth recrawling. Update with content releases. */
export const CONTENT_UPDATED = new Date("2026-10-29T00:00:00Z");

export function sitemapEntries(): SitemapEntry[] {
  return PUBLIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: CONTENT_UPDATED,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
