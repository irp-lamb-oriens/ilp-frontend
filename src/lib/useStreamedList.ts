"use client";

/**
 * useStreamedList: server-paged, searchable lists that stream in
 * (docs/workstreams/LISTS.md).
 *
 *   const list = useStreamedList(source, { key: "staff-members", pageSize: 25, filters: { status: "" }, sort: { key: "name", dir: "asc" } });
 *   list.items, list.status, list.hasMore, list.loadMore(), list.setQuery("ana")
 *
 * - Typing never waits for the network: the input value updates at once, the
 *   request goes out 250 ms after the last keystroke, and every state change
 *   from the stream is a React transition.
 * - A new query, filter or sort aborts the request in flight. Each request has
 *   a sequence number and only the newest one may change the list
 *   (lib/listState.ts), so a slow old answer never overwrites a new one.
 * - Rows are appended as each network chunk arrives (NDJSON), and the rows of
 *   the previous query stay visible until the first new rows land.
 * - The first page of each query is cached in memory, so going back to a list
 *   shows it at once while it refreshes.
 * - Requests stop on unmount.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useTransition } from "react";
import { type ListSnapshot, type ListState, type ListStatus, initialListState, listReducer } from "./listState";
import type { ListSource, SortDir } from "./listSource";

export interface ListSort {
  key: string;
  dir: SortDir;
}

export interface UseStreamedListOptions<T> {
  /** Names the list for the first-page cache. Change it when the source points elsewhere. */
  key: string;
  pageSize?: number;
  initialQuery?: string;
  filters?: Record<string, string>;
  sort?: ListSort;
  /** Row identity: drops duplicates across pages. */
  keyOf?: (item: T) => string;
  debounceMs?: number;
  /** False: nothing loads (e.g. until a session is known). */
  enabled?: boolean;
}

export interface StreamedList<T> {
  items: T[];
  status: ListStatus;
  /** True while the first page of a new query is on its way (old rows still shown). */
  stale: boolean;
  /** Loading the first page with nothing to show yet. */
  initialLoading: boolean;
  /** A "load more" request is in flight. */
  loadingMore: boolean;
  hasMore: boolean;
  total: number | null;
  meta: Record<string, unknown>;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
  /** The search box value (updates on every keystroke). */
  query: string;
  setQuery: (q: string) => void;
  /** The query the shown rows answer (after the debounce). */
  activeQuery: string;
  filters: Record<string, string>;
  setFilters: (f: Record<string, string>) => void;
  setFilter: (key: string, value: string) => void;
  sort: ListSort | undefined;
  setSort: (s: ListSort) => void;
  /** Change rows in place (optimistic edits, a row closed elsewhere). */
  update: (fn: (items: T[]) => T[]) => void;
}

const CACHE_MAX = 60;
const firstPages = new Map<string, ListSnapshot<unknown>>();

function remember(key: string, snap: ListSnapshot<unknown>) {
  firstPages.delete(key);
  firstPages.set(key, snap);
  while (firstPages.size > CACHE_MAX) firstPages.delete(firstPages.keys().next().value as string);
}

/** Forget cached first pages (all, or those of one list key) after a write. */
export function clearListCache(listKey?: string) {
  if (!listKey) return firstPages.clear();
  for (const k of [...firstPages.keys()]) if (k.startsWith(`${listKey}\u0000`)) firstPages.delete(k);
}

function errorMessage(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "The list could not be loaded.";
}

const sameRecord = (a: Record<string, string>, b: Record<string, string>) => {
  const ka = Object.keys(a).filter((k) => a[k]);
  const kb = Object.keys(b).filter((k) => b[k]);
  return ka.length === kb.length && ka.every((k) => a[k] === b[k]);
};

