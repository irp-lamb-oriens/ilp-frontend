/**
 * The local copy (SYNC): what each signed-in screen last received from the
 * server, kept in the browser so the same question is not asked twice in a
 * row, a second tab reuses what the first one fetched, and a screen still
 * shows its last known content when the server cannot be reached.
 *
 * Pure: storage and the clock are passed in, so tests drive it.
 *
 * Safety rules, all enforced here:
 *   - one compartment per sign-in. The compartment name comes from the role
 *     and a hash of the session token, so a copy saved under one session is
 *     never readable from another, and the token itself is never written;
 *   - signing out, a 401 or an expired session empties the compartment;
 *     `sweep` removes compartments whose session no longer exists;
 *   - limits: one answer up to 256 KB, 150 answers and 2 MB in all, nothing
 *     older than 7 days. The least recently saved answers go first;
 *   - storage that is missing, full or blocked never breaks a request: every
 *     call falls back to "no local copy".
 */

export interface KV {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Saved {
  path: string;
  /** When this answer was last confirmed by the server (ms). */
  at: number;
  body: string;
  /** True when the server must be asked before this answer is trusted again (it still covers an unreachable server). */
  expired?: boolean;
}

export interface StoreLimits {
  maxEntryChars: number;
  maxEntries: number;
  maxChars: number;
  maxAgeMs: number;
}

export const PREFIX = "ilp_sync:";
const CACHE = `${PREFIX}c:`;
const OUTBOX = `${PREFIX}o:`;

export const DEFAULT_LIMITS: StoreLimits = {
  maxEntryChars: 256 * 1024,
  maxEntries: 150,
  maxChars: 2 * 1024 * 1024,
  maxAgeMs: 7 * 24 * 60 * 60 * 1000,
};

/** FNV-1a, two seeds: a short name for a compartment or a path. Not a secret, never reversible to the token. */
export function shortHash(text: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x85ebca6b) ^ (b >>> 13);
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
}

/** The compartment for one sign-in. */
export function sessionSpace(role: string, token: string): string {
  return `${role}.${shortHash(token)}`;
}

export type WriteResult = "stored" | "same" | "skipped";

export interface LocalStore {
  read(space: string, path: string, now?: number): Saved | null;
  /** Save an answer. "same" = identical to the copy we had (only its time moves). */
  write(space: string, path: string, body: string, now?: number): WriteResult;
  remove(space: string, path: string): void;
  /** Forget every saved answer of a sign-in (after any change it sends). Unsent changes stay. */
  invalidate(space: string): void;
  /** Keep the answers of a sign-in only as cover for an unreachable server (after a change that may or may not have arrived). */
  expire(space: string): void;
  /** Forget everything of a sign-in, unsent changes included. Returns how many unsent changes were lost. */
  dropSession(space: string): number;
  /** Remove compartments that belong to no current sign-in, and anything too old. */
  sweep(liveSpaces: string[], now?: number): void;
  readOutbox<T>(space: string): T[];
  writeOutbox<T>(space: string, items: T[]): boolean;
  stats(): { entries: number; chars: number };
}

