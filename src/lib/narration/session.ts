/**
 * The narrator overlay is offered at most once per landing, and only on
 * wide screens (QA round 1, 2026-11-02: on phones a full-screen gate before
 * any content hurt the free check and hid the page from Lighthouse and
 * Googlebot's mobile render). On phones and for automated browsers the
 * visitor gets the small "Play narration" launcher instead.
 *
 * The answer is kept in localStorage, so a returning visitor is not asked
 * again; sessionStorage is read too for answers given before this change.
 * Storage can be missing or throw (private windows, blocked site data), so
 * every access is wrapped and a module-level set remembers the choice for
 * the rest of the page's life.
 */
import type { NarrationPage } from "./scripts";

type Store = Pick<Storage, "getItem" | "setItem">;

const memory = new Set<string>();

export const offerKey = (page: NarrationPage) => `ilp_narration_offer_${page}`;

function sessionStore(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function legacySessionStore(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Widest viewport treated as a phone: no overlay, launcher only. */
export const OVERLAY_MIN_WIDTH = 769;

export interface OfferEnv {
  width: number;
  /** navigator.webdriver: Lighthouse, Playwright and other automation. */
  automated: boolean;
  /** Data Saver / Save-Data on. */
  saveData: boolean;
}

/** True when the first-visit overlay may open by itself (wide screen, a person, no Data Saver). */
export function overlayAllowed(env: OfferEnv): boolean {
  return env.width >= OVERLAY_MIN_WIDTH && !env.automated && !env.saveData;
}

/** The current browser's OfferEnv. */
export function currentOfferEnv(): OfferEnv {
  if (typeof window === "undefined") return { width: 0, automated: true, saveData: false };
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return { width: window.innerWidth, automated: !!nav.webdriver, saveData: !!nav.connection?.saveData };
}

/** True when the overlay was already answered in this browser. */
export function offerSeen(page: NarrationPage, store: Store | null = sessionStore(), legacy: Store | null = legacySessionStore()): boolean {
  const key = offerKey(page);
  if (memory.has(key)) return true;
  for (const st of [store, legacy]) {
    try {
      if (st?.getItem(key) === "1") return true;
    } catch {
      // storage blocked: try the next one
    }
  }
  return false;
}

/** Remember that the overlay was answered (either choice). */
export function markOfferSeen(page: NarrationPage, store: Store | null = sessionStore()): void {
  const key = offerKey(page);
  memory.add(key);
  try {
    store?.setItem(key, "1");
  } catch {
    // storage blocked: the in-memory set still covers this page view
  }
}

/** Test helper: forget the in-memory choices. */
export function resetOfferMemory(): void {
  memory.clear();
}
