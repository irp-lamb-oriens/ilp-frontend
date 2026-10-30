/**
 * Security headers on every page (P1 request, P4). The full nonce-based
 * Content-Security-Policy is set per request in src/middleware.ts (P6; it needs
 * a fresh nonce, which static headers cannot carry). The `frame-ancestors 'none'`
 * policy below stays as a static backstop: it also covers files the middleware
 * skips (static assets) and still blocks framing when CSP_MODE=report-only.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
      { source: "/lawyers", destination: "/attorneys", permanent: true },
      { source: "/attorneys/apply", destination: "/lawyers/apply", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
