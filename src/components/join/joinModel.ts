/**
 * Guided join form (T3): the form's data, steps, client-side checks, the
 * request body and the draft kept in this browser. Pure (no React), so
 * tests/join.test.mjs can check it. The server repeats every check
 * (server/API/payments/joinIntake.ts) and returns the same field keys.
 */

export const STEP_IDS = ["you", "household", "situation", "first", "plan"] as const;
export type StepId = (typeof STEP_IDS)[number];

export const PROVINCES = ["San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón"] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "either", label: "Either one" },
];

export const CITIZENSHIPS = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "Costa Rica", label: "Costa Rica" },
  { value: "other", label: "Another country" },
] as const;

export const RESIDENCE_COUNTRIES = [
  { value: "Costa Rica", label: "Costa Rica" },
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "other", label: "Somewhere else" },
];

export const TIME_ZONES = [
  { value: "America/Costa_Rica", label: "Costa Rica" },
  { value: "America/New_York", label: "US and Canada Eastern (New York, Toronto)" },
  { value: "America/Chicago", label: "US and Canada Central (Chicago, Winnipeg)" },
  { value: "America/Denver", label: "US and Canada Mountain (Denver, Calgary)" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Los_Angeles", label: "US and Canada Pacific (Los Angeles, Vancouver)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "America/Halifax", label: "Atlantic (Halifax)" },
  { value: "America/St_Johns", label: "Newfoundland" },
];

export const MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "partnered", label: "Living together (unión de hecho)" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

export const RESIDENCY_STATUS_OPTIONS = [
  { value: "resident", label: "I am a resident", hint: "I have a DIMEX card." },
  { value: "applying", label: "My application is in progress" },
  { value: "visitor", label: "I visit as a tourist" },
  { value: "unsure", label: "I am not sure" },
];

export const RESIDENCY_CATEGORY_OPTIONS = [
  { value: "pensionado", label: "Pensionado (retiree with a pension)" },
  { value: "rentista", label: "Rentista (fixed monthly income)" },
  { value: "inversionista", label: "Inversionista (investor)" },
  { value: "permanent", label: "Permanent resident" },
  { value: "digital_nomad", label: "Digital nomad" },
  { value: "family", label: "Through a family link (vínculo)" },
  { value: "other", label: "Another category" },
  { value: "unsure", label: "I am not sure" },
];

export const PROPERTY_TYPE_OPTIONS = [
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "land", label: "Land or a lot" },
  { value: "commercial", label: "Commercial property" },
  { value: "several", label: "More than one property" },
  { value: "other", label: "Something else" },
];

export const PROPERTY_HOLDING_OPTIONS = [
  { value: "personal", label: "In my own name (or my spouse's)" },
  { value: "company", label: "In a company (S.A. or S.R.L.)" },
  { value: "both", label: "Some in my name, some in a company" },
  { value: "unsure", label: "I am not sure" },
];

export const COMPANY_OPTIONS = [
  { value: "SA", label: "Yes, a sociedad anónima (S.A.)" },
  { value: "SRL", label: "Yes, a limitada (S.R.L.)" },
  { value: "none", label: "No" },
  { value: "unsure", label: "I am not sure" },
];

export const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const YES_NO_UNSURE = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "I am not sure" },
];

export const URGENCY_OPTIONS = [
  { value: "deadline", label: "There is a deadline", hint: "A date something is due, like a renewal or a closing." },
  { value: "soon", label: "In the next few weeks" },
  { value: "no_rush", label: "No rush", hint: "I want to understand where I stand." },
];

export const DOCUMENT_OPTIONS = [
  { value: "passport", label: "Passport" },
  { value: "dimex", label: "DIMEX or residency card" },
  { value: "property_title", label: "Property title or plano" },
  { value: "company_books", label: "Company books (S.A. or S.R.L.)" },
  { value: "vehicle_papers", label: "Vehicle papers (título)" },
  { value: "none", label: "None yet" },
] as const;

