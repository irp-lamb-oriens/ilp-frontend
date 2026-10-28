"use client";

/**
 * Keep a streamed list's search, filters and sort in the URL (?q=&status=&sort=name:asc),
 * so staff can share or bookmark a filtered view. Reads the URL once for the
 * initial values; writes with router.replace (no history entry per keystroke).
 */

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ListSort } from "./useStreamedList";

export interface ListUrlState {
  q: string;
  filters: Record<string, string>;
  sort?: ListSort;
}

/** Pure: the list state in a query string. Exported for tests. */
export function listUrlParams(state: ListUrlState, filterKeys: string[], defaults: Partial<ListUrlState> = {}): URLSearchParams {
  const p = new URLSearchParams();
  if (state.q.trim()) p.set("q", state.q.trim());
  for (const k of filterKeys) {
    const v = state.filters[k];
    if (v && v !== (defaults.filters?.[k] ?? "")) p.set(k, v);
  }
  const sort = state.sort ? `${state.sort.key}:${state.sort.dir}` : "";
  const def = defaults.sort ? `${defaults.sort.key}:${defaults.sort.dir}` : "";
  if (sort && sort !== def) p.set("sort", sort);
  return p;
}

/** Pure: the list state read from a query string. */
export function readListUrl(params: URLSearchParams, filterKeys: string[], defaults: Partial<ListUrlState> = {}): ListUrlState {
  const filters: Record<string, string> = { ...(defaults.filters ?? {}) };
  for (const k of filterKeys) {
    const v = params.get(k);
    if (v !== null) filters[k] = v;
  }
  const raw = params.get("sort") ?? "";
  const [key, dir] = raw.split(":");
  const sort = key ? { key, dir: dir === "desc" ? ("desc" as const) : ("asc" as const) } : defaults.sort;
  return { q: params.get("q") ?? defaults.q ?? "", filters, sort };
}

export interface ListUrl {
  /** Values to start the list with; changes only when the URL changes from outside (shell search, a link). */
  init: ListUrlState;
  /** Last query string this page wrote, so its own writes are not read back as outside changes. */
  written: { current: string | null };
}

/** Read the list state from the URL, following outside navigation only. */
export function useListUrl(filterKeys: string[], defaults: Partial<ListUrlState> = {}): ListUrl {
  const params = useSearchParams();
  const qs = params.toString();
  const written = useRef<string | null>(null);
  const keys = useRef(filterKeys);
  const defs = useRef(defaults);
  const [init, setInit] = useState(() => readListUrl(new URLSearchParams(qs), filterKeys, defaults));
  useEffect(() => {
    if (written.current === null || qs === written.current) return;
    setInit(readListUrl(new URLSearchParams(qs), keys.current, defs.current));
  }, [qs]);
  return { init, written };
}

/** Write the list's settled search, filters and sort back to the URL. */
export function useListUrlWrite(url: ListUrl, state: ListUrlState, filterKeys: string[], defaults: Partial<ListUrlState> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useSearchParams().toString();
  const next = listUrlParams(state, filterKeys, defaults).toString();
  const { written } = url;
  useEffect(() => {
    if (written.current === null) {
      // First render: the URL is the source; start tracking from here.
      written.current = current;
    }
    if (next === current) {
      written.current = current;
      return;
    }
    written.current = next;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [next, current, pathname, router, written]);
}
