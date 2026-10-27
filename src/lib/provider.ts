/**
 * Provider (lawyer) API client. A thin wrapper over `createApiClient("lawyer")`
 * so a lawyer session never collides with a staff dashboard session. Auth is
 * the lawyer's Bearer token (localStorage `ilp_lawyer_token`, see api.ts).
 */

import { ApiError, clearRoleToken, createApiClient, getRoleToken, legacyFetch, setRoleToken } from "./api";

export { ApiError };

export const providerApi = createApiClient("lawyer");

/** The lawyer session token, or null. */
export function getProviderToken(): string | null {
  return getRoleToken("lawyer");
}

/** Store the lawyer session token returned by verify-otp. */
export function setProviderToken(token?: string): void {
  if (token) setRoleToken("lawyer", token);
}

/** Forget the lawyer token (prefer `providerApi.logout()`, which also ends the server session). */
export function clearProviderToken(): void {
  clearRoleToken("lawyer");
}

/** Lawyer API fetch. 401s throw (no redirect) so /lawyer keeps its own login flow. */
export function providerFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(providerApi, path, options);
}