export function createLocalStore(kv: KV | null, limits: Partial<StoreLimits> = {}): LocalStore {
  const lim = { ...DEFAULT_LIMITS, ...limits };
  const cacheKey = (space: string, path: string) => `${CACHE}${space}:${shortHash(path)}`;

  function keys(prefix: string): string[] {
    const out: string[] = [];
    if (!kv) return out;
    try {
      for (let i = 0; i < kv.length; i++) {
        const k = kv.key(i);
        if (k && k.startsWith(prefix)) out.push(k);
      }
    } catch {
      // storage unavailable
    }
    return out;
  }

  function del(key: string): void {
    try {
      kv?.removeItem(key);
    } catch {
      // storage unavailable
    }
  }

  function parse(raw: string | null): { p: string; t: number; b: string; x?: 1 } | null {
    if (!raw) return null;
    try {
      const v = JSON.parse(raw) as { p?: unknown; t?: unknown; b?: unknown; x?: unknown };
      return typeof v.p === "string" && typeof v.t === "number" && typeof v.b === "string"
        ? { p: v.p, t: v.t, b: v.b, ...(v.x ? { x: 1 as const } : {}) }
        : null;
    } catch {
      return null;
    }
  }

  /** Oldest first: drop answers until the counts fit, leaving room for `incoming` characters. */
  function makeRoom(incoming: number, forceShare = 0): void {
    if (!kv) return;
    const all: Array<{ k: string; t: number; n: number }> = [];
    let chars = 0;
    for (const k of keys(CACHE)) {
      let raw: string | null = null;
      try {
        raw = kv.getItem(k);
      } catch {
        // skip
      }
      const v = parse(raw);
      if (!v) {
        del(k);
        continue;
      }
      all.push({ k, t: v.t, n: raw!.length });
      chars += raw!.length;
    }
    all.sort((x, y) => x.t - y.t);
    // The browser's own quota was hit: give back a share of ours, whatever our counts say.
    let forced = Math.ceil(all.length * forceShare);
    while (all.length && (forced > 0 || chars + incoming > lim.maxChars || all.length + 1 > lim.maxEntries)) {
      const old = all.shift()!;
      del(old.k);
      chars -= old.n;
      forced--;
    }
  }

  const store: LocalStore = {
    read(space, path, now = Date.now()) {
      if (!kv) return null;
      const k = cacheKey(space, path);
      let v: ReturnType<typeof parse> = null;
      try {
        v = parse(kv.getItem(k));
      } catch {
        return null;
      }
      if (!v || v.p !== path) return null;
      if (now - v.t > lim.maxAgeMs) {
        del(k);
        return null;
      }
      return v.x ? { path: v.p, at: v.t, body: v.b, expired: true } : { path: v.p, at: v.t, body: v.b };
    },

    write(space, path, body, now = Date.now()) {
      if (!kv) return "skipped";
      const k = cacheKey(space, path);
      if (body.length > lim.maxEntryChars) {
        del(k);
        return "skipped";
      }
      const before = store.read(space, path, now);
      const same = !!before && before.body === body;
      const raw = JSON.stringify({ p: path, t: now, b: body });
      try {
        if (!before) makeRoom(raw.length);
        kv.setItem(k, raw);
      } catch {
        // Storage is full (other keys count too): give back the older half of ours, try once more.
        try {
          makeRoom(raw.length, 0.5);
          kv.setItem(k, raw);
        } catch {
          del(k);
          return "skipped";
        }
      }
      return same ? "same" : "stored";
    },

    remove(space, path) {
      del(cacheKey(space, path));
    },

    invalidate(space) {
      for (const k of keys(`${CACHE}${space}:`)) del(k);
    },

    expire(space) {
      if (!kv) return;
      for (const k of keys(`${CACHE}${space}:`)) {
        try {
          const v = parse(kv.getItem(k));
          if (!v) del(k);
          else if (!v.x) kv.setItem(k, JSON.stringify({ ...v, x: 1 }));
        } catch {
          del(k);
        }
      }
    },

    dropSession(space) {
      store.invalidate(space);
      const lost = store.readOutbox(space).length;
      del(`${OUTBOX}${space}`);
      return lost;
    },

    sweep(liveSpaces, now = Date.now()) {
      if (!kv) return;
      const live = new Set(liveSpaces);
      for (const k of keys(CACHE)) {
        const space = k.slice(CACHE.length, k.lastIndexOf(":"));
        if (!live.has(space)) {
          del(k);
          continue;
        }
        let v: ReturnType<typeof parse> = null;
        try {
          v = parse(kv.getItem(k));
        } catch {
          // skip
        }
        if (!v || now - v.t > lim.maxAgeMs) del(k);
      }
      for (const k of keys(OUTBOX)) {
        if (!live.has(k.slice(OUTBOX.length))) del(k);
      }
    },

    readOutbox<T>(space: string): T[] {
      if (!kv) return [];
      try {
        const v = JSON.parse(kv.getItem(`${OUTBOX}${space}`) ?? "[]") as unknown;
        return Array.isArray(v) ? (v as T[]) : [];
      } catch {
        return [];
      }
    },

    writeOutbox<T>(space: string, items: T[]): boolean {
      if (!kv) return false;
      const k = `${OUTBOX}${space}`;
      try {
        if (!items.length) kv.removeItem(k);
        else kv.setItem(k, JSON.stringify(items));
        return true;
      } catch {
        try {
          makeRoom(0, 0.5); // unsent changes matter more than saved answers
          kv.setItem(k, JSON.stringify(items));
          return true;
        } catch {
          return false;
        }
      }
    },

    stats() {
      let chars = 0;
      const ks = keys(CACHE);
      for (const k of ks) {
        try {
          chars += kv?.getItem(k)?.length ?? 0;
        } catch {
          // skip
        }
      }
      return { entries: ks.length, chars };
    },
  };
  return store;
}
