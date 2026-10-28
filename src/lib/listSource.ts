/**
 * Where a streamed list gets its rows (docs/workstreams/LISTS.md).
 *
 * `apiListSource` speaks the server contract of helper/listing.ts: it asks
 * for NDJSON and hands rows to the list as each network chunk arrives; a
 * plain JSON page (older server, proxy that buffers) works the same way, in
 * one batch. `memoryListSource` pages an array already in the browser, for the
 * offline mocks.
 */

import type { ApiClient } from "./api";
import { readNdjson } from "./ndjson";

export type SortDir = "asc" | "desc";

export interface ListQuery {
  q: string;
  filters: Record<string, string>;
  sort?: string;
  dir?: SortDir;
}

export interface ListRequest extends ListQuery {
  cursor: string | null;
  limit: number;
  signal: AbortSignal;
}

export interface ListTail {
  nextCursor: string | null;
  hasMore: boolean;
  total?: number | null;
}

export interface ListCallbacks<T> {
  onMeta(meta: Record<string, unknown>): void;
  onItems(items: T[]): void;
}

export type ListSource<T> = (req: ListRequest, cb: ListCallbacks<T>) => Promise<ListTail>;

type Params = Record<string, string | number | boolean | undefined | null>;

export interface NdjsonLine {
  type?: string;
  item?: unknown;
  error?: string;
  nextCursor?: string | null;
  hasMore?: boolean;
  total?: number;
  [k: string]: unknown;
}

/**
 * Route one chunk's NDJSON lines to the callbacks. Returns the end line when
 * the chunk carries it. Pure apart from the callbacks; exported for tests.
 */
export function dispatchLines<T>(lines: unknown[], cb: ListCallbacks<T>): ListTail | null {
  const items: T[] = [];
  let tail: ListTail | null = null;
  for (const raw of lines) {
    const line = raw as NdjsonLine;
    if (line.type === "item") items.push(line.item as T);
    else if (line.type === "meta") {
      const meta: Record<string, unknown> = { ...line };
      delete meta.type;
      cb.onMeta(meta);
    } else if (line.type === "end") {
      tail = { nextCursor: line.nextCursor ?? null, hasMore: !!line.hasMore, total: line.total ?? null };
    } else if (line.type === "error") {
      if (items.length) cb.onItems(items);
      throw new Error(line.error || "The list could not be loaded.");
    }
  }
  if (items.length) cb.onItems(items);
  return tail;
}

/** The query string for one page request. Empty values are left out. */
export function listParams(req: Omit<ListRequest, "signal">, base: Params = {}): Params {
  const out: Params = { ...base };
  for (const [k, v] of Object.entries(req.filters)) if (v) out[k] = v;
  if (req.q.trim()) out.q = req.q.trim();
  if (req.sort) out.sort = req.sort;
  if (req.dir) out.dir = req.dir;
  if (req.cursor) out.cursor = req.cursor;
  out.limit = req.limit;
  out.stream = 1;
  return out;
}

export function apiListSource<T>(client: ApiClient, path: string, base: Params = {}): ListSource<T> {
  return async (req, cb) => {
    const { signal, ...rest } = req;
    const res = await client.open(path, {
      method: "GET",
      query: listParams(rest, base),
      headers: { Accept: "application/x-ndjson, application/json" },
      signal,
    });
    const type = res.headers.get("Content-Type") ?? "";
    if (type.includes("ndjson") && res.body) {
      let tail: ListTail | null = null;
      for await (const lines of readNdjson(res.body, signal)) {
        tail = dispatchLines(lines, cb) ?? tail;
      }
      if (signal.aborted) return { nextCursor: null, hasMore: false };
      if (!tail) throw new Error("The list was cut off. Try again.");
      return tail;
    }
    // A JSON page: the same contract in one body.
    const body = (await res.json()) as { items?: T[]; nextCursor?: string | null; hasMore?: boolean; total?: number } & Record<string, unknown>;
    const { items = [], nextCursor = null, hasMore = false, total, ...meta } = body;
    if (Object.keys(meta).length) cb.onMeta(meta);
    if (items.length) cb.onItems(items);
    return { nextCursor, hasMore, total: total ?? null };
  };
}

export interface MemoryListOptions<T> {
  search?: (row: T) => unknown[];
  sorts?: Record<string, (row: T) => string | number | null | undefined>;
  filters?: Record<string, (row: T, value: string) => boolean>;
  meta?: (rows: T[]) => Record<string, unknown>;
}

const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Pages rows the browser already has (mock data). The cursor is an offset. */
export function memoryListSource<T>(load: () => Promise<T[]>, o: MemoryListOptions<T> = {}): ListSource<T> {
  return async (req, cb) => {
    const rows = await load();
    const words = norm(req.q).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    let out = rows.filter((r) =>
      Object.entries(req.filters).every(([k, v]) => !v || !o.filters?.[k] || o.filters[k](r, v)) &&
      (!words.length || !o.search || words.every((w) => o.search!(r).some((x) => norm(x).split(/[^\p{L}\p{N}]+/u).some((p) => p.startsWith(w)))))
    );
    const key = req.sort ? o.sorts?.[req.sort] : undefined;
    if (key) {
      out = [...out].sort((a, b) => {
        const x = key(a) ?? "";
        const y = key(b) ?? "";
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return req.dir === "desc" ? -c : c;
      });
    }
    if (o.meta && !req.cursor) cb.onMeta(o.meta(rows));
    const start = Number(req.cursor ?? 0) || 0;
    const page = out.slice(start, start + req.limit);
    if (page.length) cb.onItems(page);
    const next = start + req.limit;
    return { nextCursor: next < out.length ? String(next) : null, hasMore: next < out.length, total: out.length };
  };
}
