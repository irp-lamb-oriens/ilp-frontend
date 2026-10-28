"use client";

/**
 * FILTERS: a streamed list driven by a list schema (lib/listSchemas.ts).
 *
 *   const sl = useSchemaList<MemberRow>({ schema: LIST_SCHEMAS.staffMembers, key: "staff-members", source, viewer: staff.email });
 *   <FilterBar list={sl} /> <DataTable columns={sl.visibleColumns(columns)} … /> <ListFooter list={sl.list} />
 *
 * One source of truth: the streamed list's flat params (`f.*` and the
 * schema's legacy `serverParam` keys, plus the list's own keys such as
 * `owner` or `country`). The filter state the UI edits is read from them, so
 * URLs, saved views and the server all see the same thing.
 *
 * Pass `rows` instead of `source` for small, bounded lists the page already
 * holds (one member's records): the same toolbar, filters and footer page
 * them in the browser.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Column } from "@/components/ui/DataTable";
import {
  FILTER_PREFIX,
  filterParams,
  type FilterState,
  type FilterValue,
  isActiveFilter,
  type ListSchema,
  mergeSchemaMeta,
  type PublicListSchema,
  readFilterParams,
} from "./listSchemas";
import type { ListSource } from "./listSource";
import {
  defaultHiddenColumns,
  loadHiddenColumns,
  loadViews,
  matchingView,
  type SavedView,
  schemaParamKeys,
  storeHiddenColumns,
  storeViews,
  type ViewSnapshot,
  type ViewsState,
  viewsReducer,
} from "./listViews";
import { schemaMemorySource, type SchemaSourceOptions } from "./schemaSource";
import { useListUrl, useListUrlWrite } from "./useListUrl";
import { type ListSort, type StreamedList, useStreamedList } from "./useStreamedList";

export interface UseSchemaListOptions<T> {
  schema: ListSchema;
  /** Names the list (first-page cache, saved views, column choices). */
  key: string;
  /** Server list. */
  source?: ListSource<T>;
  /** Or rows already in the browser; null while they load. */
  rows?: readonly T[] | null;
  /** For `rows`: search, sorts, own filters and readers. */
  local?: SchemaSourceOptions<T>;
  pageSize?: number;
  keyOf?: (item: T) => string;
  /** Params that are not schema filters (owner=me, country, open=1). */
  baseFilters?: Record<string, string>;
  defaultFilters?: FilterState;
  defaultSort?: ListSort;
  initialQuery?: string;
  /** Saved views and columns are stored per person. */
  viewer?: string | null;
  enabled?: boolean;
  /** Internal: initial values read from the URL. */
  init?: { q: string; filters: Record<string, string>; sort?: ListSort };
}

export interface SchemaViews {
  state: ViewsState;
  /** The saved view the list matches now: null is Default, undefined is "edited". */
  current: SavedView | null | undefined;
  save: (name: string) => void;
  remove: (id: string) => void;
  select: (id: string | null) => void;
}

export interface SchemaList<T> {
  list: StreamedList<T>;
  /** The schema with the options and counts the server (or the rows) supplied. */
  schema: ListSchema;
  filterState: FilterState;
  setFieldFilter: (key: string, value: FilterValue | null) => void;
  clearFilters: () => void;
  /** Active schema filters. */
  activeCount: number;
  views: SchemaViews;
  hiddenColumns: string[];
  setColumnHidden: (key: string, hidden: boolean) => void;
  resetColumns: () => void;
  /** The table columns the person chose to see. */
  visibleColumns: <C extends Column<T>>(columns: C[]) => C[];
  /** Column keys and headers offered by the column chooser. */
  setColumnCatalog: (columns: Array<{ key: string; header: string }>) => void;
  columnCatalog: Array<{ key: string; header: string }>;
}

/** Keys of a flat param set that belong to the schema. */
function schemaOwned(schema: ListSchema): Set<string> {
  return new Set(schemaParamKeys(schema));
}

