/**
 * Journeys consent (JOURNEYS). The tracker sends nothing unless every check
 * passes:
 * - the visitor allowed the measurement id (components/legal/preferences,
 *   which is already false with Global Privacy Control);
 * - the browser does not send Do Not Track;
 * - the visitor has not opted out (`ilp_journey_optout`, set by "No thanks").
 * Every read is wrapped: blocked storage behaves as "not allowed".
 */
import { measurementAllowed } from "@/components/legal/preferences";
import { JOURNEY_OPT_OUT_KEY } from "@/lib/contracts";

/** The browser sends Do Not Track. */
export function dntEnabled(): boolean {
  try {
    const n = navigator as Navigator & { msDoNotTrack?: string };
    const w = window as Window & { doNotTrack?: string };
    return n.doNotTrack === "1" || n.doNotTrack === "yes" || w.doNotTrack === "1" || n.msDoNotTrack === "1";
  } catch {
    return false;
  }
}

/** The visitor opted out of journey measurement in this browser. */
export function journeyOptedOut(): boolean {
  try {
    return window.localStorage.getItem(JOURNEY_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

/** True only when measurement is allowed, and neither DNT nor the opt-out is set. */
export function trackingAllowed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return measurementAllowed() && !dntEnabled() && !journeyOptedOut();
  } catch {
    return false;
  }
}
