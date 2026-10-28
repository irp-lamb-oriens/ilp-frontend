/**
 * Partner lawyer application (T2): the form's data, steps, client-side
 * checks and draft storage. Pure (no React), so tests/lawyersApply.test.mjs
 * can check it. The server repeats every check (server/API/providers/applyLogic.ts)
 * and returns the same field keys.
 */

export interface WeeklyWindow {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start: string;
  end: string;
}

/** Money fields keep "invalid" while the typed text is not an amount, so the error can show. */
export type Cents = number | null | "invalid";

export const FLAT_FEES = [
  { key: "residency", label: "Residency application (pensionado or rentista)" },
  { key: "company_setup", label: "Setting up an S.A. or S.R.L." },
  { key: "property_review", label: "Property purchase review (title study)" },
  { key: "vehicle_transfer", label: "Vehicle transfer" },
  { key: "will", label: "A simple will" },
] as const;
export type FlatFeeKey = (typeof FLAT_FEES)[number]["key"];

export const AREAS = [
  { value: "immigration", label: "Immigration and residency" },
  { value: "real_estate", label: "Real estate and property" },
  { value: "corporate", label: "Companies (S.A. and S.R.L.)" },
  { value: "tax", label: "Tax" },
  { value: "vehicle", label: "Vehicles" },
  { value: "family_estate", label: "Family and estates" },
  { value: "labor", label: "Labor and domestic staff" },
  { value: "other", label: "Other" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "other", label: "Another language" },
] as const;

export const PROVINCES = ["San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón"] as const;
export const NOTICE_OPTIONS = [
  { value: "12", label: "12 hours" },
  { value: "24", label: "24 hours" },
  { value: "48", label: "48 hours" },
  { value: "72", label: "72 hours" },
];

export const BIO_MIN = 80;
export const BIO_MAX = 800;

export interface Draft {
  name: string;
  email: string;
  phone: string;
  languages: string[];
  city: string;
  province: string;
  carne: string;
  yearAdmitted: string;
  notary: "" | "yes" | "no";
  notaryCarne: string;
  firmName: string;
  firmWebsite: string;
  yearsInPractice: number;
  areas: string[];
  otherArea: string;
  areaComfort: Record<string, "regular" | "sometimes">;
  weekly: WeeklyWindow[];
  callsPerWeek: number;
  minNoticeHours: string;
  hourlyRateCents: Cents;
  flatFeesCents: Partial<Record<FlatFeeKey, Cents>>;
  quotePreference: "" | "flat" | "hourly" | "either";
  invoicingEntity: "" | "individual" | "firm";
  bio: string;
  licensedInGoodStanding: boolean;
  partnerTerms: boolean;
  privacy: boolean;
  carneVerification: boolean;
}

export const EMPTY_DRAFT: Draft = {
  name: "",
  email: "",
  phone: "",
  languages: [],
  city: "",
  province: "",
  carne: "",
  yearAdmitted: "",
  notary: "",
  notaryCarne: "",
  firmName: "",
  firmWebsite: "",
  yearsInPractice: 0,
  areas: [],
  otherArea: "",
  areaComfort: {},
  weekly: [],
  callsPerWeek: 4,
  minNoticeHours: "24",
  hourlyRateCents: null,
  flatFeesCents: {},
  quotePreference: "",
  invoicingEntity: "",
  bio: "",
  licensedInGoodStanding: false,
  partnerTerms: false,
  privacy: false,
  carneVerification: false,
};

export type Errors = Partial<Record<string, string>>;

export const STEP_IDS = ["you", "practice", "areas", "availability", "fees", "about", "agreements"] as const;
export type StepId = (typeof STEP_IDS)[number];

/** Which step shows each field (server error keys included), so a server error opens the right step. */
export const FIELD_STEP: Record<string, StepId> = {
  name: "you",
  email: "you",
  phone: "you",
  languages: "you",
  city: "you",
  province: "you",
  carne: "practice",
  yearAdmitted: "practice",
  notary: "practice",
  notaryCarne: "practice",
  firmName: "practice",
  firmWebsite: "practice",
  yearsInPractice: "practice",
  areas: "areas",
  otherArea: "areas",
  weekly: "availability",
  callsPerWeek: "availability",
  minNoticeHours: "availability",
  hourlyRateCents: "fees",
  ...Object.fromEntries(FLAT_FEES.map((f) => [`fee_${f.key}`, "fees"])),
  quotePreference: "fees",
  invoicingEntity: "fees",
  bio: "about",
  licensedInGoodStanding: "agreements",
  partnerTerms: "agreements",
  privacy: "agreements",
  carneVerification: "agreements",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,24}$/;
