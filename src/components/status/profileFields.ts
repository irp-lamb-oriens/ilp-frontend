import { PROFILE_DETAIL_FIELDS, PROFILE_FIELDS, PROFILE_SECTIONS, type ProfileSection } from "@/lib/contracts";
import { COUNTRY_ZONE_OPTIONS } from "@/lib/timeZones";

const NORTH_AMERICA_ZONES = [
  { value: "America/New_York", label: "US and Canada Eastern" },
  { value: "America/Chicago", label: "US and Canada Central" },
  { value: "America/Denver", label: "US and Canada Mountain" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Los_Angeles", label: "US and Canada Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "America/Halifax", label: "Atlantic (Halifax)" },
];

export type FieldKind = "text" | "tel" | "date" | "number" | "yesno" | "select";

export interface FieldMeta {
  label: string;
  kind: FieldKind;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  /** Shown but not editable here (the sign-in email). */
  readOnly?: boolean;
}

export const SECTION_COPY: Record<ProfileSection, { title: string; why: string }> = {
  identity: { title: "About you", why: "So your lawyer knows who they are advising." },
  household: { title: "Household", why: "Family details change residency and inheritance questions." },
  immigration: { title: "Residency", why: "Your status and its renewal date drive several deadlines." },
  property: { title: "Property", why: "Owning property in your country brings yearly taxes and registrations." },
  company: { title: "Company", why: "Local companies have yearly filings, even when inactive." },
  vehicle: { title: "Vehicle", why: "Vehicles have yearly fees, inspections and insurance (in Costa Rica, the marchamo)." },
};

