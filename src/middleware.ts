import { NextResponse, type NextRequest } from "next/server";

/**
 * Strict, nonce-based Content-Security-Policy for every page (P6).
 *
 * A fresh nonce per request goes into the CSP and into the request headers
 * (`x-nonce`, `content-security-policy`). Next.js reads the nonce from the
 * request's CSP header and stamps it on its own inline and framework scripts;
 * the root layout reads `headers()`, which renders every page per request so
 * no prerendered page ships without a nonce. `'strict-dynamic'` lets those
 * trusted scripts load the app's chunks; nothing else can run.
 *
 * CSP_MODE=enforce | report-only. Default: enforce in production builds,
 * report-only in `next dev`. Reports go to the API: POST /api/csp-report
 * (server/API/privacy/cspReport.ts → error_log, kind "csp").
 *
 * Origins allowed, from a grep of the front end (2026-10-26):
 *   API (NEXT_PUBLIC_API_URL)      fetch, document download links, images
 *   images.pexels.com              country page hero backgrounds
 *   flagcdn.com                    flags in the nav
 *   checkout.stripe.com,           form-action only (Checkout and the billing
 *   billing.stripe.com               portal are full-page redirects, not embeds)
 * No third-party scripts, fonts (system font stack), frames or analytics.
 * Web Push uses the browser's push service, which CSP does not govern.
 *
 * Styles: 'self' 'unsafe-inline'. React renders `style` attributes into the
 * server HTML (framer-motion initial states, recharts SVG, hero
 * backgrounds); attributes cannot carry a nonce, so inline styles stay
 * allowed. Scripts get no such exception.
 *
 * Verify: open DevTools → Network → a page → Response Headers shows
 * `content-security-policy` (or `-report-only`); the Console lists any
 * "Refused to …" / "[Report Only] Refused to …" lines.
 */

const isDev = process.env.NODE_ENV !== "production";

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const API_ORIGIN = originOf(process.env.NEXT_PUBLIC_API_URL) ?? (isDev ? "http://localhost:8000" : null);
const EXTRA_CONNECT = (process.env.CSP_EXTRA_CONNECT ?? "")
  .split(/[\s,]+/)
  .map((s) => originOf(s))
  .filter((s): s is string => !!s);

function cspMode(): "enforce" | "report-only" {
  const m = (process.env.CSP_MODE ?? "").toLowerCase();
  if (m === "enforce" || m === "report-only") return m;
  return isDev ? "report-only" : "enforce";
}

function buildCsp(nonce: string): string {
  const api = API_ORIGIN ? [API_ORIGIN] : [];
  const report = API_ORIGIN ? `${API_ORIGIN}/api/csp-report` : null;
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:", "https://images.pexels.com", "https://flagcdn.com", ...api]],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", ["'self'", ...api, ...EXTRA_CONNECT, ...(isDev ? ["ws:", "wss:"] : [])]],
    ["media-src", ["'self'", "blob:"]],
    ["worker-src", ["'self'"]],
    ["manifest-src", ["'self'"]],
    ["frame-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'", "https://checkout.stripe.com", "https://billing.stripe.com"]],
  ];
  const parts = directives.map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!isDev) parts.push("upgrade-insecure-requests");
  if (report) parts.push(`report-uri ${report}`, "report-to csp-endpoint");
  return parts.join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const mode = cspMode();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js takes the nonce for its scripts from this request header (both modes).
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(mode === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only", csp);
  if (API_ORIGIN) response.headers.set("Reporting-Endpoints", `csp-endpoint="${API_ORIGIN}/api/csp-report"`);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: not static files, images, the service worker or prefetches.
      source: "/((?!_next/static|_next/image|favicon.ico|logo.png|sw.js|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
