/**
 * Security headers on every page (P1 request, P4). The full nonce-based
 * Content-Security-Policy is set per request in src/middleware.ts (P6; it needs
 * a fresh nonce, which static headers cannot carry). The `frame-ancestors 'none'`
 * policy below stays as a static backstop: it also covers files the middleware
 * skips (static assets) and still blocks framing when CSP_MODE=report-only.
 *
 * BEHAVIOR: one exception. A PUBLIC page opened with ?ilp_heat=1 may be framed
 * by this same site, so the staff heat map (/dashboard/journeys/behavior) can
 * show the page behind the map. No other site can frame anything, and the
 * signed-in portals can never be framed, with or without the parameter.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];
const frameDeny = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];
const frameSelf = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
];
const heat = [{ type: "query", key: "ilp_heat" }];
const PRIVATE = ["dashboard", "lawyer", "status", "csm", "partners", "app", "ui", "api"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Metadata (title, description, canonical, Open Graph, hreflang) in <head>
  // for every client. Next 15 streams it into the end of <body> for anything
  // not on its bot list, so Lighthouse reported "no meta description" and
  // link-preview fetchers outside that list could miss the tags (QA round 1).
  // Pages already render per request (CSP nonce), so there is nothing to
  // stream ahead of.
  htmlLimitedBots: /.*/,
  sassOptions: {
    includePaths: ["./src/styles"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
  // SEO: one canonical host and permanent (308) redirects for old paths.
  // The page-level redirect() calls in /lawyers, /attorneys/apply and /app
  // stay as a fallback; these run first.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.internationallegalpartner.com" }],
        destination: "https://internationallegalpartner.com/:path*",
        permanent: true,
      },
      // QA round 1: the site's netlify.app alias served the same deploy as a
      // second, crawlable copy of production. Send it to the canonical host.
      // Deploy previews and branch deploys (other *.netlify.app hosts) stay
      // reachable and get X-Robots-Tag: noindex from src/middleware.ts.
      {
        source: "/:path*",
        has: [{ type: "host", value: "internationallegalpartner.netlify.app" }],
        destination: "https://internationallegalpartner.com/:path*",
        permanent: true,
      },
      { source: "/lawyers", destination: "/attorneys", permanent: true },
      // Paths people and the QA crawl tried that had no page.
      { source: "/cookies", destination: "/legal/cookies", permanent: true },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      // English only for the pilot: language prefixes go to the English page
      // instead of a 404 (temporary, so a Spanish site can take them later).
      { source: "/en", destination: "/", permanent: false },
      { source: "/en/:path*", destination: "/:path*", permanent: false },
      { source: "/es", destination: "/", permanent: false },
      { source: "/es/:path*", destination: "/:path*", permanent: false },
      { source: "/attorneys/apply", destination: "/lawyers/apply", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/:path*", missing: heat, headers: frameDeny },
      { source: `/:first((?!${PRIVATE.join("|")})[^/]*)/:path*`, has: heat, headers: frameSelf },
      { source: "/", has: heat, headers: frameSelf },
      ...PRIVATE.flatMap((p) => [
        { source: `/${p}`, has: heat, headers: frameDeny },
        { source: `/${p}/:path*`, has: heat, headers: frameDeny },
      ]),
    ];
  },
};

export default nextConfig;
