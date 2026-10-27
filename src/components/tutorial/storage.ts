/**
 * Seen / dismissed state per tutorial id and version. Lives in localStorage
 * (every access wrapped in try/catch: private windows and blocked storage
 * just mean tutorials can show again). A TutorialSync can mirror the state
 * to the server later; the default does nothing.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export type RecordState = "done" | "dismissed" | "skipped";

export interface TutorialRecord {
  /** Tutorial version the state applies to. */
  v: number;
  state: RecordState;
  /** Times it was closed early, without "Don't show again". */
  skips: number;
  at: string;
}

export interface TutorialState {
  records: Record<string, TutorialRecord>;
  /** Viewer preference: show tutorials automatically on first visits. */
  autoStart: boolean;
}

/** Server mirror, for later. pull() on mount, push() after every change. */
export interface TutorialSync {
  pull(): Promise<TutorialState | null>;
  push(state: TutorialState): Promise<void>;
}

export const noopTutorialSync: TutorialSync = {
  pull: async () => null,
  push: async () => undefined,
};

export const STORAGE_KEY = "ilp_tutorials";
/** An early close shows the tutorial again on a later visit, at most this many times. */
export const MAX_SKIPS = 2;

const EMPTY: TutorialState = { records: {}, autoStart: true };

function parse(raw: string | null): TutorialState {
  if (!raw) return { ...EMPTY, records: {} };
  try {
    const v = JSON.parse(raw) as Partial<TutorialState>;
    const records: Record<string, TutorialRecord> = {};
    for (const [id, r] of Object.entries(v.records ?? {})) {
      if (r && typeof r.v === "number" && (r.state === "done" || r.state === "dismissed" || r.state === "skipped")) {
        records[id] = { v: r.v, state: r.state, skips: typeof r.skips === "number" ? r.skips : 0, at: String(r.at ?? "") };
      }
    }
    return { records, autoStart: v.autoStart !== false };
  } catch {
    return { ...EMPTY, records: {} };
  }
}

export interface TutorialStore {
  read(): TutorialState;
  get(id: string): TutorialRecord | undefined;
  /** Finished or dismissed at this version or later. */
  isSeen(id: string, version: number): boolean;
  /** opts.skippedThisSession: closed early in this browser session already. */
  shouldAutoStart(id: string, version: number, opts?: { skippedThisSession?: boolean }): boolean;
  markDone(id: string, version: number): void;
  markDismissed(id: string, version: number): void;
  markSkipped(id: string, version: number): void;
  /** Forget one tutorial, or all of them when id is omitted. */
  reset(id?: string): void;
  setAutoStart(on: boolean): void;
  replace(state: TutorialState): void;
}

export function createTutorialStore(
  storage: StorageLike | null,
  opts: { key?: string; now?: () => Date; onChange?: (s: TutorialState) => void } = {},
): TutorialStore {
  const key = opts.key ?? STORAGE_KEY;
  const now = opts.now ?? (() => new Date());
  // In-memory copy so a blocked storage still behaves for this page.
  let memory: TutorialState | null = null;

  function read(): TutorialState {
    if (memory) return memory;
    let raw: string | null = null;
    try {
      raw = storage ? storage.getItem(key) : null;
    } catch {
      raw = null;
    }
    memory = parse(raw);
    return memory;
  }

  function write(next: TutorialState) {
    memory = next;
    try {
      storage?.setItem(key, JSON.stringify(next));
    } catch {
      // storage full or blocked: keep the in-memory copy
    }
    opts.onChange?.(next);
  }

  function put(id: string, version: number, state: RecordState) {
    const cur = read();
    const prev = cur.records[id];
    const skips = state === "skipped" ? (prev && prev.v === version ? prev.skips : 0) + 1 : prev?.skips ?? 0;
    write({ ...cur, records: { ...cur.records, [id]: { v: version, state, skips, at: now().toISOString() } } });
  }

  return {
    read,
    get: (id) => read().records[id],
    isSeen(id, version) {
      const r = read().records[id];
      return !!r && r.v >= version && (r.state === "done" || r.state === "dismissed");
    },
    shouldAutoStart(id, version, o = {}) {
      const st = read();
      if (!st.autoStart) return false;
      const r = st.records[id];
      if (!r || r.v < version) return true;
      if (r.state === "skipped") return r.skips < MAX_SKIPS && !o.skippedThisSession;
      return false;
    },
    markDone: (id, v) => put(id, v, "done"),
    markDismissed: (id, v) => put(id, v, "dismissed"),
    markSkipped(id, v) {
      // Never downgrade a finished or dismissed tutorial to "skipped".
      const r = read().records[id];
      if (r && r.v >= v && r.state !== "skipped") return;
      put(id, v, "skipped");
    },
    reset(id) {
      const cur = read();
      if (!id) {
        write({ ...cur, records: {} });
        return;
      }
      const { [id]: _gone, ...rest } = cur.records;
      write({ ...cur, records: rest });
    },
    setAutoStart(on) {
      write({ ...read(), autoStart: on });
    },
    replace(state) {
      write({ records: { ...state.records }, autoStart: state.autoStart !== false });
    },
  };
}
