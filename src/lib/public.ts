/**
 * Public (unauthenticated) read helpers for the marketing surface. The three
 * public endpoints (updates, templates, providers) list published/vetted
 * records, so the country + templates pages can render backend content instead
 * of hardcoded copy. Every helper degrades to `null` on failure so a cold
 * backend never breaks the static fallback already in the page.
 */
import { API_URL } from "./api";

export interface PublicUpdate {
  id: string;
  title?: string;
  country?: string;
  category?: string;
  summary?: string;
  source?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PublicTemplate {
  id: string;
  title?: string;
  country?: string;
  category?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PublicProvider {
  id: string;
  name?: string;
  country?: string;
  specialties?: unknown;
  languages?: unknown;
  insurance?: unknown;
  slaStatus?: string;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function fetchUpdates(country?: string): Promise<PublicUpdate[] | null> {
  const q = country ? `?country=${encodeURIComponent(country)}` : "";
  return getJson<PublicUpdate[]>(`/api/updates${q}`);
}

export function fetchTemplates(country?: string): Promise<PublicTemplate[] | null> {
  const q = country ? `?country=${encodeURIComponent(country)}` : "";
  return getJson<PublicTemplate[]>(`/api/templates${q}`);
}

export function fetchProviders(country?: string): Promise<PublicProvider[] | null> {
  const q = country ? `?country=${encodeURIComponent(country)}` : "";
  return getJson<PublicProvider[]>(`/api/providers${q}`);
}