export function useStreamedList<T>(source: ListSource<T>, opts: UseStreamedListOptions<T>): StreamedList<T> {
  const { key, pageSize = 25, initialQuery = "", debounceMs = 250, enabled = true, keyOf } = opts;
  const keyOfRef = useRef(keyOf);
  keyOfRef.current = keyOf;
  const reducer = useCallback((s: ListState<T>, a: Parameters<typeof listReducer<T>>[1]) => listReducer(s, a, keyOfRef.current), []);
  const [state, dispatch] = useReducer(reducer, undefined, () => initialListState<T>());
  const [, startTransition] = useTransition();

  const [query, setQueryRaw] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [filters, setFiltersState] = useState<Record<string, string>>(opts.filters ?? {});
  const [sort, setSortState] = useState<ListSort | undefined>(opts.sort);

  // Follow filter / sort / query changes the caller makes (URL params, the shell's country switcher).
  const optFilters = opts.filters;
  useEffect(() => {
    if (optFilters) setFiltersState((cur) => (sameRecord(cur, optFilters) ? cur : optFilters));
  }, [optFilters]);
  const optSortKey = opts.sort?.key;
  const optSortDir = opts.sort?.dir;
  useEffect(() => {
    if (optSortKey) setSortState((cur) => (cur?.key === optSortKey && cur?.dir === optSortDir ? cur : { key: optSortKey, dir: optSortDir ?? "asc" }));
  }, [optSortKey, optSortDir]);
  useEffect(() => {
    setQueryRaw(initialQuery);
    setActiveQuery(initialQuery);
  }, [initialQuery]);

  // Debounce: the box shows every keystroke, the request waits for a pause.
  useEffect(() => {
    if (query === activeQuery) return;
    const t = setTimeout(() => setActiveQuery(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, activeQuery, debounceMs]);

  const sourceRef = useRef(source);
  sourceRef.current = source;
  const seqRef = useRef(0);
  const ctrlRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const cacheKey = useMemo(
    () => `${key}\u0000${activeQuery.trim().toLowerCase()}\u0000${JSON.stringify(Object.entries(filters).filter(([, v]) => v).sort())}\u0000${sort ? `${sort.key}:${sort.dir}` : ""}\u0000${pageSize}`,
    [key, activeQuery, filters, sort, pageSize],
  );

  const run = useCallback(
    (mode: "replace" | "append") => {
      const cur = stateRef.current;
      if (mode === "append") {
        if (!cur.hasMore || !cur.nextCursor || cur.status === "loading" || cur.status === "streaming") return;
      }
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      const seq = ++seqRef.current;
      const cursor = mode === "append" ? cur.nextCursor : null;
      dispatch({ type: "start", seq, mode });
      if (mode === "replace") {
        const cached = firstPages.get(cacheKey) as ListSnapshot<T> | undefined;
        if (cached) dispatch({ type: "restore", seq, snapshot: cached });
      }
      const meta: Record<string, unknown> = {};
      const got: T[] = [];
      sourceRef
        .current(
          { q: activeQuery, filters, sort: sort?.key, dir: sort?.dir, cursor, limit: pageSize, signal: ctrl.signal },
          {
            onMeta: (m) => {
              Object.assign(meta, m);
              startTransition(() => dispatch({ type: "meta", seq, meta: m }));
            },
            onItems: (items) => {
              if (mode === "replace") got.push(...items);
              startTransition(() => dispatch({ type: "items", seq, items }));
            },
          },
        )
        .then((tail) => {
          if (ctrl.signal.aborted) return;
          startTransition(() => dispatch({ type: "end", seq, nextCursor: tail.nextCursor, hasMore: tail.hasMore, total: tail.total ?? null }));
          if (mode === "replace") {
            remember(cacheKey, { items: got, nextCursor: tail.nextCursor, hasMore: tail.hasMore, total: tail.total ?? null, meta });
          }
        })
        .catch((e) => {
          if (ctrl.signal.aborted || (e as { name?: string })?.name === "AbortError") return;
          dispatch({ type: "error", seq, error: errorMessage(e) });
        });
    },
    [activeQuery, filters, sort, pageSize, cacheKey],
  );

  // A new first page whenever the effective query changes.
  useEffect(() => {
    if (!enabled) return;
    run("replace");
  }, [run, enabled]);

  // Stop everything on unmount.
  useEffect(() => () => ctrlRef.current?.abort(), []);

  const setQuery = useCallback((q: string) => setQueryRaw(q), []);
  const setFilters = useCallback((f: Record<string, string>) => setFiltersState(f), []);
  const setFilter = useCallback((k: string, v: string) => setFiltersState((cur) => (cur[k] === v ? cur : { ...cur, [k]: v })), []);
  const setSort = useCallback((s: ListSort) => setSortState(s), []);
  const loadMore = useCallback(() => run("append"), [run]);
  const refresh = useCallback(() => {
    clearListCache(key);
    run("replace");
  }, [run, key]);
  const update = useCallback((fn: (items: T[]) => T[]) => {
    clearListCache(key);
    dispatch({ type: "update", update: fn });
  }, [key]);

  const loading = state.status === "loading";
  return {
    items: state.items,
    status: state.status,
    stale: state.stale,
    initialLoading: (state.status === "idle" || loading) && state.mode === "replace" && state.items.length === 0,
    loadingMore: state.mode === "append" && (loading || state.status === "streaming"),
    hasMore: state.hasMore,
    total: state.total,
    meta: state.meta,
    error: state.error,
    loadMore,
    refresh,
    query,
    setQuery,
    activeQuery,
    filters,
    setFilters,
    setFilter,
    sort,
    setSort,
    update,
  };
}
