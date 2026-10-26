/**
 * lib/funnel.ts — anonymous funnel beacons for PMF measurement (P2).
 *
 * Records a FunnelStep with a random id kept in this browser (localStorage,
 * wrapped in try/catch; an in-memory id is used when storage is blocked) and
 * a first-touch source (utm_source, else the referrer's host). Nothing
 * personal is sent: no email, no name, no IP is stored by the server.
 * The server keeps one event per (step, id), so repeats are harmless.
 * Server: POST /api/analytics/funnel (server/API/analytics/funnel.ts).
 */

import { API_URL } from "./api";
import type { FunnelStep } from "./contracts";

const ID_KEY = "ilp_funnel_id";
const SRC_KEY = "ilp_funnel_src";
let memoryId: string | null = null;

function randomId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }
}

/** This browser's anonymous funnel id. */
export function funnelAnonId(): string {
  try {
    const have = window.localStorage.getItem(ID_KEY);
    if (have && /^[A-Za-z0-9_-]{8,64}$/.test(have)) return have;
    const id = randomId();
    window.localStorage.setItem(ID_KEY, id);
    return id;
  } catch {
    memoryId = memoryId ?? randomId();
    return memoryId;
  }
}

/** First-touch source: utm_source, else the referrer host (other sites only). */
export function funnelSource(): string | undefined {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(SRC_KEY);
  } catch {
    // storage blocked: compute without remembering
  }
  if (stored) return stored;
  let src = "";
  try {
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    if (utm) src = utm;
    else if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) src = host.replace(/^www\./, "");
    }
  } catch {
    src = "";
  }
  src = src.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 60);
  if (!src) return undefined;
  try {
    window.localStorage.setItem(SRC_KEY, src);
  } catch {
    // fine
  }
  return src;
}

/** Fire-and-forget beacon. Never throws, never blocks the page. */
export function trackFunnel(step: Exclude<FunnelStep, "first_call_booked">, extra: { leadId?: string } = {}): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ step, anonId: funnelAnonId(), source: funnelSource(), ...(extra.leadId ? { leadId: extra.leadId } : {}) });
    void fetch(`${API_URL}/api/analytics/funnel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => undefined);
  } catch {
    // measurement must never break the funnel
  }
}
