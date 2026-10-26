/**
 * Provider (lawyer) API client. A thin wrapper over `createApiClient("lawyer")`
 * so a lawyer session never collides with a staff dashboard session. Sends
 * only the lawyer token (x-provider-token) plus the session cookie; the staff
 * token is no longer attached (plan overhaul 2).
 */

import { ApiError, createApiClient, legacyFetch } from "./api";

export { ApiError };

export const providerApi = createApiClient("lawyer");

export function getProviderToken(): string | null {
  return providerApi.getToken();
}

export function setProviderToken(token: string): void {
  providerApi.setToken(token);
}

export function clearProviderToken(): void {
  providerApi.clearToken();
}

/** Lawyer API fetch. 401s throw (no redirect) so /lawyer keeps its own login flow. */
export function providerFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(providerApi, path, options);
}
