/**
 * Centralized API client. All frontend->backend calls route through
 * `createApiClient(role)` so the base URL, auth header, error shape and 401
 * handling stay in one place.
 *
 * Auth (AUTH, 2026-10): the site and the API are on different sites
 * (Netlify / Render), so browsers drop the API's session cookie. Each portal
 * keeps its own session token instead:
 *   - verify-otp (and the join portal-session route) return `{ token, expiresAt }`;
 *   - the token is kept in localStorage under the role's key (ilp_staff_token,
 *     ilp_lawyer_token, ilp_client_token), or in memory when storage is
 *     unavailable;
 *   - every request sends `Authorization: Bearer <token>` with
 *     `credentials: "omit"`;
 *   - a 401 clears that role's token (and, by default, sends the user to the
 *     role's login page); logout clears it and ends the server session.
 * Files the API streams (documents, data export, contract PDFs) are fetched as
 * blobs with the same header: see `downloadFile`.
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

export type ApiRole = "staff" | "lawyer" | "client" | "customer" | "csm";

interface RoleConfig {
  /** Where a 401 sends the user. */
  loginPath: string;
  /** localStorage key holding this role's session token. */
  tokenKey?: string;
  /** Server route that ends this session. */
  logoutPath?: string;
  /** Server route that ends every session of this email ("sign out everywhere"). */
  logoutAllPath?: string;
}

export const ROLE_CONFIG: Record<ApiRole, RoleConfig> = {
  staff: {
    loginPath: "/dashboard",
    tokenKey: "ilp_staff_token",
    logoutPath: "/api/dashboard/auth/logout",
    logoutAllPath: "/api/dashboard/auth/logout-all",
  },
  lawyer: {
    loginPath: "/lawyer",
    tokenKey: "ilp_lawyer_token",
    logoutPath: "/api/provider/auth/logout",
    logoutAllPath: "/api/provider/auth/logout-all",
  },
  client: {
    loginPath: "/status",
    tokenKey: "ilp_client_token",
    logoutPath: "/api/client-status/auth/logout",
    logoutAllPath: "/api/client-status/auth/logout-all",
  },
  customer: {
    loginPath: "/",
  },
  // COMMS-P3: the CSM portal signs in with the staff email code (same server
  // session kind, role from CSM_EMAILS) but keeps its own token and login page.
  csm: {
    loginPath: "/csm",
    tokenKey: "ilp_csm_token",
    logoutPath: "/api/dashboard/auth/logout",
    logoutAllPath: "/api/dashboard/auth/logout-all",
  },
};

/** True on a /csm page (the CSM portal). */
export function onCsmPortal(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname;
  return p === "/csm" || p.startsWith("/csm/");
}

/**
 * COMMS-P3: on the CSM portal the staff client (staffApi, used by the member
 * page and task drawer the portal reuses) sends the CSM session, and a 401
 * there leads back to /csm. Everywhere else a role is itself.
 */
export function resolveRole(role: ApiRole): ApiRole {
  return role === "staff" && onCsmPortal() ? "csm" : role;
}

// ── Session tokens (one per role) ───────────────────────────────────────────

/** Fallback when localStorage throws (private mode, blocked storage). */
const memoryTokens: Partial<Record<ApiRole, string>> = {};

/** The stored session token for a role, or null. Never throws. */
export function getRoleToken(asked: ApiRole): string | null {
  const role = resolveRole(asked);
  const key = ROLE_CONFIG[role].tokenKey;
  if (!key) return null;
  if (typeof window !== "undefined") {
    try {
      const v = window.localStorage.getItem(key);
      if (v) return v;
    } catch {
      // storage unavailable: use the in-memory copy
    }
  }
  return memoryTokens[role] ?? null;
}

/** Store the token returned by verify-otp / portal-session for a role. Never throws. */
export function setRoleToken(role: ApiRole, token: string): void {
  const key = ROLE_CONFIG[role].tokenKey;
  if (!key || !token) return;
  memoryTokens[role] = token;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, token);
  } catch {
    // storage unavailable: the in-memory copy lasts until the tab closes
  }
}

/** Forget a role's token (logout, 401). Never throws. */
export function clearRoleToken(asked: ApiRole): void {
  const role = resolveRole(asked);
  const key = ROLE_CONFIG[role].tokenKey;
  delete memoryTokens[role];
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // storage unavailable
  }
}

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
  /** Absolute URL for a path. Carries no credentials: use `blob` / `downloadFile` for files. */
  url(path: string, query?: RequestOptions["query"]): string;
  /**
   * The raw Response (status already checked, 401 handled) for callers that
   * read the body themselves, such as streamed NDJSON lists (lib/listSource.ts).
   */
  open(path: string, options?: RequestOptions): Promise<Response>;
  /** GET a file with the Bearer header; resolves to the bytes and the server's file name. */
  blob(path: string, options?: RequestOptions): Promise<{ blob: Blob; fileName: string | null }>;
  /** Ends this session on the server and forgets the token. Never throws. */
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

