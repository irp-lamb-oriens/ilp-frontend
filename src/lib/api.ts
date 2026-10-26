/**
 * Centralized API client. All frontend->backend calls route through
 * `createApiClient(role)` so the base URL, credentials, auth header, error
 * shape and 401 handling stay in one place.
 *
 * Transition (plan overhaul 2): requests send `credentials: "include"` so the
 * server's HttpOnly session cookies (W1) ride along, and still send the legacy
 * header token from localStorage until every route reads cookies. Each role
 * sends only its own token: no staff-token fallback on lawyer or client calls.
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
  /** localStorage key of the legacy header token. */
  tokenKey: string;
  /** Header that carries the legacy token. */
  header: string;
  /** Turns the token into the header value. */
  format: (token: string) => string;
  /** Where a 401 sends the user. */
  loginPath: string;
}

export const ROLE_CONFIG: Record<ApiRole, RoleConfig> = {
  staff: {
    tokenKey: "ilp_dashboard_token",
    header: "x-dashboard-token",
    format: (t) => t,
    loginPath: "/dashboard",
  },
  lawyer: {
    tokenKey: "ilp_provider_token",
    header: "x-provider-token",
    format: (t) => t,
    loginPath: "/lawyer",
  },
  client: {
    tokenKey: "ilp_client_token",
    header: "x-client-token",
    format: (t) => t,
    loginPath: "/status",
  },
  customer: {
    tokenKey: "ilp_token",
    header: "Authorization",
    format: (t) => `Bearer ${t}`,
    loginPath: "/",
  },
};

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Plain objects are JSON-encoded; strings, FormData and Blobs pass through. */
  body?: unknown;
  /** Query parameters appended to the path. Undefined values are skipped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /**
   * On 401: "redirect" clears this role's token and sends the user to the
   * role's login page; "throw" only throws ApiError. Typed helpers default to
   * "redirect", the legacy *Fetch wrappers to "throw".
   */
  on401?: "redirect" | "throw";
}

export interface ApiClient {
  role: ApiRole;
  loginPath: string;
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  request<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
  get<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
  post<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  del<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
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
    getToken: () => storage()?.getItem(cfg.tokenKey) ?? null,
    setToken: (token) => storage()?.setItem(cfg.tokenKey, token),
    clearToken: () => storage()?.removeItem(cfg.tokenKey),

    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const { body, query, on401 = "redirect", headers: rawHeaders, ...init } = options;
      const headers = new Headers(rawHeaders);
      const token = client.getToken();
      if (token && !headers.has(cfg.header)) headers.set(cfg.header, cfg.format(token));
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
          client.clearToken();
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

export function getToken(): string | null {
  return customerApi.getToken();
}

export function getDashboardToken(): string | null {
  return staffApi.getToken();
}

export function setDashboardToken(token: string): void {
  staffApi.setToken(token);
}

export function clearDashboardToken(): void {
  staffApi.clearToken();
}

/** Staff dashboard fetch (x-dashboard-token + session cookie). */
export function dashboardFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(staffApi, path, options);
}

/** Customer JWT fetch (Authorization: Bearer). */
export function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return legacyFetch<T>(customerApi, path, options);
}
