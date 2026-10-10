/**
 * Centralized API client. All frontend->backend calls route through here so
 * the base URL, auth header, and error shape stay in one place.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("ilp_token");
}

const DASHBOARD_TOKEN_KEY = "ilp_dashboard_token";

export function getDashboardToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DASHBOARD_TOKEN_KEY);
}

export function setDashboardToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DASHBOARD_TOKEN_KEY, token);
  }
}

export function clearDashboardToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DASHBOARD_TOKEN_KEY);
  }
}

/**
 * Fetch against the dashboard API using the session token (x-dashboard-token),
 * not the customer JWT. Used by the staff dashboard after OTP login.
 */
export async function dashboardFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getDashboardToken();
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

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
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