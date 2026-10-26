/**
 * Typed client helpers for the customer-facing domains: consultations
 * (booking) and alerts (compliance micro-form). Both require the user's
 * session cookie (HttpOnly; no token is kept in the browser).
 */
import { apiFetch } from "./api";

export function submitLead(input: {
  name?: string;
  email: string;
  country: string;
  topic?: string;
  consent?: boolean;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/leads", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface CalendarSlot {
  start: string; // ISO
  end: string; // ISO
  timezone: string;
}

export interface ProviderOption {
  id: string;
  name?: string;
  country?: string;
  specialties?: unknown;
  languages?: unknown;
  slaStatus?: string;
}

export interface MyAlert {
  id: string;
  title?: string;
  description?: string;
  country?: string;
  category?: string;
  deadlineLabel?: string;
  deadlineTs?: number;
  status?: string;
  [key: string]: unknown;
}

export function fetchSlots(providerId: string): Promise<CalendarSlot[]> {
  return apiFetch<CalendarSlot[]>(`/api/consultations/slots/${providerId}`);
}

export function bookConsultation(input: {
  providerId: string;
  slot: CalendarSlot;
  source?: string;
  sourceId?: string;
  topic?: string;
  notes?: string;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/consultations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchMyAlerts(): Promise<MyAlert[]> {
  return apiFetch<MyAlert[]>("/api/alerts");
}

export function respondToAlert(
  id: string,
  action: string,
  note?: string,
): Promise<{ ok: boolean; action: string }> {
  return apiFetch<{ ok: boolean; action: string }>(
    `/api/alerts/${id}/respond`,
    {
      method: "POST",
      body: JSON.stringify({ action, note }),
    },
  );
}