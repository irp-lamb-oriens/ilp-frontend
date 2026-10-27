/**
 * Client-side auth helpers: token decode + role gating, portal session checks.
 * Portal sessions are Bearer tokens kept per role in localStorage (see api.ts).
 */

import { clearRoleToken, createApiClient, getRoleToken, type ApiRole } from "./api";

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
 * The signed-in customer, decoded from a customer JWT. Portal sessions are
 * opaque tokens, not JWTs, so this returns null unless a caller passes a
 * customer JWT it received.
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

/** @deprecated Customer JWTs are not stored. Does nothing. */
export function setToken(_token?: string): void {}

/** @deprecated Customer JWTs are not stored. Does nothing. */
export function clearToken(): void {}

// ── Portal sessions ─────────────────────────────────────────────────────────
// Staff, lawyer and client portals each keep their own Bearer token
// (ilp_staff_token, ilp_lawyer_token, ilp_client_token). A stored token may
// have expired: ask the server (an authenticated GET; 401 means signed out and
// clears the token) and use createApiClient(role).logout() to end it.

export type PortalRole = Exclude<ApiRole, "customer">;

/** Routes that answer 200 for a live session of the role and 401 otherwise. */
const SESSION_CHECK: Record<PortalRole, string> = {
  staff: "/api/dashboard/auth/check",
  lawyer: "/api/provider/auth/check",
  client: "/api/client-status/auth/check",
};

/** True when the server accepts this browser's stored token for the role. */
export async function hasPortalSession(role: PortalRole): Promise<boolean> {
  if (!getRoleToken(role)) return false;
  try {
    await createApiClient(role).get(SESSION_CHECK[role], { on401: "throw" });
    return true;
  } catch {
    return false;
  }
}

/** True when a token is stored for the role (it may still be expired; see hasPortalSession). */
export function hasPortalToken(role: PortalRole): boolean {
  return !!getRoleToken(role);
}

/** End the role's session on the server and forget the token. Never throws. */
export async function clearPortalSession(role: PortalRole): Promise<void> {
  await createApiClient(role).logout();
  clearRoleToken(role);
}
