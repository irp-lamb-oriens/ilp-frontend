/**
 * Provider (lawyer) API client. A thin wrapper over `createApiClient("lawyer")`
 * so a lawyer session never collides with a staff dashboard session. Auth is
 * the HttpOnly `ilp_lawyer_session` cookie only (P1); no token is stored.
 */

import { ApiError, createApiClient, legacyFetch, purgeLegacyTokens } from "./api";

export { ApiError };

export const providerApi = createApiClient("lawyer");

/** @deprecated Cookie-only auth (ilp_lawyer_session, HttpOnly): always null. */
export function getProviderToken(): string | null {
  return null;
}

/** @deprecated Cookie-only auth: the server sets the cookie; this does nothing. */
export function setProviderToken(_token?: string): void {}

/** @deprecated Use `providerApi.logout()`. Removes tokens left by older builds only. */
export function clearProviderToken(): void {
  purgeLegacyTokens();
}

/** Lawyer API fetch. 401s throw (no redirect) so /lawyer keeps its own login flow. */
export function providerFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(providerApi, path, options);
}