/** OTP endpoints never redirect or clear the token: a wrong code is a form error, not a lost session. */
function isAuthPath(path: string): boolean {
  return /\/auth\/(request-otp|verify-otp)(\?|$)/.test(path);
}

/** File name from a Content-Disposition header (filename* first). */
function dispositionName(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      // fall back to the plain filename
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
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

  /** fetch with the role's Bearer token; throws ApiError (after 401 handling) on a non-2xx. */
  async function send(path: string, options: RequestOptions = {}): Promise<Response> {
    const { body, query, on401 = "redirect", headers: rawHeaders, ...init } = options;
    const headers = new Headers(rawHeaders);
    const encoded = encodeBody(body, headers);
    const token = getRoleToken(role);
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_URL}${withQuery(path, query)}`, {
      ...init,
      headers,
      body: encoded,
      credentials: "omit",
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
      if (res.status === 401 && !isAuthPath(path)) {
        // The token is missing, expired or ended elsewhere: forget it.
        if (token && getRoleToken(role) === token) clearRoleToken(role);
        if (on401 === "redirect") redirectToLogin(ROLE_CONFIG[resolveRole(role)].loginPath);
      }
      throw new ApiError(message, res.status, data);
    }
    return res;
  }

  const client: ApiClient = {
    role,
    loginPath: cfg.loginPath,
    url: (path, query) => `${API_URL}${withQuery(path, query)}`,

    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const res = await send(path, options);
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    },

    open: (path, options = {}) => send(path, options),

    async blob(path, options = {}) {
      const res = await send(path, { ...options, method: "GET" });
      return { blob: await res.blob(), fileName: dispositionName(res.headers.get("Content-Disposition")) };
    },

    get: (path, options) => client.request(path, { ...options, method: "GET" }),
    post: (path, body, options) => client.request(path, { ...options, method: "POST", body }),
    put: (path, body, options) => client.request(path, { ...options, method: "PUT", body }),
    patch: (path, body, options) => client.request(path, { ...options, method: "PATCH", body }),
    del: (path, options) => client.request(path, { ...options, method: "DELETE" }),

    async logout() {
      try {
        const logoutPath = ROLE_CONFIG[resolveRole(role)].logoutPath;
        if (logoutPath && getRoleToken(role)) {
          await client.request(logoutPath, { method: "POST", on401: "throw" });
        }
      } catch {
        // already signed out or offline
      } finally {
        clearRoleToken(role);
      }
    },

    async logoutAll() {
      const logoutAllPath = ROLE_CONFIG[resolveRole(role)].logoutAllPath;
      if (!logoutAllPath) return { ended: 0 };
      const res = await client.request<{ ended?: number }>(logoutAllPath, { method: "POST", on401: "throw" });
      clearRoleToken(role);
      return { ended: Number(res?.ended ?? 0) };
    },
  };

  return client;
}

/**
 * Download a file the API streams (member documents, data export, contract
 * PDFs): fetch it with the role's Bearer header, then save it through a
 * temporary object URL. Throws ApiError on failure (401 also clears the token
 * and sends the user to the role's login).
 */
export async function downloadFile(
  role: ApiRole,
  path: string,
  filename?: string,
  query?: RequestOptions["query"],
): Promise<void> {
  const { blob, fileName } = await createApiClient(role).blob(path, { query });
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || filename || "download";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Alternative to `downloadFile` for when the browser itself must open the URL
 * (e.g. a new tab): asks the API for a single-use ticket (60 s, bound to this
 * session and path) and returns the absolute URL with `?ticket=`.
 */
export async function ticketUrl(role: ApiRole, path: string): Promise<string> {
  const res = await createApiClient(role).post<{ url: string }>("/api/download-ticket", { path });
  return `${API_URL}${res.url}`;
}

export const staffApi = createApiClient("staff");
/** COMMS-P3: the CSM portal's own client (the CSM token on every page). */
export const csmApi = createApiClient("csm");
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

/** @deprecated Customer JWTs are not stored in the browser: always null. */
export function getToken(): string | null {
  return null;
}

/** The staff session token, or null. */
export function getDashboardToken(): string | null {
  return getRoleToken("staff");
}

/** Store the staff session token returned by verify-otp. */
export function setDashboardToken(token?: string): void {
  if (token) setRoleToken("staff", token);
}

/** Forget the staff session token (prefer `staffApi.logout()`, which also ends the server session). */
export function clearDashboardToken(): void {
  clearRoleToken("staff");
}

/** Staff dashboard fetch (Bearer staff token). */
export function dashboardFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(staffApi, path, options);
}

/** Public / customer fetch (no session token). */
export function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(customerApi, path, options);
}