const CARNE_RE = /^\d{1,7}$/;
const digits = (v: string) => v.trim().replace(/[\s.-]/g, "");
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Checks for one step. Messages match the server's where the rule is the same. */
export function validateStep(step: StepId, d: Draft, year = new Date().getFullYear()): Errors {
  const e: Errors = {};
  if (step === "you") {
    if (d.name.trim().length < 2) e.name = "Enter your full name as it appears on your Colegio carné.";
    if (!EMAIL_RE.test(d.email.trim())) e.email = "Enter an email address you check, like name@yourfirm.cr.";
    if (!PHONE_RE.test(d.phone.trim())) e.phone = "Enter a mobile number with the country code, like +506 8888 1234.";
    if (!d.languages.length) e.languages = "Choose at least one language you can hold a call in.";
    if (d.city.trim().length < 2) e.city = "Enter the city or town where you work.";
    if (!(PROVINCES as readonly string[]).includes(d.province)) e.province = "Choose your province.";
  }
  if (step === "practice") {
    if (!CARNE_RE.test(digits(d.carne))) e.carne = "Enter your carné number from the Colegio de Abogados y Abogadas, digits only.";
    const y = Number(d.yearAdmitted);
    if (!Number.isInteger(y) || y < 1950 || y > year) e.yearAdmitted = `Enter the year you were admitted, between 1950 and ${year}.`;
    if (!d.notary) e.notary = "Tell us whether you are a notary public.";
    if (d.notary === "yes" && !CARNE_RE.test(digits(d.notaryCarne))) e.notaryCarne = "Enter your notary number, digits only.";
    if (d.firmWebsite.trim() && !/^(https?:\/\/)?[^\s/.]+\.[^\s]+$/i.test(d.firmWebsite.trim())) e.firmWebsite = "Enter a web address like yourfirm.cr, or leave it empty.";
    if (!Number.isInteger(d.yearsInPractice) || d.yearsInPractice < 0 || d.yearsInPractice > 70) e.yearsInPractice = "Enter your years in practice, from 0 to 70.";
    else if (Number.isInteger(y) && y >= 1950 && d.yearsInPractice > year - y + 1) e.yearsInPractice = "Your years in practice cannot be more than the years since you were admitted.";
  }
  if (step === "areas") {
    if (!d.areas.length) e.areas = "Choose at least one legal area.";
    if (d.areas.includes("other") && d.otherArea.trim().length < 2) e.otherArea = "Say which other area you work in.";
  }
  if (step === "availability") {
    if (!d.weekly.length) e.weekly = "Add the hours of at least one day when members could book a call.";
    else if (d.weekly.some((w) => toMin(w.start) >= toMin(w.end))) e.weekly = "One of your time ranges ends before it starts.";
    if (!Number.isInteger(d.callsPerWeek) || d.callsPerWeek < 1 || d.callsPerWeek > 40) e.callsPerWeek = "Enter between 1 and 40 calls a week.";
    if (!NOTICE_OPTIONS.some((o) => o.value === d.minNoticeHours)) e.minNoticeHours = "Choose how much notice you need before a call.";
  }
  if (step === "fees") {
    if (typeof d.hourlyRateCents !== "number" || d.hourlyRateCents <= 0) e.hourlyRateCents = "Enter your usual hourly rate in US dollars.";
    for (const f of FLAT_FEES) if (d.flatFeesCents[f.key] === "invalid") e[`fee_${f.key}`] = "Enter an amount in US dollars, or leave it empty.";
    if (!d.quotePreference) e.quotePreference = "Choose how you prefer to quote.";
    if (!d.invoicingEntity) e.invoicingEntity = "Choose who sends the invoices.";
  }
  if (step === "about") {
    const n = d.bio.trim().length;
    if (n < BIO_MIN) e.bio = `Write at least ${BIO_MIN} characters, so members know who they will talk to.`;
    else if (n > BIO_MAX) e.bio = `Keep it to ${BIO_MAX} characters or fewer.`;
  }
  if (step === "agreements") {
    if (!d.licensedInGoodStanding) e.licensedInGoodStanding = "Confirm that you are licensed and in good standing.";
    if (!d.partnerTerms) e.partnerTerms = "Read and accept the partner lawyer terms to apply.";
    if (!d.privacy) e.privacy = "Read and accept the privacy policy to apply.";
    if (!d.carneVerification) e.carneVerification = "Allow us to check your carné with the Colegio, or we cannot review the application.";
  }
  return e;
}

