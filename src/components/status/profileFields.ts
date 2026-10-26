import { PROFILE_FIELDS, PROFILE_SECTIONS, type ProfileSection } from "@/lib/contracts";

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
  property: { title: "Property", why: "Owning property in Costa Rica brings yearly taxes and registrations." },
  company: { title: "Company", why: "Costa Rican companies have yearly filings, even when inactive." },
  vehicle: { title: "Vehicle", why: "Vehicles need a yearly circulation permit (marchamo)." },
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
    label: "Residency status in Costa Rica",
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
  residencyExpiresAt: { label: "Residency card (DIMEX) expiry date", kind: "date", hint: "Leave empty if you do not have one yet." },
  ownsProperty: { label: "Do you own property in Costa Rica?", kind: "yesno" },
  propertyLocation: { label: "Where is the property?", kind: "text", hint: "Town and province, e.g. Tamarindo, Guanacaste." },
  hasCompany: { label: "Do you own a Costa Rican company?", kind: "yesno" },
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
  ownsVehicle: { label: "Do you own a vehicle in Costa Rica?", kind: "yesno" },
};

export function sectionFields(section: ProfileSection): string[] {
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
