/**
 * Browser singletons for the sync engine (SYNC). No imports from lib/api, so
 * lib/api can use these without a cycle.
 */

import { createLocalStore, PREFIX, type KV } from "./localStore";

function browserStorage(): KV | null {
  if (typeof window === "undefined") return null;
  try {
    const kv = window.localStorage;
    const probe = `${PREFIX}probe`;
    kv.setItem(probe, "1");
    kv.removeItem(probe);
    return kv;
  } catch {
    return null; // private mode or blocked storage: the site works without a local copy
  }
}

let kvCache: KV | null | undefined;
function kv(): KV | null {
  if (kvCache === undefined) kvCache = browserStorage();
  return kvCache;
}

/** Lazy so nothing touches storage while the server renders. */
export const localStore = createLocalStore(
  typeof window === "undefined" ? null : {
    get length() {
      return kv()?.length ?? 0;
    },
    key: (i) => kv()?.key(i) ?? null,
    getItem: (k) => kv()?.getItem(k) ?? null,
    setItem: (k, v) => {
      const s = kv();
      if (!s) throw new Error("no storage");
      s.setItem(k, v);
    },
    removeItem: (k) => kv()?.removeItem(k),
  },
);

const RECEIPTS_KEY = `${PREFIX}receipts`;
let receipts: boolean | null = null;

/**
 * True once this browser has seen the server announce write receipts
 * (`X-ILP-Sync: 1`). Until then no change carries an Idempotency-Key, so a
 * server that does not know the header never receives it.
 */
export function serverHasReceipts(): boolean {
  if (receipts === null) {
    try {
      receipts = kv()?.getItem(RECEIPTS_KEY) === "1";
    } catch {
      receipts = false;
    }
  }
  return receipts;
}

export function noteServerHeaders(headers: Headers): void {
  if (receipts || headers.get("X-ILP-Sync") !== "1") return;
  receipts = true;
  try {
    kv()?.setItem(RECEIPTS_KEY, "1");
  } catch {
    // remembered for this tab only
  }
}

/** Tests only. */
export function setServerReceipts(v: boolean): void {
  receipts = v;
}