export const QUESTION_MIN = 10;
export const QUESTION_MAX = 1000;

export const QUESTION_EXAMPLES = [
  "My DIMEX expires in March. When should I start the renewal, and what will I need?",
  "We bought our house through an S.A. in 2019. Is the company up to date with its filings?",
  "Our housekeeper works three days a week. Do we have to register her with the Caja?",
];

type YesNo = "" | "yes" | "no";

export interface Draft {
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  preferredLanguage: string;
  citizenships: string[];
  otherCitizenship: string;
  residenceCountry: string;
  residenceCountryOther: string;
  residenceProvince: string;
  residenceTown: string;
  timezone: string;
  maritalStatus: string;
  livesWithPartner: YesNo;
  childrenAtHome: number;
  otherHousehold: number;
  pets: string;
  residencyStatus: string;
  residencyCategory: string;
  residencyExpiresAt: string;
  lastEntryDate: string;
  ownsProperty: YesNo;
  propertyType: string;
  propertyLocation: string;
  propertyHolding: string;
  companyType: string;
  companyCount: number;
  companyUpToDate: string;
  ownsVehicle: YesNo;
  marchamoStatus: string;
  hasEmployees: YesNo;
  question: string;
  urgency: string;
  deadlineAt: string;
  documents: string[];
  // Never saved in the draft:
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  marketing: boolean;
}

export const EMPTY_DRAFT: Draft = {
  fullName: "",
  preferredName: "",
  email: "",
  phone: "",
  preferredLanguage: "",
  citizenships: [],
  otherCitizenship: "",
  residenceCountry: "",
  residenceCountryOther: "",
  residenceProvince: "",
  residenceTown: "",
  timezone: "",
  maritalStatus: "",
  livesWithPartner: "",
  childrenAtHome: 0,
  otherHousehold: 0,
  pets: "",
  residencyStatus: "",
  residencyCategory: "",
  residencyExpiresAt: "",
  lastEntryDate: "",
  ownsProperty: "",
  propertyType: "",
  propertyLocation: "",
  propertyHolding: "",
  companyType: "",
  companyCount: 1,
  companyUpToDate: "",
  ownsVehicle: "",
  marchamoStatus: "",
  hasEmployees: "",
  question: "",
  urgency: "",
  deadlineAt: "",
  documents: [],
  acceptTerms: false,
  acceptPrivacy: false,
  marketing: false,
};

export type Errors = Partial<Record<string, string>>;

/** Which step shows each field (server error keys included), so a server error opens the right step. */
export const FIELD_STEP: Record<string, StepId> = {
  fullName: "you",
  preferredName: "you",
  email: "you",
  phone: "you",
  preferredLanguage: "you",
  nationality: "you",
  citizenships: "you",
  otherCitizenship: "you",
  residenceCountry: "you",
  residenceCountryOther: "you",
  residenceProvince: "you",
  residenceTown: "you",
  timezone: "you",
  maritalStatus: "household",
  livesWithPartner: "household",
  childrenAtHome: "household",
  otherHousehold: "household",
  pets: "household",
  residencyStatus: "situation",
  residencyCategory: "situation",
  residencyExpiresAt: "situation",
  lastEntryDate: "situation",
  ownsProperty: "situation",
  propertyType: "situation",
  propertyLocation: "situation",
  propertyHolding: "situation",
  companyType: "situation",
  companyCount: "situation",
  companyUpToDate: "situation",
  ownsVehicle: "situation",
  marchamoStatus: "situation",
  hasEmployees: "situation",
  question: "first",
  urgency: "first",
  deadlineAt: "first",
  documentsOnHand: "first",
  documents: "first",
  acceptTerms: "plan",
  acceptPrivacy: "plan",
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,24}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const today = () => new Date().toISOString().slice(0, 10);

