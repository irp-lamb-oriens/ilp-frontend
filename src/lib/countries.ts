/**
 * lib/countries.ts — country legal-priority catalog + user deadlines client.
 *
 * Mirrors the server's `API/countries` router. The catalog is public; the
 * user's deadlines are private and require the customer JWT (via apiFetch).
 */
import { apiFetch } from "./api";

export type PriorityCategory =
  | "Residency"
  | "Tax"
  | "Property"
  | "Corporate"
  | "Social security";

export interface LegalPriority {
  id: string;
  country: string;
  category: PriorityCategory;
  title: string;
  description: string;
  dateFieldLabel: string;
  dateFieldHint?: string;
  reminderOffsetsDays: number[];
}

export interface CountryRef {
  code: string;
  name: string;
}

export interface UserDeadline {
  priorityId: string;
  date: string;
  note?: string;
  updatedAt: string;
}

export function fetchCountries(): Promise<CountryRef[]> {
  return apiFetch<{ countries: CountryRef[] }>("/api/countries").then(
    (r) => r.countries,
  );
}

export function fetchPriorities(country: string): Promise<LegalPriority[]> {
  return apiFetch<{ priorities: LegalPriority[] }>(
    `/api/countries/${encodeURIComponent(country)}/priorities`,
  ).then((r) => r.priorities);
}

export function fetchMyDeadlines(): Promise<Record<string, UserDeadline>> {
  return apiFetch<{ deadlines: Record<string, UserDeadline> }>(
    "/api/countries/me/deadlines",
  ).then((r) => r.deadlines);
}

export function saveDeadline(
  priorityId: string,
  date: string,
  note?: string,
): Promise<{ ok: boolean; deadline: UserDeadline }> {
  return apiFetch<{ ok: boolean; deadline: UserDeadline }>(
    `/api/countries/me/deadlines/${encodeURIComponent(priorityId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ date, ...(note ? { note } : {}) }),
    },
  );
}

export function removeDeadline(priorityId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/countries/me/deadlines/${encodeURIComponent(priorityId)}`,
    { method: "DELETE" },
  );
}