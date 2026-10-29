// Run: npm test. ROUTING: the shared contracts copy (rating formula, hidden
// fields, default specialties) and the staff labels in src/lib/routing.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const C = await import("../src/lib/contracts.ts");

test("contracts copy is byte-identical with the server", () => {
  const here = readFileSync(new URL("../src/lib/contracts.ts", import.meta.url), "utf8");
  const server = readFileSync(new URL("../../server/schemas/contracts.ts", import.meta.url), "utf8");
  assert.equal(here, server);
});

test("rating: 100 with no reviews, blended until 5 reviews, then the plain average", () => {
  assert.deepEqual(C.lawyerRating([]), { score: 100, reviewCount: 0, status: "no_reviews" });
  assert.deepEqual(C.lawyerRating([0]), { score: 83.3, reviewCount: 1, status: "blended" });
  assert.deepEqual(C.lawyerRating([100, 75, 50, 0]), { score: 80.6, reviewCount: 4, status: "blended" });
  assert.deepEqual(C.lawyerRating([100, 75, 50, 0, 25]), { score: 50, reviewCount: 5, status: "average" });
  assert.deepEqual(C.lawyerRating(Array(20).fill(75)), { score: 75, reviewCount: 20, status: "average" });
});

test("ratings and routing decisions are hidden from lawyers and members", () => {
  for (const k of ["routing", "ratingScore", "reviewCount", "ratingStatus"]) {
    assert.ok(C.LAWYER_HIDDEN_FIELDS.includes(k), k);
    assert.ok(C.CLIENT_HIDDEN_FIELDS.includes(k), k);
  }
});

test("default specialties: unique ids, every area group used, country limits are real codes", () => {
  const ids = C.DEFAULT_SPECIALTIES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const g of C.AREA_GROUPS) assert.ok(C.DEFAULT_SPECIALTIES.some((s) => s.group === g.id), g.id);
  for (const s of C.DEFAULT_SPECIALTIES) for (const c of s.countries) assert.ok(C.COUNTRY_CODES.includes(c), `${s.id} ${c}`);
  assert.equal(C.toAreaGroup("property"), "real_estate");
  assert.equal(C.toAreaGroup("general"), null);
});
