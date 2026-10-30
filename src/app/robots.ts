import type { MetadataRoute } from "next";
import { robotsData } from "@/lib/seo/crawl";

/** robots.txt: everything public is crawlable; portals, the API and utility pages are not (lib/seo/site.ts). */
export default function robots(): MetadataRoute.Robots {
  return robotsData();
}
