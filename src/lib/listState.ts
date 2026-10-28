/**
 * State machine for a streamed, paged list (useStreamedList). Pure, so it is
 * unit tested without React.
 *
 * Every request carries a sequence number. Only events of the newest request
 * change the state, so a slow answer to an old query can never overwrite the
 * results of a newer one. While a new query loads, the previous rows stay on
 * screen (`stale`) until its first batch arrives, then they are replaced.
 */

export type ListStatus = "idle" | "loading" | "streaming" | "done" | "error";

export interface ListState<T> {
  /** Sequence number of the request the state belongs to. */
  seq: number;
  /** "replace": a first page (new query, filter, sort, refresh); "append": load more. */
  mode: "replace" | "append";
  items: T[];
  status: ListStatus;
  /** True while the rows shown belong to an earlier query. */
  stale: boolean;
  /** The next batch replaces the rows (a first page is on its way). */
  pendingReplace: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  total: number | null;
  meta: Record<string, unknown>;
  error: string | null;
}

export type ListAction<T> =
  | { type: "start"; seq: number; mode: "replace" | "append" }
  | { type: "meta"; seq: number; meta: Record<string, unknown> }
  | { type: "items"; seq: number; items: T[] }
  | { type: "end"; seq: number; nextCursor: string | null; hasMore: boolean; total?: number | null }
  | { type: "error"; seq: number; error: string }
  | { type: "restore"; seq: number; snapshot: ListSnapshot<T> }
  | { type: "update"; update: (items: T[]) => T[] };

/** A finished first page, kept for instant back-navigation. */
export interface ListSnapshot<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number | null;
  meta: Record<string, unknown>;
}

export function initialListState<T>(): ListState<T> {
  return { seq: 0, mode: "replace", items: [], status: "idle", stale: false, pendingReplace: false, hasMore: false, nextCursor: null, total: null, meta: {}, error: null };
}

function appendUnique<T>(base: T[], add: T[], keyOf?: (item: T) => string): T[] {
  if (!keyOf) return base.concat(add);
  const seen = new Set(base.map(keyOf));
  const out = base.slice();
  for (const item of add) {
    const k = keyOf(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

export function listReducer<T>(state: ListState<T>, action: ListAction<T>, keyOf?: (item: T) => string): ListState<T> {
  if (action.type === "update") return { ...state, items: action.update(state.items) };
  if (action.type === "start") {
    if (action.seq <= state.seq) return state;
    return {
      ...state,
      seq: action.seq,
      mode: action.mode,
      status: "loading",
      error: null,
      // A new first page keeps the old rows visible (marked stale) until its first batch lands.
      stale: action.mode === "replace" && state.items.length > 0,
      pendingReplace: action.mode === "replace",
    };
  }
  if (action.seq !== state.seq) return state; // an answer to an older request
  switch (action.type) {
    case "restore":
      // Cached first page: shown at once, still replaced by the fresh answer when it streams in.
      return { ...state, ...action.snapshot, stale: false, error: null };
    case "meta":
      return { ...state, meta: { ...(state.pendingReplace ? {} : state.meta), ...action.meta } };
    case "items":
      return {
        ...state,
        items: state.pendingReplace ? appendUnique([], action.items, keyOf) : appendUnique(state.items, action.items, keyOf),
        stale: false,
        pendingReplace: false,
        status: "streaming",
      };
    case "end":
      return {
        ...state,
        items: state.pendingReplace ? [] : state.items,
        stale: false,
        pendingReplace: false,
        status: "done",
        hasMore: action.hasMore,
        nextCursor: action.hasMore ? action.nextCursor : null,
        total: action.total ?? (state.mode === "append" ? state.total : null),
      };
    case "error":
      return { ...state, status: "error", error: action.error, stale: false, pendingReplace: false };
  }
  return state;
}

/** "Showing 40 of 312", "40 shown, more available", "312 results". Plain copy for the toolbar count. */
export function countLabel(shown: number, total: number | null, hasMore: boolean, noun = "results"): string {
  if (total !== null && total !== undefined) {
    if (shown >= total) return `${total} ${total === 1 ? singular(noun) : noun}`;
    return `Showing ${shown} of ${total}`;
  }
  if (hasMore) return `${shown} shown, more available`;
  return `${shown} ${shown === 1 ? singular(noun) : noun}`;
}

function singular(noun: string): string {
  if (noun.endsWith("ies")) return `${noun.slice(0, -3)}y`;
  if (noun.endsWith("ses")) return noun.slice(0, -2);
  return noun.endsWith("s") ? noun.slice(0, -1) : noun;
}
