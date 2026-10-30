import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/seo/crawl";

/**
 * sitemap.xml: every indexable page from lib/seo/site.ts. The API can list
 * published guides (GET /api/guides) and serve one blog article by slug, but
 * the front end has no /guides or /blog pages yet, so listing them would
 * point crawlers at 404s. When those pages ship, fetch /api/guides here with
 * `next: { revalidate: 3600 }` and fall back to the static list on error.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries();
}
