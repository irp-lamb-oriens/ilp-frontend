/**
 * lib/serviceConfig.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Frontend mirror of the backend intake field config. Only types, a fetcher,
 * and the declarative condition evaluator live here — the field definitions
 * themselves come from the backend `/api/service-config` endpoint so the form
 * and the assistant always share one source of truth.
 *
 * Tailored for ILP (International Legal Partner): the IRP relocation/moving
 * service types are dropped; the legal-services taxonomy is immigration,
 * legal, realty, corporate, and coaching.
 */

export type ServiceType =
  | "immigration"
  | "legal"
  | "realty"
  | "corporate"
  | "coaching";

export type ServiceFieldType =
  | "text"
  | "email"
  | "phone"
  | "country"
  | "options"
  | "people"
  | "notes"
  | "calendar"
  | "budget"
  | "legal-area"
  | "documents";

export interface ServiceFieldOption {
  value: string;
  label: string;
}

export type FieldCondition =
  | { field: string; equals: unknown }
  | { field: string; oneOf: unknown[] };

export interface ServiceFieldDef {
  id: string;
  type: ServiceFieldType;
  label: string;
  placeholder?: string;
  options?: ServiceFieldOption[];
  required: boolean;
  perPerson?: boolean;
  fields?: ServiceFieldDef[];
  showWhen?: FieldCondition;
  chatbotQuestion: string;
  /**
   * The service context this field belongs to (e.g. "Legal advice",
   * "Real estate assessment"). Set by the server resolver. Drives a slide's
   * context label and the assistant's per-question framing.
   */
  serviceLabel?: string;
  priority: number;
}

export interface ServiceConfig {
  type: ServiceType | "combined";
  label: string;
  fields: ServiceFieldDef[];
  chatbotFields: ServiceFieldDef[];
}

export function evaluateCondition(
  cond: FieldCondition | undefined,
  state: Record<string, any>,
): boolean {
  if (!cond) return true;
  const value = state[cond.field];
  if ("equals" in cond) return value === cond.equals;
  if ("oneOf" in cond) return (cond.oneOf as unknown[]).includes(value);
  return true;
}

/**
 * Fields that capture the same value under different ids across services, so
 * the intake never asks the same thing twice. Each inner array is an
 * equivalence group: when any member already carries a value in the form
 * state, every other member in the group is skipped.
 *
 * Groups are the objectively-tied pairs only, to avoid wrongly dropping a
 * question when two fields merely look similar but serve different purposes:
 *   - legalUrgency / realtyTimeline / coachingTimeline
 *     all ask for the target date ("when are you planning to...?").
 *   - legalNotes / realtyNotes / coachingNotes
 *     all are the free-text "anything else?" catch-all.
 */
export const FIELD_EQUIVALENCE_GROUPS: readonly (readonly string[])[] = [
  ["legalUrgency", "realtyTimeline", "coachingTimeline"],
  ["legalNotes", "realtyNotes", "coachingNotes"],
];

/** All ids in the same equivalence group as `id` (always includes `id`). */
export function equivalentFieldIds(id: string): readonly string[] {
  const group = FIELD_EQUIVALENCE_GROUPS.find((g) => g.includes(id));
  return group ?? [id];
}

/**
 * The selectable services, in display order, for the service slide.
 * Selection is additive; "All of the above" is a master toggle rendered by the
 * slide, not a persisted value.
 */
export const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "immigration", label: "Residency & immigration" },
  { value: "legal", label: "Legal advice" },
  { value: "realty", label: "Real estate" },
  { value: "corporate", label: "Corporate structuring" },
  { value: "coaching", label: "Intercultural coaching" },
];

/** The full additive set, as one toggle. */
export const ALL_SERVICE_TYPES: readonly ServiceType[] = [
  "immigration",
  "legal",
  "realty",
  "corporate",
  "coaching",
];

/**
 * Normalize a raw service value from a URL param or legacy string into a
 * deduplicated list of atomic ServiceType codes. Handles comma/plus joins.
 * Unknown tokens are dropped, returning only known atomic codes.
 */
export function parseServiceTypes(raw: string): ServiceType[] {
  const atoms = raw
    .split(/[,+]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(atoms));
  return unique.filter((t): t is ServiceType => ALL_SERVICE_TYPES.includes(t as ServiceType));
}

/**
 * Destination ISO-2 country codes that unlock the service-selection slide.
 * Destinations not listed here skip the slide and default to `legal`
 * (Legal advice).
 */
export const SERVICE_SLIDE_GATE_COUNTRIES: readonly string[] = ["CO", "CR", "MX", "PA", "PT", "ES"];

/**
 * Derive the legacy `serviceCategory` string from a multi-select. Single
 * selection maps to its code; multiple selections map to a stable sorted,
 * comma-joined tag so existing string consumers keep working. Empty → "".
 */
export function deriveServiceCategory(types: ServiceType[]): string {
  const unique = Array.from(new Set(types)).filter(Boolean).sort();
  return unique.join(",");
}

/** Fetch one or more service configs from the backend, merged server-side. */
export async function fetchServiceConfig(
  apiBase: string,
  type: ServiceType | ServiceType[],
): Promise<ServiceConfig> {
  const value = Array.isArray(type) ? type.join(",") : type;
  const res = await fetch(`${apiBase}/api/service-config?type=${encodeURIComponent(value)}`);
  if (!res.ok) throw new Error("Unable to load the intake form.");
  const data = await res.json();
  return data.config as ServiceConfig;
}