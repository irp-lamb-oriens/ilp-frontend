/**
 * lib/funnel.ts — anonymous funnel beacons for PMF measurement (P2).
 *
 * Records a FunnelStep with a random id kept in this browser and a
 * first-touch source (utm_source, else the referrer's host). Nothing personal
 * is sent: no email, no name, no IP is stored by the server. The server keeps
 * one event per (step, id), so repeats are harmless.
 * Server: POST /api/analytics/funnel (server/API/analytics/funnel.ts).
 *
 * Consent (P6/P7): nothing is stored and nothing is sent until the visitor
 * allows measurement (`measurementAllowed()` from components/legal/preferences,
 * which is false whenever the browser sends Global Privacy Control). Until
 * then `funnelAnonId()` and `funnelSource()` return undefined and
 * `trackFunnel()` is a no-op. Server-side steps keyed on the member
 * (join_paid on activation, first_call_booked) do not depend on this.
 */

import { API_URL } from "./api";
import type { FunnelStep } from "./contracts";
import { measurementAllowed } from "@/components/legal/preferences";

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

function allowed(): boolean {
  try {
    return typeof window !== "undefined" && measurementAllowed();
  } catch {
    return false;
  }
}

/** This browser's anonymous funnel id, or undefined when measurement is not allowed. */
export function funnelAnonId(): string | undefined {
  if (!allowed()) return undefined;
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

/** First-touch source: utm_source, else the referrer host (other sites only). Undefined when measurement is not allowed. */
export function funnelSource(): string | undefined {
  if (!allowed()) return undefined;
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

/** Fire-and-forget beacon. Never throws, never blocks the page. No-op until measurement is allowed. */
export function trackFunnel(step: Exclude<FunnelStep, "first_call_booked">, extra: { leadId?: string } = {}): void {
  if (!allowed()) return;
  const anonId = funnelAnonId();
  if (!anonId) return;
  try {
    const body = JSON.stringify({ step, anonId, source: funnelSource(), ...(extra.leadId ? { leadId: extra.leadId } : {}) });
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
