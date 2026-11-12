/**
 * "Exclude placeholder data": one choice for every staff and CSM screen.
 *
 * Placeholder (seed) members sit next to real ones until an admin removes
 * them. When this choice is on, every read the staff and CSM clients make
 * carries `?excludePlaceholder=1` (lib/api.ts) and the server answers from
 * real records only: lists, boards, figures and charts (server:
 * helper/placeholderScope.ts). Changes are never filtered.
 *
 * The choice is a per-viewer convenience kept in this browser (and shared
 * between its tabs); with storage blocked it lasts for the page.
 */

export const EXCLUDE_PLACEHOLDER_KEY = "ilp_staff_exclude_placeholder";
export const EXCLUDE_PLACEHOLDER_PARAM = "excludePlaceholder";

let value: boolean | null = null;
const listeners = new Set<() => void>();
let wired = false;

function read(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EXCLUDE_PLACEHOLDER_KEY) === "1";
  } catch {
    return false;
  }
}

function wire(): void {
  if (wired || typeof window === "undefined") return;
  wired = true;
  // Another tab changed the choice: follow it.
  window.addEventListener("storage", (e) => {
    if (e.key !== null && e.key !== EXCLUDE_PLACEHOLDER_KEY) return;
    const next = read();
    if (next === value) return;
    value = next;
    for (const fn of listeners) fn();
  });
}

/** True when placeholder data is left out. False on the server and before storage can be read. */
export function getExcludePlaceholder(): boolean {
  if (typeof window === "undefined") return false;
  if (value === null) value = read();
  return value;
}

export function setExcludePlaceholder(next: boolean): void {
  if (getExcludePlaceholder() === next) return;
  value = next;
  try {
    window.localStorage.setItem(EXCLUDE_PLACEHOLDER_KEY, next ? "1" : "0");
  } catch {
    // storage blocked: the choice lasts for this page
  }
  for (const fn of listeners) fn();
}

export function subscribeExcludePlaceholder(fn: () => void): () => void {
  wire();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** The server render and the first client render agree: nothing is excluded until the page is live. */
export function serverExcludePlaceholder(): boolean {
  return false;
}

/**
 * The path with the parameter added when the choice is on. Only GETs of the
 * API are passed here; a path that already says either way is left alone.
 */
export function withPlaceholderScope(path: string): string {
  if (!getExcludePlaceholder()) return path;
  if (!path.startsWith("/api/") || /[?&]excludePlaceholder=/.test(path)) return path;
  // Sign-in, sign-out and session checks are about the person, not the data.
  if (/^\/api\/[a-z-]+\/auth\//.test(path)) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${EXCLUDE_PLACEHOLDER_PARAM}=1`;
}

/** Tests only. */
export function resetPlaceholderPref(): void {
  value = null;
}
