// Run: npm test. Guided join (T3): step checks, the request body sent to
// POST /api/payments/join, pre-fill from the free check, and the draft
// (consents never stored).
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const M = await import("../src/components/join/joinModel.ts");

const TODAY = "2026-10-27";
const full = {
  ...M.EMPTY_DRAFT,
  fullName: "Ruth Callahan",
  preferredName: "Ruth",
  email: "Ruth.Callahan@example.net ",
  phone: "+1 503 555 0141",
  preferredLanguage: "en",
  citizenships: ["United States", "other"],
  otherCitizenship: "Ireland",
  residenceCountry: "Costa Rica",
  residenceProvince: "Guanacaste",
  residenceTown: "Tamarindo",
  timezone: "America/Costa_Rica",
  maritalStatus: "married",
  livesWithPartner: "yes",
  childrenAtHome: 0,
  otherHousehold: 1,
  residencyStatus: "applying",
  residencyCategory: "pensionado",
  ownsProperty: "yes",
  propertyType: "house",
  propertyLocation: "Guanacaste",
  propertyHolding: "company",
  companyType: "SA",
  companyCount: 1,
  companyUpToDate: "unsure",
  ownsVehicle: "no",
  hasEmployees: "no",
  question: "Is my S.A. up to date with its filings?",
  urgency: "deadline",
  deadlineAt: "2027-01-31",
  documents: ["passport", "property_title"],
  acceptTerms: true,
  acceptPrivacy: true,
};

function memory() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), m };
}

test("join: a full answer passes every step", () => {
  for (const id of M.STEP_IDS) assert.deepEqual(M.validateStep(id, full, TODAY), {}, id);
});

test("join: empty steps list each required field", () => {
  const e = M.EMPTY_DRAFT;
  assert.deepEqual(Object.keys(M.validateStep("you", e, TODAY)).sort(), ["citizenships", "email", "fullName", "phone", "preferredLanguage", "residenceCountry", "timezone"]);
  assert.deepEqual(Object.keys(M.validateStep("household", e, TODAY)).sort(), ["livesWithPartner", "maritalStatus"]);
  assert.deepEqual(Object.keys(M.validateStep("situation", e, TODAY)).sort(), ["companyType", "hasEmployees", "ownsProperty", "ownsVehicle", "residencyStatus"]);
  assert.deepEqual(Object.keys(M.validateStep("first", e, TODAY)).sort(), ["documents", "question", "urgency"]);
  assert.deepEqual(Object.keys(M.validateStep("plan", e, TODAY)).sort(), ["acceptPrivacy", "acceptTerms"]);
  // optional fields stay optional
  assert.equal(M.validateStep("you", { ...full, preferredName: "", residenceTown: "" }, TODAY).preferredName, undefined);
  assert.deepEqual(M.validateStep("household", { ...full, pets: "" }, TODAY), {});
});

test("join: follow-up questions are required only when they apply", () => {
  assert.ok(M.validateStep("situation", { ...full, propertyHolding: "" }, TODAY).propertyHolding);
  assert.deepEqual(M.validateStep("situation", { ...full, ownsProperty: "no", propertyHolding: "", propertyType: "" }, TODAY), {});
  assert.ok(M.validateStep("situation", { ...full, ownsVehicle: "yes" }, TODAY).marchamoStatus);
  assert.ok(M.validateStep("situation", { ...full, companyCount: 0 }, TODAY).companyCount);
  assert.deepEqual(M.validateStep("situation", { ...full, companyType: "none", companyUpToDate: "" }, TODAY), {});
  assert.ok(M.validateStep("first", { ...full, deadlineAt: "2026-01-01" }, TODAY).deadlineAt);
  assert.ok(M.validateStep("you", { ...full, residenceProvince: "" }, TODAY).residenceProvince);
  assert.deepEqual(M.validateStep("you", { ...full, residenceCountry: "Canada", residenceProvince: "" }, TODAY), {});
});