export function useSchemaList<T>(o: UseSchemaListOptions<T>): SchemaList<T> {
  const { schema, key, pageSize = 25, viewer, enabled = true } = o;
  const owned = useMemo(() => schemaOwned(schema), [schema]);
  const defaultFlat = useMemo(() => ({ ...(o.baseFilters ?? {}), ...filterParams(schema, o.defaultFilters ?? {}) }), [schema, o.baseFilters, o.defaultFilters]);

  // Local rows: a memory source over a ref, refreshed when the rows change.
  const rowsRef = useRef(o.rows ?? []);
  rowsRef.current = o.rows ?? [];
  const localRef = useRef(o.local);
  localRef.current = o.local;
  const memory = useMemo(() => schemaMemorySource<T>(schema, () => rowsRef.current, () => localRef.current), [schema]);
  const isLocal = !o.source;
  // The first params; later changes of baseFilters are merged in below, so they never wipe the person's filters.
  const [firstFlat] = useState(defaultFlat);
  const list = useStreamedList<T>(o.source ?? memory, {
    key,
    pageSize,
    initialQuery: o.init?.q ?? o.initialQuery ?? "",
    filters: o.init?.filters ?? firstFlat,
    sort: o.init?.sort ?? o.defaultSort,
    keyOf: o.keyOf,
    debounceMs: isLocal ? 120 : 250,
    enabled: enabled && (!isLocal || o.rows != null),
  });
  const listRef = useRef(list);
  listRef.current = list;
  const { refresh, setFilters } = list;
  const baseKey = JSON.stringify(o.baseFilters ?? {});
  const firstBase = useRef(baseKey);
  useEffect(() => {
    if (baseKey === firstBase.current) return;
    firstBase.current = baseKey;
    const base = JSON.parse(baseKey) as Record<string, string>;
    const cur = listRef.current.filters;
    setFilters({ ...cur, ...base });
  }, [baseKey, setFilters]);
  const firstRows = useRef(true);
  useEffect(() => {
    if (!isLocal || o.rows == null) return;
    if (firstRows.current) {
      firstRows.current = false;
      return;
    }
    refresh();
  }, [isLocal, o.rows, refresh]);

  const merged = useMemo(() => mergeSchemaMeta(schema, list.meta.schema as PublicListSchema | undefined), [schema, list.meta.schema]);
  const filterState = useMemo(() => readFilterParams(schema, { get: (k) => list.filters[k] || null }), [schema, list.filters]);
  const activeCount = Object.values(filterState).filter(isActiveFilter).length;

  const setFieldFilter = useCallback(
    (fieldKey: string, value: FilterValue | null) => {
      const cur = listRef.current.filters;
      const state = readFilterParams(schema, { get: (k) => cur[k] || null });
      if (value && isActiveFilter(value)) state[fieldKey] = value;
      else delete state[fieldKey];
      const rest = Object.fromEntries(Object.entries(cur).filter(([k]) => !owned.has(k)));
      listRef.current.setFilters({ ...rest, ...filterParams(schema, state) });
    },
    [schema, owned],
  );
  const clearFilters = useCallback(() => {
    const cur = listRef.current.filters;
    const rest = Object.fromEntries(Object.entries(cur).filter(([k]) => !owned.has(k)));
    listRef.current.setFilters(rest);
  }, [owned]);

  // Saved views (per person, per list).
  const [views, dispatchViews] = useReducer(viewsReducer, { views: [], activeId: null });
  const viewsLoaded = useRef(false);
  useEffect(() => {
    dispatchViews({ type: "load", state: loadViews(key, viewer) });
    viewsLoaded.current = true;
  }, [key, viewer]);
  useEffect(() => {
    if (viewsLoaded.current) storeViews(key, viewer, views);
  }, [views, key, viewer]);
  const snapshot: ViewSnapshot = { q: list.activeQuery, filters: list.filters, sort: list.sort };
  const defaults: ViewSnapshot = useMemo(() => ({ q: "", filters: defaultFlat, sort: o.defaultSort }), [defaultFlat, o.defaultSort]);
  const current = matchingView(views, snapshot, defaults);
  const apply = useCallback((v: ViewSnapshot) => {
    const l = listRef.current;
    l.setQuery(v.q);
    l.setFilters(v.filters);
    if (v.sort) l.setSort(v.sort);
  }, []);
  const viewApi: SchemaViews = {
    state: views,
    current,
    save: (name) => dispatchViews({ type: "save", name, snapshot: { q: listRef.current.activeQuery, filters: listRef.current.filters, sort: listRef.current.sort } }),
    remove: (id) => dispatchViews({ type: "delete", id }),
    select: (id) => {
      dispatchViews({ type: "select", id });
      const v = id === null ? defaults : views.views.find((x) => x.id === id);
      if (v) apply(v);
    },
  };

  // Column chooser.
  const [catalog, setCatalog] = useState<Array<{ key: string; header: string }>>([]);
  const [stored, setStored] = useState<string[] | null>(null);
  useEffect(() => setStored(loadHiddenColumns(key, viewer)), [key, viewer]);
  const hiddenColumns = useMemo(() => stored ?? defaultHiddenColumns(schema, catalog.map((c) => c.key)), [stored, schema, catalog]);
  const setColumnHidden = useCallback(
    (col: string, hidden: boolean) => {
      const next = new Set(hiddenColumns);
      if (hidden) next.add(col);
      else next.delete(col);
      const arr = [...next];
      setStored(arr);
      storeHiddenColumns(key, viewer, arr);
    },
    [hiddenColumns, key, viewer],
  );
  const resetColumns = useCallback(() => {
    setStored(null);
    storeHiddenColumns(key, viewer, null);
  }, [key, viewer]);
  const setColumnCatalog = useCallback((cols: Array<{ key: string; header: string }>) => {
    setCatalog((cur) => (cur.length === cols.length && cur.every((c, i) => c.key === cols[i].key && c.header === cols[i].header) ? cur : cols));
  }, []);
  const visibleColumns = useCallback(
    <C extends Column<T>>(columns: C[]): C[] => {
      const hidden = new Set(hiddenColumns);
      const shown = columns.filter((c) => !hidden.has(c.key));
      return shown.length ? shown : columns.slice(0, 1);
    },
    [hiddenColumns],
  );

  return {
    list,
    schema: merged,
    filterState,
    setFieldFilter,
    clearFilters,
    activeCount,
    views: viewApi,
    hiddenColumns,
    setColumnHidden,
    resetColumns,
    visibleColumns,
    setColumnCatalog,
    columnCatalog: catalog,
  };
}

