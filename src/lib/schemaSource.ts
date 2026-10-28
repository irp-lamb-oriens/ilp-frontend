/**
 * FILTERS: a ListSource over rows the browser already holds, driven by a list
 * schema (lib/listSchemas.ts). Same params as the server: `f.*` filters,
 * `serverParam` equality, `q`, `sort`/`dir`, an offset cursor. The first page
 * carries the schema with option counts in its meta, like the server's.
 */

import {
  facetCounts,
  fieldValue,
  FILTER_PREFIX,
  type ListSchema,
  normalizeFilterText,
  type ParsedFilter,
  parseFilterParams,
  publicSchema,
  rowMatches,
  searchValues,
  sortKeyOf,
  type ValueReader,
} from "./listSchemas";
import type { ListSource } from "./listSource";

export interface SchemaSourceOptions<T> {
  /** Search values; default: the schema's searchable fields. */
  search?: (row: T) => unknown[];
  /** Sort keys beyond the schema's sortable fields (or overrides). */
  sorts?: Record<string, (row: T) => string | number | boolean | null | undefined>;
  /** Predicates for the list's own params (not in the schema). */
  filters?: Record<string, (row: T, value: string) => boolean>;
  /** How a field is read when it is not at its key or path. */
  read?: ValueReader<T>;
  /** Extra meta for the first page. */
  meta?: (rows: T[]) => Record<string, unknown>;
}

/** Flat params → schema filters (bad ones are ignored, as a hand-edited URL may hold them). */
export function schemaFiltersOf(schema: ListSchema, params: Record<string, string>): ParsedFilter[] {
  const out: ParsedFilter[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue;
    if (k.startsWith(FILTER_PREFIX)) {
      try {
        out.push(...parseFilterParams(schema, { [k]: v }));
      } catch {
        /* skip */
      }
      continue;
    }
    const field = schema.fields.find((f) => f.serverParam === k && f.filterable !== false);
    if (field) out.push({ field, filter: field.type === "boolean" ? { op: "boolean", value: v === "1" } : { op: "eq", value: v } });
  }
  return out;
}

const words = (q: string) => normalizeFilterText(q).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

function compare(a: unknown, b: unknown): number {
  const blank = (v: unknown) => v === null || v === undefined || v === "";
  if (blank(a) || blank(b)) return blank(a) && blank(b) ? 0 : blank(a) ? 1 : -1; // blanks last
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), "en", { numeric: true, sensitivity: "base" });
}

/** `options` may be a getter, read on every request (a hook keeps them in a ref). */
export function schemaMemorySource<T>(
  schema: ListSchema,
  load: () => Promise<readonly T[]> | readonly T[],
  options: SchemaSourceOptions<T> | (() => SchemaSourceOptions<T> | undefined) = {},
): ListSource<T> {
  return async (req, cb) => {
    const o = (typeof options === "function" ? options() : options) ?? {};
    const read: ValueReader<T> = o.read ? (r, f) => o.read!(r, f) ?? fieldValue(r, f) : (r, f) => fieldValue(r, f);
    const search = o.search ?? ((r: T) => searchValues(schema, r, read));
    const rows = [...(await load())];
    const where = schemaFiltersOf(schema, req.filters);
    const own = Object.entries(req.filters).filter(([k, v]) => v && o.filters?.[k]);
    const qw = words(req.q);
    let out = rows.filter(
      (r) =>
        own.every(([k, v]) => o.filters![k](r, v)) &&
        rowMatches(r, where, read) &&
        (!qw.length || qw.every((w) => search(r).some((x) => words(String(x ?? "")).some((p) => p.startsWith(w))))),
    );
    if (req.sort) {
      const custom = o.sorts?.[req.sort];
      const field = custom ? null : schema.fields.find((f) => sortKeyOf(f) === req.sort);
      const key = custom ?? (field ? (r: T) => read(r, field) as string | number | null | undefined : null);
      if (key) {
        out = out
          .map((r, i) => ({ r, i, k: key(r) }))
          .sort((a, b) => {
            const c = compare(a.k, b.k);
            if (c === 0) return a.i - b.i;
            // Blanks stay last in both directions.
            const blankA = a.k === null || a.k === undefined || a.k === "";
            const blankB = b.k === null || b.k === undefined || b.k === "";
            if (blankA || blankB) return c;
            return req.dir === "desc" ? -c : c;
          })
          .map((x) => x.r);
      }
    }
    if (!req.cursor) cb.onMeta({ ...(o.meta?.(rows) ?? {}), schema: publicSchema(schema, facetCounts(schema, rows, read)) });
    const start = Number(req.cursor ?? 0) || 0;
    const page = out.slice(start, start + req.limit);
    if (page.length) cb.onItems(page);
    const next = start + req.limit;
    return { nextCursor: next < out.length ? String(next) : null, hasMore: next < out.length, total: out.length };
  };
}
