// Run: npm test. Partner lawyer application (T2): step checks, the field to
// step map, the draft (agreements never stored) and the terms version.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { existsSync, readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const M = await import("../src/components/lawyers/applyModel.ts");
const { PARTNER_TERMS_VERSION } = await import("../src/components/legal/content/partner.ts");

const full = {
  ...M.EMPTY_DRAFT,
  name: "Mariela Quesada Rojas",
  email: "mariela@quesadalegal.cr",
  phone: "+506 8812 3456",
  languages: ["es", "en"],
  city: "Escazú",
  province: "San José",
  carne: "21.345",
  yearAdmitted: "2009",
  notary: "no",
  yearsInPractice: 16,
  areas: ["immigration"],
  weekly: [{ day: 2, start: "09:00", end: "12:00" }],
  callsPerWeek: 6,
  minNoticeHours: "24",
  hourlyRateCents: 12000,
  quotePreference: "flat",
  invoicingEntity: "firm",
  bio: "I help foreigners with residency and property in Costa Rica. Fifteen years in practice in Escazú.",
  licensedInGoodStanding: true,
  partnerTerms: true,
  privacy: true,
  carneVerification: true,
};

function memory() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}

test("a complete application passes every step", () => {
  for (const step of M.STEP_IDS) assert.deepEqual(M.validateStep(step, full, 2026), {}, step);
});

test("an empty application gets a plain error on every required field, each mapped to its step", () => {
  const all = {};
  for (const step of M.STEP_IDS) {
    const e = M.validateStep(step, M.EMPTY_DRAFT, 2026);
    for (const k of Object.keys(e)) assert.equal(M.FIELD_STEP[k], step, `${k} belongs to ${step}`);
    Object.assign(all, e);
  }
  for (const k of ["name", "email", "phone", "languages", "city", "province", "carne", "yearAdmitted", "notary", "areas", "weekly", "hourlyRateCents", "quotePreference", "invoicingEntity", "bio", "licensedInGoodStanding", "partnerTerms", "privacy", "carneVerification"]) {
    assert.ok(all[k], `error for ${k}`);
  }
  assert.ok(!/[–—]/.test(Object.values(all).join(" ")), "no dashes in error copy");
});

test("conditional fields: notary number, other area, invalid fees, years in practice", () => {
  assert.ok(M.validateStep("practice", { ...full, notary: "yes", notaryCarne: "" }, 2026).notaryCarne);
  assert.ok(M.validateStep("practice", { ...full, yearAdmitted: "2020", yearsInPractice: 20 }, 2026).yearsInPractice);
  assert.ok(M.validateStep("areas", { ...full, areas: ["other"], otherArea: "" }, 2026).otherArea);
  assert.ok(M.validateStep("fees", { ...full, flatFeesCents: { will: "invalid" } }, 2026).fee_will);
  assert.ok(M.validateStep("about", { ...full, bio: "x".repeat(M.BIO_MAX + 1) }, 2026).bio);
});

test("request body: digits only for the carné, versions attached, empty fees dropped", () => {
  const b = M.toRequestBody({ ...full, flatFeesCents: { residency: 150000, will: null } }, { partnerTerms: PARTNER_TERMS_VERSION, privacy: "privacy-x" }, { homepage: "", elapsedMs: 9000 });
  assert.equal(b.carne, "21345");
  assert.deepEqual(b.flatFeesCents, { residency: 150000 });
  assert.equal(b.agreements.partnerTermsVersion, PARTNER_TERMS_VERSION);
  assert.equal(b.notary, false);
  assert.equal("notaryCarne" in b, false);
});

test("draft: saved and restored, agreements never stored, storage errors ignored", () => {
  const store = memory();
  M.saveDraft(store, full, 3);
  const raw = JSON.parse(store.getItem(M.DRAFT_KEY));
  for (const k of ["licensedInGoodStanding", "partnerTerms", "privacy", "carneVerification"]) assert.equal(k in raw.data, false, `${k} not stored`);
  const back = M.loadDraft(store);
  assert.equal(back.step, 3);
  assert.equal(back.data.name, full.name);
  assert.equal(back.data.partnerTerms, false);
  M.clearDraft(store);
  assert.equal(M.loadDraft(store), null);
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.doesNotThrow(() => M.saveDraft(broken, full, 0));
  assert.equal(M.loadDraft(broken), null);
  store.setItem(M.DRAFT_KEY, "{not json");
  assert.equal(M.loadDraft(store), null);
});

test("partner terms version matches the server when the server repo sits next to this one", () => {
  const server = new URL("../../server/API/providers/applyLogic.ts", import.meta.url);
  if (!existsSync(server)) return;
  const m = readFileSync(server, "utf8").match(/PARTNER_TERMS_VERSION = "([^"]+)"/);
  assert.equal(m?.[1], PARTNER_TERMS_VERSION);
});