/** The JSON body POST /api/providers/apply expects. */
export function toRequestBody(d: Draft, versions: { partnerTerms: string; privacy: string }, extra: { homepage: string; elapsedMs: number }) {
  const fees: Record<string, number> = {};
  for (const f of FLAT_FEES) {
    const c = d.flatFeesCents[f.key];
    if (typeof c === "number" && c > 0) fees[f.key] = c;
  }
  return {
    name: d.name.trim(),
    email: d.email.trim().toLowerCase(),
    phone: d.phone.trim(),
    languages: d.languages,
    city: d.city.trim(),
    province: d.province,
    carne: digits(d.carne),
    yearAdmitted: Number(d.yearAdmitted),
    notary: d.notary === "yes",
    ...(d.notary === "yes" ? { notaryCarne: digits(d.notaryCarne) } : {}),
    firmName: d.firmName.trim(),
    firmWebsite: d.firmWebsite.trim(),
    yearsInPractice: d.yearsInPractice,
    areas: d.areas,
    otherArea: d.areas.includes("other") ? d.otherArea.trim() : "",
    areaComfort: Object.fromEntries(Object.entries(d.areaComfort).filter(([a]) => d.areas.includes(a))),
    weekly: d.weekly,
    callsPerWeek: d.callsPerWeek,
    minNoticeHours: Number(d.minNoticeHours),
    hourlyRateCents: typeof d.hourlyRateCents === "number" ? d.hourlyRateCents : null,
    flatFeesCents: fees,
    quotePreference: d.quotePreference,
    invoicingEntity: d.invoicingEntity,
    bio: d.bio.trim(),
    agreements: {
      licensedInGoodStanding: d.licensedInGoodStanding,
      partnerTerms: d.partnerTerms,
      partnerTermsVersion: versions.partnerTerms,
      privacy: d.privacy,
      privacyVersion: versions.privacy,
      carneVerification: d.carneVerification,
    },
    homepage: extra.homepage,
    elapsedMs: extra.elapsedMs,
  };
}

// ─── Draft storage (this browser only) ─────────────────────────────────────

export const DRAFT_KEY = "ilp_lawyer_apply_draft";
/** sessionStorage: the email the lawyer applied with, to prefill the portal sign-in once. */
export const APPLIED_EMAIL_KEY = "ilp_lawyer_apply_email";

interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/** Agreements are never saved: the lawyer ticks them again on the day they send. */
export function saveDraft(store: StorageLike | null | undefined, d: Draft, step: number): void {
  try {
    if (!store) return;
    const rest: Partial<Draft> = { ...d };
    delete rest.licensedInGoodStanding;
    delete rest.partnerTerms;
    delete rest.privacy;
    delete rest.carneVerification;
    store.setItem(DRAFT_KEY, JSON.stringify({ v: 1, step, savedAt: new Date().toISOString(), data: rest }));
  } catch {
    // Storage full or blocked: the form still works without a draft.
  }
}

export function loadDraft(store: StorageLike | null | undefined): { data: Draft; step: number; savedAt: string } | null {
  try {
    const raw = store?.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number; step?: number; savedAt?: string; data?: Partial<Draft> };
    if (parsed.v !== 1 || !parsed.data || typeof parsed.data !== "object") return null;
    const data = { ...EMPTY_DRAFT, ...parsed.data, licensedInGoodStanding: false, partnerTerms: false, privacy: false, carneVerification: false };
    const step = Math.min(Math.max(0, Number(parsed.step) || 0), STEP_IDS.length - 1);
    return { data, step, savedAt: String(parsed.savedAt ?? "") };
  } catch {
    return null;
  }
}

export function clearDraft(store: StorageLike | null | undefined): void {
  try {
    store?.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/** True when the draft has anything typed, so a fresh visit is not called a draft. */
export function hasContent(d: Draft): boolean {
  return !!(d.name || d.email || d.phone || d.carne || d.bio || d.areas.length || d.weekly.length);
}
