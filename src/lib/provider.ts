/**
 * Provider (lawyer) API client. Mirrors `lib/api.ts` but uses a separate
 * token key so a lawyer session never collides with a staff dashboard
 * session. All lawyer-facing calls route through `providerFetch`.
 */

import { API_URL, ApiError } from "./api";

export { ApiError };

const PROVIDER_TOKEN_KEY = "ilp_provider_token";

export function getProviderToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PROVIDER_TOKEN_KEY);
}

export function setProviderToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROVIDER_TOKEN_KEY, token);
  }
}

export function clearProviderToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PROVIDER_TOKEN_KEY);
  }
}

/**
 * Fetch against the provider API using the lawyer session token
 * (x-dashboard-token header, same shape the server's requireProviderAuth
 * reads). Used by the /lawyer dashboard after OTP login.
 */
export async function providerFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getProviderToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("x-dashboard-token", token);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = String(data.error);
    } catch {
      // ignore parse failures
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}