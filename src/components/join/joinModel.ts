/**
 * Guided join form (T3): the form's data, steps, client-side checks, the
 * request body and the draft kept in this browser. Pure (no React), so
 * tests/join.test.mjs can check it. The server repeats every check
 * (server/API/payments/joinIntake.ts) and returns the same field keys.
 */

import { COUNTRIES, COUNTRY_CODES, type CountryCode, isCountryCode } from "@/lib/contracts";
import { type CountryAnswers, type CountryQuestion, missingAnswers } from "@/lib/countryQuestions";

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
  { value: "other", label: "Another country" },
] as const;

/** COUNTRIES: the six countries a membership can cover, for "Which country is your membership about?". */
export const LEGAL_COUNTRY_OPTIONS = COUNTRY_CODES.map((code) => ({ value: code, label: COUNTRIES[code].name }));

export const RESIDENCE_COUNTRIES = [
  ...COUNTRY_CODES.map((code) => ({ value: COUNTRIES[code].name, label: COUNTRIES[code].name })),
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "other", label: "Somewhere else" },
];

/** Each country's own zones first (Spain and Portugal have two, Mexico five), then North America. */
export const COUNTRY_TIME_ZONES = COUNTRY_CODES.flatMap((code) =>
  COUNTRIES[code].timeZones.map((z) => ({
    value: z.id,
    label: COUNTRIES[code].timeZones.length === 1 ? COUNTRIES[code].name : `${COUNTRIES[code].name}: ${z.label}`,
  })),
);

/** The default time zone for a member of `country`. */
export const defaultTimezoneFor = (country: string): string => (isCountryCode(country) ? COUNTRIES[country].defaultTimeZone : "");

export const TIME_ZONES = [
  ...COUNTRY_TIME_ZONES,
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
  { value: "dimex", label: "Residence card or visa" },
  { value: "property_title", label: "Property title or deed" },
  { value: "company_books", label: "Company books or registry papers" },
  { value: "vehicle_papers", label: "Vehicle registration papers" },
  { value: "none", label: "None yet" },
] as const;

export const QUESTION_MIN = 10;
export const QUESTION_MAX = 1000;

export const QUESTION_EXAMPLES = [
  "My DIMEX expires in March. When should I start the renewal, and what will I need?",
  "We bought our house through an S.A. in 2019. Is the company up to date with its filings?",
  "Our housekeeper works three days a week. Do we have to register her with the Caja?",
];

/** Example first questions per country, in each country's own terms (docs/research). */
export const QUESTION_EXAMPLES_BY_COUNTRY: Record<CountryCode, string[]> = {
  CR: QUESTION_EXAMPLES,
  CO: [
    "I have a resident visa from before October 2022. Do I need to do the traspaso, and by when?",
    "We bought our apartment in Medellín with money from the US. Was the foreign investment registered?",
    "Our housekeeper works five days a week. What do we owe her each June and December?",
  ],
  PA: [
    "My Friendly Nations provisional residency ends next year. When should I apply for permanent residency?",
    "Our house is held by a Panamanian S.A. When is the tasa única due, and is the resident agent up to date?",
    "Can I register our home as Vivienda Principal to lower the property tax?",
  ],
  MX: [
    "My temporary resident card expires in April. When should I file the renewal with INM?",
    "Our condo in Puerto Vallarta is in a fideicomiso. What is due each year, and who are the substitute beneficiaries?",
    "We rent our place on Airbnb. Which monthly SAT payments apply to us?",
  ],
  ES: [
    "My non-lucrative permit expires in May. When can I file the renewal, and what will Extranjería ask for?",
    "Do I have to file Modelo 720 for my US retirement accounts this year?",
    "When does my US driving licence stop being valid now that I live in Valencia?",
  ],
  PT: [
    "My D7 residence card expires in June. When should I file the renewal with AIMA?",
    "I became resident last year. Can I still apply for IFICI, and by when?",
    "We rent our Lisbon apartment long-term. Have we registered the lease with the tax authority?",
  ],
};

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
  /** COUNTRIES: the country the membership covers, and that country's situation answers. */
  legalCountry: string;
  countryAnswers: CountryAnswers;
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
  legalCountry: "",
  countryAnswers: {},
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
  legalCountry: "situation",
  countryAnswers: "situation",
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

/** The step that shows a field (country answers are "countryAnswers.<key>"). */
export function stepOfField(key: string): StepId | undefined {
  if (key.startsWith("countryAnswers.")) return "situation";
  return FIELD_STEP[key];
}

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

/**
 * Checks for one step. Messages match the server's where the rule is the same.
 * `questions`: the membership country's situation questions (step 3).
 */
export function validateStep(step: StepId, d: Draft, now = today(), questions?: CountryQuestion[]): Errors {
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
    if (!isCountryCode(d.legalCountry)) e.legalCountry = "Choose the country your membership is about.";
    // The country's questions come from the server; without them the server checks the answers.
    else for (const key of missingAnswers(questions ?? [], d.countryAnswers)) {
      e[`countryAnswers.${key}`] = "Choose an answer, or I am not sure if it is listed.";
    }
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
export function checkAnswersFromDraft(d: Draft): CountryAnswers & { country: string } {
  return { country: isCountryCode(d.legalCountry) ? d.legalCountry : "CR", ...d.countryAnswers };
}

/** Fill the form from the free check's answers (only empty fields). */
export function draftFromCheck(d: Draft, answers: Record<string, unknown>, email?: string): Draft {
  const out = { ...d };
  const country = typeof answers.country === "string" && isCountryCode(answers.country) ? answers.country : "";
  if (!out.legalCountry && country) out.legalCountry = country;
  if (out.legalCountry === country && !Object.keys(out.countryAnswers).length) {
    const copied: CountryAnswers = {};
    for (const [k, v] of Object.entries(answers)) {
      if (k === "country") continue;
      if (typeof v === "string" || (Array.isArray(v) && v.every((x) => typeof x === "string"))) copied[k] = v as string | string[];
    }
    out.countryAnswers = copied;
  }
  if (!out.email && email) out.email = email;
  return out;
}

/** The profile and intake parts of POST /api/payments/join (server/API/payments/joinIntake.ts). */
export function toJoinDetails(d: Draft) {
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
      // COUNTRIES: the server cleans these against the country's questions and derives the shared fields.
      legalCountry: d.legalCountry,
      countryAnswers: d.countryAnswers,
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

/** The browser's time zone when it is one we list (any of the six countries' or North America's). */
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
  return !!(d.fullName || d.phone || d.question || d.citizenships.length || d.maritalStatus || d.legalCountry);
}
