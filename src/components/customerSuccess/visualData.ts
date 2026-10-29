/**
 * Placeholder data for the pictures beside "Why the role matters" on
 * /customer-success (CsmVisuals.tsx). Fictional people from the tutorial
 * presets; plain data, so tests/csmLanding.test.mjs can read every string.
 */
import { LAWYERS, MEMBERS as M, TEAM } from "../../tutorials/presets";

export const VISUAL_COUNTRIES = ["Colombia", "Costa Rica", "Mexico", "Panama", "Portugal", "Spain"];

/** Three members, so the picture fits its box at full type size (csmFit.ts). */
export const MEMBER_ROWS = [
  { who: M.linda, country: "Costa Rica", calls: "2 of 3 calls left" },
  { who: M.genevieve, country: "Mexico", calls: "3 of 3 calls left" },
  { who: M.russell, country: "Panama", calls: "1 of 3 calls left" },
];

/** An example member's month with nobody owning the follow-up. */
export const GAP_ROWS = [
  "Profile 35% complete the day before the call",
  "Lawyer's next steps not sent to the member",
  "Quote unanswered for 9 days",
  "Renewal in 6 days, no call used this month",
];

export const GAP_TAG = "No owner";
export const GAP_TOTAL_LABEL = "Open items with no owner";

/** An example member's first month with a CSM. */
export const LOOP_CARD = {
  initials: "IO",
  name: M.imani,
  meta: "Costa Rica · ILP member",
  csm: `${TEAM.csm} · Customer success manager`,
  steps: [
    { label: "Welcome call", detail: "Day 1" },
    { label: "Profile ready for the first call", detail: "72%" },
    { label: "First call held", detail: LAWYERS.andrea },
    { label: "Lawyer's next steps sent", detail: "Within 24 h" },
    { label: "Quote followed up", detail: "Accepted" },
    { label: "Renewal check-in", detail: "Before day 30" },
  ],
};