/** Country of residence as stored: the chosen name, or what was typed for "Somewhere else". */
export function residenceCountryOf(d: Draft): string {
  return d.residenceCountry === "other" ? d.residenceCountryOther.trim() : d.residenceCountry;
}

/** Citizenships as one line, like "United States, Canada". */
export function nationalityOf(d: Draft): string {
  return d.citizenships
    .map((c) => (c === "other" ? d.otherCitizenship.trim() : c))
    .filter(Boolean)
    .join(", ");
}

/** Checks for one step. Messages match the server's where the rule is the same. */
export function validateStep(step: StepId, d: Draft, now = today()): Errors {
  const e: Errors = {};
  if (step === "you") {
    if (d.fullName.trim().length < 2) e.fullName = "Enter your full name as it appears on your passport.";
    if (!EMAIL_RE.test(d.email.trim())) e.email = "Enter a valid email address.";
    if (!PHONE_RE.test(d.phone.trim())) e.phone = "Enter a mobile or WhatsApp number with the country code, like +1 503 555 0141.";
    if (!d.preferredLanguage) e.preferredLanguage = "Choose the language you prefer for calls and messages.";
    if (!d.citizenships.length) e.citizenships = "Choose at least one citizenship.";
    else if (d.citizenships.includes("other") && d.otherCitizenship.trim().length < 2) e.otherCitizenship = "Say which other country.";
    if (!d.residenceCountry) e.residenceCountry = "Tell us which country you live in now.";
    else if (d.residenceCountry === "other" && d.residenceCountryOther.trim().length < 2) e.residenceCountryOther = "Say which country you live in.";
    if (d.residenceCountry === "Costa Rica" && !(PROVINCES as readonly string[]).includes(d.residenceProvince)) {
      e.residenceProvince = "Choose the province where you live.";
    }
    if (!d.timezone) e.timezone = "Choose your time zone.";
  }
  if (step === "household") {
    if (!d.maritalStatus) e.maritalStatus = "Choose your marital status.";
    if (!d.livesWithPartner) e.livesWithPartner = "Tell us whether a spouse or partner lives with you.";
    if (!Number.isInteger(d.childrenAtHome) || d.childrenAtHome < 0 || d.childrenAtHome > 20) e.childrenAtHome = "Enter how many children live with you, from 0 to 20.";
    if (!Number.isInteger(d.otherHousehold) || d.otherHousehold < 0 || d.otherHousehold > 20) e.otherHousehold = "Enter how many other people live with you, from 0 to 20.";
  }
  if (step === "situation") {
    if (!d.residencyStatus) e.residencyStatus = "Choose your residency status.";
    if ((d.residencyStatus === "resident" || d.residencyStatus === "applying") && !d.residencyCategory) {
      e.residencyCategory = "Choose your residency category, or I am not sure.";
    }
    if (d.residencyStatus === "resident" && d.residencyExpiresAt && !DATE_RE.test(d.residencyExpiresAt)) {
      e.residencyExpiresAt = "Enter the expiry date from your DIMEX card, or leave it empty.";
    }
    if (d.residencyStatus === "visitor" && d.lastEntryDate && (!DATE_RE.test(d.lastEntryDate) || d.lastEntryDate > now)) {
      e.lastEntryDate = "Enter the date of your last entry stamp, or leave it empty.";
    }
    if (!d.ownsProperty) e.ownsProperty = "Tell us whether you own property in Costa Rica.";
    if (d.ownsProperty === "yes") {
      if (!d.propertyType) e.propertyType = "Choose the kind of property.";
      if (!(PROVINCES as readonly string[]).includes(d.propertyLocation)) e.propertyLocation = "Choose the province where the property is.";
      if (!d.propertyHolding) e.propertyHolding = "Tell us whose name the property is in, or I am not sure.";
    }
    if (!d.companyType) e.companyType = "Tell us whether you have a Costa Rican company.";
    if (d.companyType === "SA" || d.companyType === "SRL") {
      if (!Number.isInteger(d.companyCount) || d.companyCount < 1 || d.companyCount > 20) e.companyCount = "Enter how many companies, from 1 to 20.";
      if (!d.companyUpToDate) e.companyUpToDate = "Tell us whether the company filings are up to date, or I am not sure.";
    }
    if (!d.ownsVehicle) e.ownsVehicle = "Tell us whether you own a vehicle in Costa Rica.";
    if (d.ownsVehicle === "yes" && !d.marchamoStatus) e.marchamoStatus = "Tell us whether the marchamo is paid for this year, or I am not sure.";
    if (!d.hasEmployees) e.hasEmployees = "Tell us whether anyone works for you in Costa Rica.";
  }
  if (step === "first") {
    const n = d.question.trim().length;
    if (n < QUESTION_MIN) e.question = `Write your main question in a sentence or two (at least ${QUESTION_MIN} characters).`;
    else if (n > QUESTION_MAX) e.question = `Keep it to ${QUESTION_MAX} characters. You can add more on the call.`;
    if (!d.urgency) e.urgency = "Tell us how soon you need an answer.";
    if (d.urgency === "deadline" && (!DATE_RE.test(d.deadlineAt) || d.deadlineAt < now)) e.deadlineAt = "Enter the date of the deadline, today or later.";
    if (!d.documents.length) e.documents = "Tick the documents you have, or None yet.";
  }
  if (step === "plan") {
    if (!d.acceptTerms) e.acceptTerms = "Please agree to the Terms of Membership, including the monthly renewal.";
    if (!d.acceptPrivacy) e.acceptPrivacy = "Please agree to the Privacy Policy.";
  }
  return e;
}

