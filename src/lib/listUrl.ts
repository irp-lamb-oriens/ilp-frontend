/**
 * The list state in a query string and back (pure; lib/useListUrl.ts uses it,
 * and tests import it without Next.js).
 */

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
