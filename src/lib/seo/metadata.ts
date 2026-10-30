import type { Metadata } from "next";
import { SITE_NAME, routeFor } from "./site";

/** The site-wide Open Graph image (app/opengraph-image.tsx), for pages without their own. */
export const DEFAULT_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME}: a legal membership in six countries` };

/** Signed-in, internal and utility pages. */
export const NOINDEX: NonNullable<Metadata["robots"]> = { index: false, follow: false, googleBot: { index: false, follow: false } };

/**
 * Metadata for a public page from lib/seo/site.ts: absolute title,
 * description, canonical, Open Graph and Twitter card. `ownOgImage` is true
 * when the route folder has its own opengraph-image.tsx. The image URL is
 * always named explicitly: Next.js replaces a parent's openGraph object with
 * the page's, so an image left implicit can be dropped.
 */
export function pageMetadata(path: string, opts: { ownOgImage?: boolean } = {}): Metadata {
  const r = routeFor(path);
  const image = opts.ownOgImage
    ? { url: `${path === "/" ? "" : path}/opengraph-image`, width: 1200, height: 630, alt: r.title }
    : DEFAULT_OG_IMAGE;
  return {
    title: { absolute: r.title },
    description: r.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      title: r.title,
      description: r.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: r.title,
      description: r.description,
      images: [image.url],
    },
  };
}