/**
 * The same, with search, filters and sort kept in the URL (staff pages), so a
 * filtered view can be shared or bookmarked. `extraKeys`: the list's own
 * params that belong in the URL too (owner, open).
 */
export function useSchemaListWithUrl<T>(o: UseSchemaListOptions<T> & { extraKeys?: string[] }): SchemaList<T> {
  const keys = useMemo(() => schemaParamKeys(o.schema, o.extraKeys ?? []), [o.schema, o.extraKeys]);
  const defaultsFlat = useMemo(() => ({ ...(o.baseFilters ?? {}), ...filterParams(o.schema, o.defaultFilters ?? {}) }), [o.schema, o.baseFilters, o.defaultFilters]);
  const urlDefaults = useMemo(() => ({ filters: defaultsFlat, sort: o.defaultSort }), [defaultsFlat, o.defaultSort]);
  const url = useListUrl(keys, urlDefaults);
  const init = useMemo(() => ({ ...url.init, filters: { ...defaultsFlat, ...url.init.filters } }), [url.init, defaultsFlat]);
  const sl = useSchemaList<T>({ ...o, init });
  useListUrlWrite(url, { q: sl.list.activeQuery, filters: sl.list.filters, sort: sl.list.sort }, keys, urlDefaults);
  return sl;
}

export { FILTER_PREFIX };