/** One entry per PROFILE_FIELDS key, so the completion bar matches staff and lawyer views. */
export const FIELD_META: Record<string, FieldMeta> = {
  fullName: { label: "Full legal name", kind: "text", hint: "As it appears on your passport." },
  email: { label: "Email", kind: "text", readOnly: true, hint: "This is the email you sign in with." },
  phone: { label: "Phone", kind: "tel", hint: "Include the country code, e.g. +1 503 555 0141." },
  nationality: { label: "Nationality", kind: "text" },
  dateOfBirth: { label: "Date of birth", kind: "date" },
  maritalStatus: {
    label: "Marital status",
    kind: "select",
    options: [
      { value: "single", label: "Single" },
      { value: "married", label: "Married" },
      { value: "partnered", label: "Living together (unión de hecho)" },
      { value: "divorced", label: "Divorced" },
      { value: "widowed", label: "Widowed" },
    ],
  },
  dependents: { label: "Dependents living with you", kind: "number", hint: "Children or others you support. Enter 0 if none." },
  residencyStatus: {
    label: "Residency status",
    kind: "select",
    options: [
      { value: "resident", label: "Resident" },
      { value: "pensionado", label: "Resident: pensionado" },
      { value: "rentista", label: "Resident: rentista" },
      { value: "inversionista", label: "Resident: inversionista" },
      { value: "permanent", label: "Permanent resident" },
      { value: "applying", label: "Application in progress" },
      { value: "digital_nomad", label: "Digital nomad stay" },
      { value: "visitor", label: "Visitor (tourist stay)" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  residencyExpiresAt: { label: "Residency card or visa expiry date", kind: "date", hint: "Your DIMEX, TIE, resident card or visa. Leave empty if you do not have one yet." },
  ownsProperty: { label: "Do you own property in your country?", kind: "yesno" },
  propertyLocation: { label: "Where is the property?", kind: "text", hint: "Town and region, e.g. Tamarindo, Guanacaste or Lagos, Faro." },
  hasCompany: { label: "Do you own a local company?", kind: "yesno" },
  companyType: {
    label: "Type of company",
    kind: "select",
    options: [
      { value: "SA", label: "Sociedad Anónima (S.A.)" },
      { value: "SRL", label: "Sociedad de Responsabilidad Limitada (S.R.L.)" },
      { value: "none", label: "No company" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  ownsVehicle: { label: "Do you own a vehicle in your country?", kind: "yesno" },

  // T3: detail keys (PROFILE_DETAIL_FIELDS), filled by the join form. They do not count toward completion.
  preferredName: { label: "What should we call you?", kind: "text", hint: "Optional. The name your lawyer and your ILP team use with you." },
  preferredLanguage: {
    label: "Language for calls and messages",
    kind: "select",
    options: [
      { value: "en", label: "English" },
      { value: "es", label: "Spanish" },
      { value: "either", label: "English or Spanish" },
    ],
  },
  residenceCountry: { label: "Country where you live now", kind: "text" },
  residenceProvince: { label: "Province, state or region where you live", kind: "text" },
  residenceTown: { label: "Town where you live", kind: "text", hint: "Like Atenas, Medellín or Valencia." },
  timezone: { label: "Time zone", kind: "select", hint: "Call times are shown in this time zone.", options: [...COUNTRY_ZONE_OPTIONS, ...NORTH_AMERICA_ZONES] },
  legalCountry: { label: "Country your membership covers", kind: "text", readOnly: true, hint: "Your ILP team can change it for you." },
  livesWithPartner: { label: "Does a spouse or partner live with you?", kind: "yesno" },
  childrenAtHome: { label: "Children living with you", kind: "number", hint: "Enter 0 if none." },
  otherHousehold: { label: "Other people living with you", kind: "number", hint: "Parents or other relatives you support. Enter 0 if none." },
  pets: { label: "Pets", kind: "text", hint: "Optional. Useful if you travel or move with them, like two dogs." },
  hasEmployees: { label: "Does anyone work for you in your country?", kind: "yesno", hint: "Including a housekeeper, gardener, caretaker or driver." },
  residencyCategory: {
    label: "Residency category",
    kind: "select",
    options: [
      { value: "pensionado", label: "Pensionado (retiree with a pension)" },
      { value: "rentista", label: "Rentista (fixed monthly income)" },
      { value: "inversionista", label: "Inversionista (investor)" },
      { value: "permanent", label: "Permanent resident" },
      { value: "digital_nomad", label: "Digital nomad" },
      { value: "family", label: "Through a family link (vínculo)" },
      { value: "other", label: "Another category" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  lastEntryDate: { label: "Date of your last entry to the country", kind: "date", hint: "For visitors: the date on your most recent entry stamp." },
  propertyType: {
    label: "Kind of property",
    kind: "select",
    options: [
      { value: "house", label: "House" },
      { value: "condo", label: "Condo" },
      { value: "land", label: "Land or a lot" },
      { value: "commercial", label: "Commercial property" },
      { value: "several", label: "More than one property" },
      { value: "other", label: "Something else" },
    ],
  },
  propertyHolding: {
    label: "Whose name is the property in?",
    kind: "select",
    options: [
      { value: "personal", label: "My own name (or my spouse's)" },
      { value: "company", label: "A company" },
      { value: "both", label: "Some in my name, some in a company" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  companyCount: { label: "How many local companies", kind: "number" },
  companyUpToDate: {
    label: "Are the company filings up to date?",
    kind: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  marchamoStatus: {
    label: "Is this year's marchamo paid?",
    kind: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
};

/** Every field shown in a section: the counted ones, then the details (T3). */
export function sectionFields(section: ProfileSection): string[] {
  return [...PROFILE_FIELDS[section], ...PROFILE_DETAIL_FIELDS[section]];
}

/** Only the fields that count toward profile completion. */
export function countedFields(section: ProfileSection): string[] {
  return PROFILE_FIELDS[section];
}

export { PROFILE_SECTIONS };

export function isFilled(v: unknown): boolean {
  return v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "");
}

/** Value as shown in an input. */
export function toInput(v: unknown, kind: FieldKind): string {
  if (v === null || v === undefined) return "";
  if (kind === "yesno") return v === true || v === "true" ? "yes" : v === false || v === "false" ? "no" : "";
  if (kind === "date") return String(v).slice(0, 10);
  return String(v);
}

/** Input string back to the stored value. */
export function fromInput(s: string, kind: FieldKind): string | number | boolean | null {
  const t = s.trim();
  if (!t) return null;
  if (kind === "yesno") return t === "yes";
  if (kind === "number") {
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return t;
}
