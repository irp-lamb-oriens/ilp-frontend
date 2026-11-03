/**
 * Netlify scheduled function: keeps the Next.js server function and the API
 * warm (QA round 1, 2026-11-03). Every page renders per request because of
 * the CSP nonce (src/middleware.ts), and a cold server function took ~7 s
 * to answer the home page. Scheduled functions are free on every Netlify
 * plan; Netlify picks this file up from netlify/functions/ automatically.
 *
 * It only reads public pages and the API's public /health. Remove it once
 * the marketing pages are served statically (launch checklist §9.7).
 */
const SITE = process.env.URL || "https://internationallegalpartner.com";
const API = process.env.NEXT_PUBLIC_API_URL || "https://ilp-backend-nlbz.onrender.com";
const PATHS = ["/", "/check", "/costa-rica", "/pricing"];

export default async () => {
  const targets = [...PATHS.map((p) => `${SITE}${p}`), `${API.replace(/\/+$/, "")}/health`];
  const results = await Promise.allSettled(
    targets.map(async (url) => {
      const t0 = Date.now();
      const res = await fetch(url, { headers: { "user-agent": "ilp-keep-warm" }, signal: AbortSignal.timeout(20_000) });
      return `${res.status} ${Date.now() - t0}ms ${url}`;
    }),
  );
  for (const r of results) console.log(r.status === "fulfilled" ? r.value : `failed ${String(r.reason)}`);
  return new Response("ok");
};

export const config = { schedule: "*/10 * * * *" };