const yn = (v: YesNo) => (v === "yes" ? true : v === "no" ? false : undefined);

/** The answers the free check needs, from the form (so the lead and its dates match what the member said). */
export function checkAnswersFromDraft(d: Draft): Record<string, string | boolean | undefined> & { country: "CR" } {
  return {
    country: "CR",
    residencyStatus: d.residencyStatus || undefined,
    residencyExpiresAt: d.residencyStatus === "resident" ? d.residencyExpiresAt || undefined : undefined,
    lastEntryDate: d.residencyStatus === "visitor" ? d.lastEntryDate || undefined : undefined,
    ownsProperty: yn(d.ownsProperty),
    propertyLocation: d.ownsProperty === "yes" ? d.propertyLocation || undefined : undefined,
    companyType: d.companyType || undefined,
    ownsVehicle: yn(d.ownsVehicle),
    hasEmployees: yn(d.hasEmployees),
  };
}

/** Fill the form from the free check's answers (only empty fields). */
export function draftFromCheck(d: Draft, answers: Record<string, unknown>, email?: string): Draft {
  const out = { ...d };
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const ynOf = (v: unknown): YesNo => (v === true ? "yes" : v === false ? "no" : "");
  if (!out.residencyStatus) out.residencyStatus = str(answers.residencyStatus);
  if (!out.residencyExpiresAt) out.residencyExpiresAt = str(answers.residencyExpiresAt);
  if (!out.lastEntryDate) out.lastEntryDate = str(answers.lastEntryDate);
  if (!out.ownsProperty) out.ownsProperty = ynOf(answers.ownsProperty);
  if (!out.propertyLocation) out.propertyLocation = str(answers.propertyLocation);
  if (!out.companyType) out.companyType = str(answers.companyType);
  if (!out.ownsVehicle) out.ownsVehicle = ynOf(answers.ownsVehicle);
  if (!out.hasEmployees) out.hasEmployees = ynOf(answers.hasEmployees);
  if (!out.email && email) out.email = email;
  return out;
}

