/** One browser event for everything the sync engine wants a person to know (SYNC). */

export type SyncEvent =
  /** A screen is showing an answer saved earlier because the server could not be reached. */
  | { type: "stale"; path: string; at: number }
  /** The server answered again after a stale answer was shown. */
  | { type: "live" }
  /** A change is waiting on this device. */
  | { type: "queued"; waiting: number; label: string }
  /** A waiting change reached the server (receipt in hand). */
  | { type: "sent"; waiting: number; label: string }
  /** The server refused a waiting change for good. */
  | { type: "rejected"; waiting: number; label: string; reason: string }
  /** Waiting changes were dropped because the sign-in ended or they were too old. */
  | { type: "lost"; count: number };

export const SYNC_EVENT = "ilp:sync";

export function emitSync(event: SyncEvent): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent<SyncEvent>(SYNC_EVENT, { detail: event }));
  } catch {
    // no CustomEvent: nothing to tell
  }
}

export function onSync(fn: (e: SyncEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => fn((e as CustomEvent<SyncEvent>).detail);
  window.addEventListener(SYNC_EVENT, h);
  return () => window.removeEventListener(SYNC_EVENT, h);
}
