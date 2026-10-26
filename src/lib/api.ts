/**
 * Centralized API client. All frontend->backend calls route through
 * `createApiClient(role)` so the base URL, credentials, error shape and 401
 * handling stay in one place.
 *
 * Auth is cookie-only (P1): verify-otp sets an HttpOnly session cookie per
 * role (ilp_staff_session, ilp_lawyer_session, ilp_client_session) and every
 * request sends `credentials: "include"`. No session token is ever read from
 * or written to localStorage/sessionStorage; JavaScript cannot see the
 * session. Legacy tokens left in a browser by older builds are removed once
 * on load (`purgeLegacyTokens`).
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  /** Parsed JSON error body, when the server sent one. */
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiRole = "staff" | "lawyer" | "client" | "customer";

interface RoleConfig {
  /** Where a 401 sends the user. */
  loginPath: string;
  /** HttpOnly session cookie set by verify-otp. Read by the server only. */
  cookieName?: string;
  /** Server route that ends this session and clears the cookie. */
  logoutPath?: string;
  /** Server route that ends every session of this email ("sign out everywhere"). */
  logoutAllPath?: string;
}

export const ROLE_CONFIG: Record<ApiRole, RoleConfig> = {
  staff: {
    loginPath: "/dashboard",
    cookieName: "ilp_staff_session",
    logoutPath: "/api/dashboard/auth/logout",
    logoutAllPath: "/api/dashboard/auth/logout-all",
  },
  lawyer: {
    loginPath: "/lawyer",
    cookieName: "ilp_lawyer_session",
    logoutPath: "/api/provider/auth/logout",
    logoutAllPath: "/api/provider/auth/logout-all",
  },
  client: {
    loginPath: "/status",
    cookieName: "ilp_client_session",
    logoutPath: "/api/client-status/auth/logout",
    logoutAllPath: "/api/client-status/auth/logout-all",
  },
  customer: {
    loginPath: "/",
  },
};

/** Keys older builds used for header tokens. Removed on load; never written. */
const LEGACY_TOKEN_KEYS = ["ilp_dashboard_token", "ilp_provider_token", "ilp_client_token", "ilp_token"];

/** Delete session tokens that older builds stored in web storage. Never throws. */
export function purgeLegacyTokens(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_TOKEN_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // storage unavailable
    }
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // storage unavailable
    }
  }
}

purgeLegacyTokens();

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Plain objects are JSON-encoded; strings, FormData and Blobs pass through. */
  body?: unknown;
  /** Query parameters appended to the path. Undefined values are skipped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /**
   * On 401: "redirect" sends the user to the role's login page; "throw" only
   * throws ApiError. Typed helpers default to "redirect", the legacy *Fetch
   * wrappers to "throw".
   */
  on401?: "redirect" | "throw";
}

export interface ApiClient {
  role: ApiRole;
  loginPath: string;
  request<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
  get<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
  post<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  del<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
  /** Absolute URL for a GET the browser opens itself (downloads): the cookie rides along. */
  url(path: string, query?: RequestOptions["query"]): string;
  /** Ends this session (server clears the cookie). Never throws. */
  logout(): Promise<void>;
  /** Ends every session of this email for the role, on every device. Throws ApiError on failure. */
  logoutAll(): Promise<{ ended: number }>;
}

function withQuery(path: string, query?: RequestOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) params.set(k, String(v));
  }
  const qs = params.toString();
  if (!qs) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${qs}`;
}

function encodeBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  ) {
    if (typeof body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return body as BodyInit;
  }
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

/** Auth endpoints never redirect: a wrong code is a form error, not a lost session. */
function isAuthPath(path: string): boolean {
  return /\/auth\//.test(path);
}

function redirectToLogin(loginPath: string) {
  if (typeof window === "undefined") return;
  const here = window.location.pathname;
  if (here === loginPath) return; // already on the login screen
  const next = encodeURIComponent(here + window.location.search);
  window.location.assign(`${loginPath}?next=${next}`);
}

/** One fetch client per role. Cheap to create; module-level instances below. */
export function createApiClient(role: ApiRole): ApiClient {
  const cfg = ROLE_CONFIG[role];

  const client: ApiClient = {
    role,
    loginPath: cfg.loginPath,
    url: (path, query) => `${API_URL}${withQuery(path, query)}`,

    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const { body, query, on401 = "redirect", headers: rawHeaders, ...init } = options;
      const headers = new Headers(rawHeaders);
      const encoded = encodeBody(body, headers);

      const res = await fetch(`${API_URL}${withQuery(path, query)}`, {
        ...init,
        headers,
        body: encoded,
        credentials: "include",
      });

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        let data: unknown;
        try {
          data = await res.json();
          const err = (data as { error?: unknown } | null)?.error;
          if (err) message = String(err);
        } catch {
          // ignore parse failures
        }
        if (res.status === 401 && on401 === "redirect" && !isAuthPath(path)) {
          redirectToLogin(cfg.loginPath);
        }
        throw new ApiError(message, res.status, data);
      }

      if (res.status === 204) return undefined as T;
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    },

    get: (path, options) => client.request(path, { ...options, method: "GET" }),
    post: (path, body, options) => client.request(path, { ...options, method: "POST", body }),
    put: (path, body, options) => client.request(path, { ...options, method: "PUT", body }),
    patch: (path, body, options) => client.request(path, { ...options, method: "PATCH", body }),
    del: (path, options) => client.request(path, { ...options, method: "DELETE" }),

    async logout() {
      try {
        if (cfg.logoutPath) await client.request(cfg.logoutPath, { method: "POST", on401: "throw" });
      } catch {
        // already signed out or offline: nothing else to clear on this side
      }
    },

    async logoutAll() {
      if (!cfg.logoutAllPath) return { ended: 0 };
      const res = await client.request<{ ended?: number }>(cfg.logoutAllPath, { method: "POST", on401: "throw" });
      return { ended: Number(res?.ended ?? 0) };
    },
  };

  return client;
}

export const staffApi = createApiClient("staff");
export const customerApi = createApiClient("customer");

/**
 * Adapter for the legacy `xxxFetch(path, RequestInit)` signature: the body is
 * already a string, and 401s throw so current pages keep their own handling.
 */
export function legacyFetch<T>(client: ApiClient, path: string, options: RequestInit = {}): Promise<T> {
  const { body, ...rest } = options;
  return client.request<T>(path, { ...rest, body: body ?? undefined, on401: "throw" });
}

// ── Legacy exports (kept so current pages compile) ──────────────────────────
// Sessions are HttpOnly cookies now: JavaScript can neither read nor store
// them. These shims stay only so older call sites compile; ask the server
// (e.g. GET /api/dashboard/auth/check) whether a session exists.

/** @deprecated Cookie-only auth: always null. */
export function getToken(): string | null {
  return null;
}

/** @deprecated Cookie-only auth: always null. Use GET /api/dashboard/auth/check. */
export function getDashboardToken(): string | null {
  return null;
}

/** @deprecated Cookie-only auth: the server sets the cookie; this does nothing. */
export function setDashboardToken(_token?: string): void {}

/** @deprecated Cookie-only auth: use `staffApi.logout()`. Removes legacy leftovers only. */
export function clearDashboardToken(): void {
  purgeLegacyTokens();
}

/** Staff dashboard fetch (session cookie). */
export function dashboardFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(staffApi, path, options);
}

/** Public / customer fetch (cookies only; no bearer token is stored in the browser). */
export function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(customerApi, path, options);
}
