// Run: npm test. COMMS-P2: lawyer feedback thresholds in the shared contracts,
// the lawyer portal pages (New work, Feedback) and what they may show.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { existsSync, readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const C = await import("../src/lib/contracts.ts");
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("feedback thresholds: defaults inside their limits; owner defaults (70 with 5 reviews, 2 low scores in 30 days)", () => {
  const d = C.LAWYER_FEEDBACK_DEFAULTS;
  assert.equal(d.enabled, true);
  assert.deepEqual([d.coachingBelowScore, d.coachingMinReviews, d.lowScoresCount, d.lowScoresWindowDays], [70, 5, 2, 30]);
  for (const [k, [lo, hi]] of Object.entries(C.LAWYER_FEEDBACK_LIMITS)) assert.ok(d[k] >= lo && d[k] <= hi, k);
  assert.equal(C.TASK_RULES["call.summary_unconfirmed"].type, "follow_up");
});

test("lawyer portal: New work and Feedback pages with loading states, in the nav", () => {
  for (const p of ["src/app/lawyer/work/page.tsx", "src/app/lawyer/work/loading.tsx", "src/app/lawyer/feedback/page.tsx", "src/app/lawyer/feedback/loading.tsx"]) {
    assert.ok(existsSync(new URL(`../${p}`, import.meta.url)), p);
  }
  const nav = read("src/components/shell/navConfig.ts");
  assert.ok(nav.includes('"/lawyer/work"') && nav.includes('"/lawyer/feedback"'));
});

test("lawyer pages never ask for a score, a ranking or member identities", () => {
  const src = read("src/components/lawyer/FeedbackView.tsx") + read("src/components/lawyer/WorkOffersView.tsx") + read("src/components/lawyer/commsApi.ts");
  for (const bad of ["ratingScore", "reviewCount", "lawyerRating", "valueCents", "clientId", "memberName"]) assert.ok(!src.includes(bad), bad);
  assert.ok(!/—|–/.test(read("src/components/lawyer/LawyerIntro.tsx")), "no dashes in intros");
});
