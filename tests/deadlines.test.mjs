// Run: npm test. DEADLINES: card helpers shared by /check, /status/deadlines
// and the picker (src/lib/deadlines.ts), and the free-account helpers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const D = await import("../src/lib/deadlines.ts");
const C = await import("../src/lib/contracts.ts");

test("card titles drop the trailing 'may require review' (the card shows a pill instead)", () => {
  assert.equal(D.cardTitle("DIMEX renewal may require review"), "DIMEX renewal");
  assert.equal(D.cardTitle("Corporate tax return (D-101), may require review."), "Corporate tax return (D-101)");
  assert.equal(D.cardTitle("Marchamo"), "Marchamo");
  assert.equal(D.cardTitle("may require review"), "may require review");
});

test("date line: window, date, no fixed date, and never a firm date for low confidence", () => {
  assert.equal(D.cardDateLine({ dueAt: "2026-12-31T12:00:00.000Z" }), "December 31, 2026");
  assert.equal(D.cardDateLine({ dueAt: "2027-01-31T12:00:00.000Z", windowStartAt: "2027-01-01T12:00:00.000Z" }), "Between January 1, 2027 and January 31, 2027");
  assert.equal(D.cardDateLine({}), "No fixed date");
  assert.equal(D.cardDateLine({ dueAt: "2026-12-31T12:00:00.000Z", confidence: "low" }), "Ask your lawyer to confirm this date");
});

test("starting selection: dated items included, undated and low-confidence items skipped", () => {
  const sel = D.defaultSelection([
    { id: "a", dueAt: "2026-12-31T12:00:00.000Z" },
    { id: "b" },
    { id: "c", dueAt: "2026-12-31T12:00:00.000Z", confidence: "low" },
  ]);
  assert.deepEqual([...sel], ["a"]);
});

test("groups follow the fixed area order, unknown areas last", () => {
  const g = D.groupByArea([{ area: "vehicle" }, { area: "other" }, { area: "immigration" }, { area: "vehicle" }]);
  assert.deepEqual(g.map(([a, l]) => `${a}:${l.length}`), ["immigration:1", "vehicle:2", "other:1"]);
  assert.equal(D.AREA_LABELS.employment, "People who work for you");
});

test("the sign-in hand-over survives storage errors and expires after a day", () => {
  const store = new Map();
  globalThis.window = { sessionStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) } };
  D.savePendingDeadlines({ email: "a@b.co", country: "CR", ruleIds: ["R"], count: 1, savedAt: new Date().toISOString() });
  assert.equal(D.loadPendingDeadlines()?.count, 1);
  D.savePendingDeadlines({ email: "a@b.co", country: "CR", ruleIds: ["R"], count: 1, savedAt: "2020-01-01T00:00:00Z" });
  assert.equal(D.loadPendingDeadlines(), null);
  D.clearPendingDeadlines();
  assert.equal(store.size, 0);
  globalThis.window = { sessionStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } } };
  D.savePendingDeadlines({ email: "a@b.co", country: "CR", ruleIds: [], count: 0, savedAt: new Date().toISOString() });
  assert.equal(D.loadPendingDeadlines(), null);
  D.clearPendingDeadlines();
  delete globalThis.window;
});

test("account type and shown date (contracts)", () => {
  assert.equal(C.accountTypeOf({ accountType: "free" }, null), "free");
  assert.equal(C.accountTypeOf({ accountType: "free" }, { status: "active" }), "member");
  assert.equal(C.accountTypeOf({}, null), "member");
  assert.equal(C.obligationDueAt({ dueAt: "x", userDueAt: "y" }), "y");
  assert.equal(C.obligationNeedsDate({ dueAt: "x", confidence: "low" }), true);
  assert.equal(C.obligationNeedsDate({ confidence: "low", userDueAt: "y" }), false);
});
