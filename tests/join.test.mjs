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
  legalCountry: "CR",
  countryAnswers: { residencyStatus: "pending", residencyCategory: "pensionado", ownsProperty: "yes", hasCompany: "inactive", rentsProperty: "no", ownsVehicle: "no", hasEmployees: "no", hasLocalWill: "unsure" },
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
  assert.deepEqual(Object.keys(M.validateStep("situation", e, TODAY)).sort(), ["legalCountry"]);
  assert.deepEqual(Object.keys(M.validateStep("first", e, TODAY)).sort(), ["documents", "question", "urgency"]);
  assert.deepEqual(Object.keys(M.validateStep("plan", e, TODAY)).sort(), ["acceptPrivacy", "acceptTerms"]);
  // optional fields stay optional
  assert.equal(M.validateStep("you", { ...full, preferredName: "", residenceTown: "" }, TODAY).preferredName, undefined);
  assert.deepEqual(M.validateStep("household", { ...full, pets: "" }, TODAY), {});
});

/** A few of the Costa Rica check questions, as GET /api/countries/CR/questions?stage=check returns them. */
const QS = [
  { key: "residencyStatus", stage: "check", question: "Status?", type: "choice", options: [{ value: "pending", label: "a" }, { value: "temporary", label: "b" }, { value: "none", label: "c" }], source: "research" },
  { key: "residencyCategory", stage: "check", question: "Category?", type: "choice", showIf: { residencyStatus: ["temporary", "pending"] }, options: [{ value: "pensionado", label: "a" }], source: "research" },
  { key: "residencyExpiryDate", stage: "check", question: "Expiry?", type: "date", optional: true, showIf: { residencyStatus: ["temporary"] }, options: [], source: "research" },
  { key: "ownsProperty", stage: "check", question: "Property?", type: "choice", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], source: "research" },
  { key: "propertyUse", stage: "profile", question: "Use?", type: "choice", options: [{ value: "residence", label: "a" }], source: "ilp" },
];

test("join: the country's questions are required only when shown, dates and profile questions stay optional", () => {
  assert.deepEqual(M.validateStep("situation", full, TODAY, QS), {});
  const none = M.validateStep("situation", { ...full, countryAnswers: {} }, TODAY, QS);
  assert.deepEqual(Object.keys(none).sort(), ["countryAnswers.ownsProperty", "countryAnswers.residencyStatus"]);
  const temp = M.validateStep("situation", { ...full, countryAnswers: { residencyStatus: "temporary", ownsProperty: "no" } }, TODAY, QS);
  assert.deepEqual(Object.keys(temp), ["countryAnswers.residencyCategory"]);
  assert.deepEqual(M.validateStep("situation", { ...full, countryAnswers: { residencyStatus: "none", ownsProperty: "no" } }, TODAY, QS), {});
  assert.equal(M.stepOfField("countryAnswers.ownsProperty"), "situation");
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
  assert.equal(b.profile.legalCountry, "CR");
  assert.deepEqual(b.profile.countryAnswers, full.countryAnswers);
  assert.equal("residencyStatus" in b.profile, false); // derived by the server from the country answers
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

test("join: the free check fills the country and its answers once, and the form gives the check's answers back", () => {
  const d = M.draftFromCheck({ ...M.EMPTY_DRAFT }, { country: "ES", residencyStatus: "nonLucrative", ownsProperty: "yes", lifeEvent: ["sale"] }, "a@b.co");
  assert.equal(d.legalCountry, "ES");
  assert.deepEqual(d.countryAnswers, { residencyStatus: "nonLucrative", ownsProperty: "yes", lifeEvent: ["sale"] });
  assert.equal(d.email, "a@b.co");
  // Already chose another country: the check's answers are not mixed in.
  const other = M.draftFromCheck({ ...M.EMPTY_DRAFT, legalCountry: "PT" }, { country: "ES", residencyStatus: "visitor" });
  assert.deepEqual(other.countryAnswers, {});
  assert.deepEqual(M.checkAnswersFromDraft(full), { country: "CR", ...full.countryAnswers });
  // Each country's own time zones come first in the list; Spain has two.
  assert.equal(M.defaultTimezoneFor("PT"), "Europe/Lisbon");
  assert.ok(M.TIME_ZONES.some((z) => z.value === "Atlantic/Canary"));
  assert.equal(M.LEGAL_COUNTRY_OPTIONS.length, 6);
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
  for (const k of ["nationality", "documentsOnHand", "deadlineAt", "legalCountry", "residenceProvince", "acceptTerms"]) assert.ok(M.FIELD_STEP[k], k);
});
