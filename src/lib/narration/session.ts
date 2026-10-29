/**
 * The narrator overlay is offered once per browser session per landing.
 * sessionStorage can be missing or throw (private windows, blocked site
 * data), so every access is wrapped and a module-level set remembers the
 * choice for the rest of the page's life.
 */
import type { NarrationPage } from "./scripts";

type Store = Pick<Storage, "getItem" | "setItem">;

const memory = new Set<string>();

export const offerKey = (page: NarrationPage) => `ilp_narration_offer_${page}`;

function sessionStore(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** True when the overlay was already answered in this session. */
export function offerSeen(page: NarrationPage, store: Store | null = sessionStore()): boolean {
  const key = offerKey(page);
  if (memory.has(key)) return true;
  try {
    return store?.getItem(key) === "1";
  } catch {
    return false;
  }
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
