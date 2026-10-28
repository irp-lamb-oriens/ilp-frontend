/**
 * FILTERS: saved views, column choices and the URL form of a schema list
 * (docs/workstreams/LISTS.md, "Schema filters"). Pure functions plus
 * localStorage helpers wrapped in try/catch: a private window or blocked
 * storage only loses the convenience, never the list.
 */

import { FILTER_PREFIX, type ListSchema } from "./listSchemas";
import type { ListSort } from "./useStreamedList";

/** What a view remembers: the search, every filter param and the sort. */
export interface ViewSnapshot {
  q: string;
  /** Flat request params (schema `f.*` params and the list's own keys). */
  filters: Record<string, string>;
  sort?: ListSort;
}

export interface SavedView extends ViewSnapshot {
  id: string;
  name: string;
}

export interface ViewsState {
  views: SavedView[];
  /** The view last picked; null is "Default". */
  activeId: string | null;
}

export type ViewsAction =
  | { type: "save"; name: string; snapshot: ViewSnapshot; id?: string }
  | { type: "delete"; id: string }
  | { type: "rename"; id: string; name: string }
  | { type: "select"; id: string | null }
  | { type: "load"; state: ViewsState };

export const DEFAULT_VIEW_ID = null;
export const MAX_VIEWS = 20;

const clean = (f: Record<string, string>) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== "" && v != null).sort(([a], [b]) => a.localeCompare(b)));

/** Saved views: save (a name already used is replaced), delete, rename, select. */
export function viewsReducer(state: ViewsState, action: ViewsAction): ViewsState {
  switch (action.type) {
    case "load":
      return action.state;
    case "save": {
      const name = action.name.trim().slice(0, 60);
      if (!name || name.toLowerCase() === "default") return state;
      const same = state.views.find((v) => v.name.toLowerCase() === name.toLowerCase());
      const id = same?.id ?? action.id ?? `v${Date.now().toString(36)}${state.views.length}`;
      const view: SavedView = { id, name, q: action.snapshot.q.trim(), filters: clean(action.snapshot.filters), sort: action.snapshot.sort };
      const views = same ? state.views.map((v) => (v.id === id ? view : v)) : [...state.views, view].slice(-MAX_VIEWS);
      return { views, activeId: id };
    }
    case "delete":
      return { views: state.views.filter((v) => v.id !== action.id), activeId: state.activeId === action.id ? null : state.activeId };
    case "rename": {
      const name = action.name.trim().slice(0, 60);
      if (!name) return state;
      return { ...state, views: state.views.map((v) => (v.id === action.id ? { ...v, name } : v)) };
    }
    case "select":
      return { ...state, activeId: action.id === null || state.views.some((v) => v.id === action.id) ? action.id : state.activeId };
  }
}

/** The view whose settings equal the list's current ones (the "Default" view is the defaults), or undefined when edited. */
export function matchingView(state: ViewsState, current: ViewSnapshot, defaults: ViewSnapshot): SavedView | null | undefined {
  const same = (a: ViewSnapshot, b: ViewSnapshot) =>
    a.q.trim() === b.q.trim() &&
    JSON.stringify(clean(a.filters)) === JSON.stringify(clean(b.filters)) &&
    (a.sort?.key ?? "") === (b.sort?.key ?? "") &&
    (a.sort?.dir ?? "") === (b.sort?.dir ?? "");
  if (same(current, defaults)) return null;
  return state.views.find((v) => same(v, current));
}

function readJson<T>(key: string): T | null {
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the choice lasts for this visit only */
  }
}

export const viewsKey = (listId: string, viewer?: string | null) => `ilp_views:${listId}:${(viewer ?? "me").toLowerCase()}`;
export const columnsKey = (listId: string, viewer?: string | null) => `ilp_cols:${listId}:${(viewer ?? "me").toLowerCase()}`;

export function loadViews(listId: string, viewer?: string | null): ViewsState {
  const v = readJson<ViewsState>(viewsKey(listId, viewer));
  if (!v || !Array.isArray(v.views)) return { views: [], activeId: null };
  return { views: v.views.filter((x) => x && typeof x.id === "string" && typeof x.name === "string" && x.filters && typeof x.q === "string"), activeId: v.activeId ?? null };
}

export function storeViews(listId: string, viewer: string | null | undefined, state: ViewsState) {
  writeJson(viewsKey(listId, viewer), state);
}

/** Hidden column keys, or null when the person never changed them. */
export function loadHiddenColumns(listId: string, viewer?: string | null): string[] | null {
  const v = readJson<string[]>(columnsKey(listId, viewer));
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : null;
}

export function storeHiddenColumns(listId: string, viewer: string | null | undefined, hidden: string[] | null) {
  if (hidden === null) {
    try {
      window.localStorage.removeItem(columnsKey(listId, viewer));
    } catch {
      /* storage unavailable */
    }
    return;
  }
  writeJson(columnsKey(listId, viewer), hidden);
}

/** Columns hidden by default: schema fields with defaultVisible false. */
export function defaultHiddenColumns(schema: ListSchema, columnKeys: string[]): string[] {
  return schema.fields.filter((f) => f.defaultVisible === false && columnKeys.includes(f.key)).map((f) => f.key);
}

/** Every request param a schema list may write to the URL: its fields (f.*, serverParam) plus the list's own keys. */
export function schemaParamKeys(schema: ListSchema, extra: string[] = []): string[] {
  const keys = new Set<string>(extra);
  for (const f of schema.fields) {
    if (f.filterable === false) continue;
    keys.add(FILTER_PREFIX + f.key);
    if (f.serverParam) keys.add(f.serverParam);
  }
  return [...keys];
}