/** The profile and intake parts of POST /api/payments/join (server/API/payments/joinIntake.ts). */
export function toJoinDetails(d: Draft) {
  const resident = d.residencyStatus === "resident" || d.residencyStatus === "applying";
  const company = d.companyType === "SA" || d.companyType === "SRL";
  const inCR = d.residenceCountry === "Costa Rica";
  const docs = d.documents.filter((x) => x !== "none");
  return {
    fullName: d.fullName.trim(),
    email: d.email.trim().toLowerCase(),
    phone: d.phone.trim(),
    profile: {
      preferredName: d.preferredName.trim(),
      preferredLanguage: d.preferredLanguage,
      nationality: nationalityOf(d),
      residenceCountry: residenceCountryOf(d),
      ...(inCR ? { residenceProvince: d.residenceProvince, residenceTown: d.residenceTown.trim() } : {}),
      timezone: d.timezone,
      maritalStatus: d.maritalStatus,
      livesWithPartner: yn(d.livesWithPartner),
      childrenAtHome: d.childrenAtHome,
      otherHousehold: d.otherHousehold,
      pets: d.pets.trim(),
      residencyStatus: d.residencyStatus,
      ...(resident ? { residencyCategory: d.residencyCategory } : {}),
      ...(d.residencyStatus === "resident" && d.residencyExpiresAt ? { residencyExpiresAt: d.residencyExpiresAt } : {}),
      ...(d.residencyStatus === "visitor" && d.lastEntryDate ? { lastEntryDate: d.lastEntryDate } : {}),
      ownsProperty: yn(d.ownsProperty),
      ...(d.ownsProperty === "yes" ? { propertyType: d.propertyType, propertyLocation: d.propertyLocation, propertyHolding: d.propertyHolding } : {}),
      companyType: d.companyType,
      ...(company ? { companyCount: d.companyCount, companyUpToDate: d.companyUpToDate } : {}),
      ownsVehicle: yn(d.ownsVehicle),
      ...(d.ownsVehicle === "yes" ? { marchamoStatus: d.marchamoStatus } : {}),
      hasEmployees: yn(d.hasEmployees),
    },
    intake: {
      question: d.question.trim(),
      urgency: d.urgency,
      ...(d.urgency === "deadline" ? { deadlineAt: d.deadlineAt } : {}),
      documentsOnHand: docs,
      noDocumentsYet: d.documents.includes("none"),
    },
  };
}

/** "None yet" and the documents exclude each other. */
export function toggleDocuments(next: string[], prev: string[]): string[] {
  const added = next.filter((x) => !prev.includes(x));
  if (added.includes("none")) return ["none"];
  if (added.length) return next.filter((x) => x !== "none");
  return next;
}

/** The browser's time zone when it is one we list, else Costa Rica's. */
export function guessTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIME_ZONES.some((z) => z.value === tz)) return tz;
    const alias: Record<string, string> = {
      "America/Toronto": "America/New_York",
      "America/Detroit": "America/New_York",
      "America/Winnipeg": "America/Chicago",
      "America/Edmonton": "America/Denver",
      "America/Vancouver": "America/Los_Angeles",
    };
    return alias[tz] ?? "";
  } catch {
    return "";
  }
}

// ─── Draft storage (this browser only) ─────────────────────────────────────

export const DRAFT_KEY = "ilp_join_draft";

interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/** Consents are never saved (payment details never touch this form): the member ticks them on the day they join. */
export function saveDraft(store: StorageLike | null | undefined, d: Draft, step: number): void {
  try {
    if (!store) return;
    const rest: Partial<Draft> = { ...d };
    delete rest.acceptTerms;
    delete rest.acceptPrivacy;
    delete rest.marketing;
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
    const data = { ...EMPTY_DRAFT, ...parsed.data, acceptTerms: false, acceptPrivacy: false, marketing: false };
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

/** True when anything was typed, so a fresh visit is not called a draft. */
export function hasContent(d: Draft): boolean {
  return !!(d.fullName || d.phone || d.question || d.citizenships.length || d.maritalStatus);
}
