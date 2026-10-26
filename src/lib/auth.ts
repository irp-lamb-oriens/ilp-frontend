/**
 * Client-side auth helpers: token decode + role gating, portal session checks.
 * No session token is stored in the browser (P1: HttpOnly cookies only).
 */

import { createApiClient, purgeLegacyTokens, type ApiRole } from "./api";

export type Role = "customer" | "provider" | "staff";

export interface SessionUser {
  uid: string;
  email: string;
  role: Role;
}

function decodeJwt<T>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * The signed-in customer, decoded from a customer JWT. Sessions are HttpOnly
 * cookies now (P1), so the browser holds no JWT to decode: this returns null
 * unless a caller passes a token it received in memory.
 */
export function getUser(token?: string | null): SessionUser | null {
  if (!token) return null;
  const payload = decodeJwt<{ uid: string; email: string; role: Role }>(token);
  if (!payload?.uid) return null;
  return { uid: payload.uid, email: payload.email, role: payload.role };
}

export function hasRole(required: Role | Role[], token?: string | null): boolean {
  const user = getUser(token);
  if (!user) return false;
  return Array.isArray(required)
    ? required.includes(user.role)
    : user.role === required;
}

/** @deprecated Cookie-only auth: tokens are never stored in the browser. Does nothing. */
export function setToken(_token?: string): void {}

/** @deprecated Cookie-only auth: removes tokens left by older builds only. */
export function clearToken(): void {
  purgeLegacyTokens();
}

// ── Portal sessions ─────────────────────────────────────────────────────────
// Staff, lawyer and client portals each keep their own HttpOnly cookie
// (ilp_staff_session, ilp_lawyer_session, ilp_client_session). JavaScript
// cannot see it: ask the server whether a session exists (an authenticated
// GET; 401 means signed out) and use createApiClient(role).logout() to end it.

export type PortalRole = Exclude<ApiRole, "customer">;

/** Routes that answer 200 for a live session of the role and 401 otherwise. */
const SESSION_CHECK: Record<PortalRole, string> = {
  staff: "/api/dashboard/auth/check",
  lawyer: "/api/provider/auth/check",
  client: "/api/client-status/auth/check",
};

/** True when the server accepts this browser's session cookie for the role. */
export async function hasPortalSession(role: PortalRole): Promise<boolean> {
  try {
    await createApiClient(role).get(SESSION_CHECK[role], { on401: "throw" });
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Cookie-only auth: the browser holds no token. Always false; use hasPortalSession(). */
export function hasPortalToken(_role?: PortalRole): boolean {
  return false;
}

/** End the role's session on the server (clears the cookie). Never throws. */
export async function clearPortalSession(role: PortalRole): Promise<void> {
  await createApiClient(role).logout();
}
