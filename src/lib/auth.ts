/**
 * Client-side auth helpers: token decode + role gating.
 * Tokens are the ILP user-session JWTs signed by the backend.
 */

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

export function getUser(): SessionUser | null {
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("ilp_token")
    : null;
  if (!token) return null;
  const payload = decodeJwt<{ uid: string; email: string; role: Role }>(token);
  if (!payload?.uid) return null;
  return { uid: payload.uid, email: payload.email, role: payload.role };
}

export function hasRole(required: Role | Role[]): boolean {
  const user = getUser();
  if (!user) return false;
  return Array.isArray(required)
    ? required.includes(user.role)
    : user.role === required;
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("ilp_token", token);
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("ilp_token");
  }
}