test("join: the body uses the server's profile keys and intake", () => {
  const b = M.toJoinDetails(full);
  assert.equal(b.email, "ruth.callahan@example.net");
  assert.equal(b.profile.nationality, "United States, Ireland");
  assert.equal(b.profile.residenceCountry, "Costa Rica");
  assert.equal(b.profile.livesWithPartner, true);
  assert.equal(b.profile.ownsVehicle, false);
  assert.equal("marchamoStatus" in b.profile, false);
  assert.equal(b.profile.companyCount, 1);
  assert.deepEqual(b.intake, {
    question: "Is my S.A. up to date with its filings?",
    urgency: "deadline",
    deadlineAt: "2027-01-31",
    documentsOnHand: ["passport", "property_title"],
    noDocumentsYet: false,
  });
  const none = M.toJoinDetails({ ...full, documents: ["none"], urgency: "soon" });
  assert.deepEqual(none.intake.documentsOnHand, []);
  assert.equal(none.intake.noDocumentsYet, true);
  assert.equal("deadlineAt" in none.intake, false);
  // keys match the server mapping (server/API/payments/joinIntake.ts reads these)
  const server = readFileSync(new URL("../../server/API/payments/joinIntake.ts", import.meta.url), "utf8");
  for (const k of Object.keys(b.profile)) assert.ok(server.includes(`p.${k}`), `server does not read profile.${k}`);
});

test("join: None yet and the documents exclude each other", () => {
  assert.deepEqual(M.toggleDocuments(["passport", "none"], ["passport"]), ["none"]);
  assert.deepEqual(M.toggleDocuments(["none", "dimex"], ["none"]), ["dimex"]);
  assert.deepEqual(M.toggleDocuments(["dimex"], ["dimex", "passport"]), ["dimex"]);
});

test("join: the free check fills only empty answers, and the form gives the check's answers back", () => {
  const d = M.draftFromCheck({ ...M.EMPTY_DRAFT, ownsVehicle: "yes" }, { residencyStatus: "resident", residencyExpiresAt: "2027-03-01", ownsProperty: true, propertyLocation: "Alajuela", companyType: "none", ownsVehicle: false, hasEmployees: true }, "a@b.co");
  assert.equal(d.residencyStatus, "resident");
  assert.equal(d.ownsProperty, "yes");
  assert.equal(d.ownsVehicle, "yes"); // already answered
  assert.equal(d.hasEmployees, "yes");
  assert.equal(d.email, "a@b.co");
  const a = M.checkAnswersFromDraft({ ...full, residencyStatus: "resident", residencyExpiresAt: "2027-03-01" });
  assert.deepEqual(a, { country: "CR", residencyStatus: "resident", residencyExpiresAt: "2027-03-01", lastEntryDate: undefined, ownsProperty: true, propertyLocation: "Guanacaste", companyType: "SA", ownsVehicle: false, hasEmployees: false });
});

test("join: the draft never stores consents", () => {
  const store = memory();
  M.saveDraft(store, { ...full, marketing: true }, 4);
  const raw = store.m.get(M.DRAFT_KEY);
  for (const k of ["acceptTerms", "acceptPrivacy", "marketing"]) assert.equal(raw.includes(`"${k}"`), false, k);
  const back = M.loadDraft(store);
  assert.equal(back.step, 4);
  assert.equal(back.data.acceptTerms, false);
  assert.equal(back.data.question, full.question);
  M.clearDraft(store);
  assert.equal(M.loadDraft(store), null);
  // blocked storage never throws
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  M.saveDraft(broken, full, 1);
  assert.equal(M.loadDraft(broken), null);
  M.clearDraft(broken);
});

test("join: server field keys open the right step", () => {
  for (const k of ["nationality", "documentsOnHand", "deadlineAt", "marchamoStatus", "residenceProvince", "acceptTerms"]) assert.ok(M.FIELD_STEP[k], k);
});
