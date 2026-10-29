/**
 * Optional measurement id preference (P6). The funnel id that P2's
 * lib/funnel.ts keeps in localStorage is not needed for the site to work, so
 * it is stored only after the visitor allows it, and never when the browser
 * sends Global Privacy Control. Until then lib/funnel.ts stores nothing and
 * sends no beacon (P7).
 *
 * Every storage access is wrapped: private windows and blocked storage just
 * behave as "not allowed".
 */

export const MEASURE_KEY = "ilp_measure_choice";
export const MEASURE_EVENT = "ilp:measure-choice";
export type MeasureChoice = "allow" | "deny";

const FUNNEL_KEYS = ["ilp_funnel_id", "ilp_funnel_src"];
/** JOURNEYS: the journey visitor id and first-touch source (contracts JOURNEY_VISITOR_KEY), removed on "No thanks". */
const JOURNEY_KEYS = ["ilp_vid", "ilp_journey_src"];
/** JOURNEYS: "1" = opted out of journey measurement (contracts JOURNEY_OPT_OUT_KEY). */
const JOURNEY_OPT_OUT = "ilp_journey_optout";

/** The browser asks sites not to track (Global Privacy Control). */
export function gpcEnabled(): boolean {
  try {
    return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  } catch {
    return false;
  }
}

export function getMeasureChoice(): MeasureChoice | null {
  try {
    const v = window.localStorage.getItem(MEASURE_KEY);
    return v === "allow" || v === "deny" ? v : null;
  } catch {
    return null;
  }
}

export function setMeasureChoice(choice: MeasureChoice): void {
  try {
    window.localStorage.setItem(MEASURE_KEY, choice);
    if (choice === "deny") {
      for (const k of [...FUNNEL_KEYS, ...JOURNEY_KEYS]) window.localStorage.removeItem(k);
      window.localStorage.setItem(JOURNEY_OPT_OUT, "1");
    } else {
      window.localStorage.removeItem(JOURNEY_OPT_OUT);
    }
  } catch {
    // storage blocked: nothing is stored either way
  }
  try {
    window.dispatchEvent(new Event(MEASURE_EVENT));
  } catch {
    // no window (server render)
  }
}

/** True only when the visitor allowed the measurement id and GPC is off. */
export function measurementAllowed(): boolean {
  return !gpcEnabled() && getMeasureChoice() === "allow";
}
