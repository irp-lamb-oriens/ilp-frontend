/**
 * Which answers may be kept on the device, and for how long one is trusted
 * without asking the server again (SYNC).
 *
 * Never kept: sign-in, payments and checkout, call slots (availability must
 * be live), files and exports, bank details, the assistant, measurement, and
 * anything a caller marks `cache: "no-store"`.
 *
 * NEXT_PUBLIC_LOCAL_SYNC=off turns the whole engine off (every request goes
 * to the server, nothing is kept).
 */

export const SYNC_ENABLED = process.env.NEXT_PUBLIC_LOCAL_SYNC !== "off";

/** A screen opened again within this time reuses its last answer. */
export const FRESH_MS = 15_000;
/** Reports and totals: slow to compute, slow to change. */
export const FRESH_REPORT_MS = 120_000;
/** When the server cannot be reached, a saved answer up to this old is shown (and labelled). */
export const STALE_OK_MS = 24 * 60 * 60 * 1000;

const NEVER: readonly RegExp[] = [
  /\/auth\//,
  /\/payments?(\/|$)/,
  /\/checkout/,
  /\/billing/,
  /\/slots(\/|$)/,
  /\/availability/,
  /\/(file|files|download|export|pdf|ticket)(\/|$)/,
  /download-ticket/,
  /payout-details/,
  /\/bank/,
  /\/lily(\/|$)/,
  /\/journey\//,
  /\/push\//,
  /\/health/,
  /\/stream/,
];

const REPORTS: readonly RegExp[] = [
  /\/reports?(\/|$)/,
  /\/finance(\/|$)/,
  /\/analytics(\/|$)/,
  /\/journeys\//,
  /\/kpis?(\/|$)/,
  /\/stats(\/|$)/,
  /\/summary(\/|$)/,
];

/** How long an answer for this path is fresh, or null when it must never be kept. */
export function freshFor(path: string): number | null {
  const p = path.split(/[?#]/)[0] ?? "";
  if (!p.startsWith("/api/")) return null;
  if (NEVER.some((re) => re.test(p))) return null;
  return REPORTS.some((re) => re.test(p)) ? FRESH_REPORT_MS : FRESH_MS;
}

/** A failure that says "could not reach a working server" (so a saved copy or a later retry is right). */
export function isUnreachable(status: number | null): boolean {
  return status === null || status === 502 || status === 503 || status === 504;
}
