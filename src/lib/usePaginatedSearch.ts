"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Centralized client-side pagination + smart search for dashboard lists.
 *
 * Search techniques:
 *   - Debounced input (default 200ms) so filtering does not run per keystroke.
 *   - Diacritic-insensitive normalization ("café" matches "cafe", "Costa" matches
 *     "costa") via Unicode NFD decomposition.
 *   - Tokenized AND semantics: each whitespace-separated word must match at
 *     least one searchable field, so "pablo cr" narrows instead of widening.
 *
 * Performance:
 *   - Filtering is memoized (useMemo) and only recomputes when the debounced
 *     query or the source list changes.
 *   - Pagination slices the filtered set so only one page of DOM nodes renders.
 *
 * Security:
 *   - The query is treated as plain text and only ever compared as a string;
 *     it is never interpolated into HTML or a query language. React escapes all
 *     rendered values by default, so there is no injection surface.
 */
export interface PaginatedSearchOptions {
  /** Keys to search across. Values are coerced to string and normalized. */
  searchKeys: string[];
  pageSize?: number;
  debounceMs?: number;
}

export interface PaginatedSearchResult<T> {
  query: string;
  setQuery: (q: string) => void;
  page: number;
  setPage: (p: number) => void;
  /** The current page of filtered items. */
  pageItems: T[];
  /** Total number of items after filtering. */
  total: number;
  totalPages: number;
  /** True when a search term is active. */
  isFiltered: boolean;
}

/** Lowercase and strip combining diacritics for accent-insensitive matching. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesQuery<T extends object>(
  item: T,
  tokens: string[],
  searchKeys: string[],
): boolean {
  return tokens.every((token) =>
    searchKeys.some((key) => {
      const raw = (item as Record<string, unknown>)[key];
      if (raw == null) return false;
      return normalize(String(raw)).includes(token);
    })
  );
}

export function usePaginatedSearch<T extends object>(
  items: T[],
  options: PaginatedSearchOptions,
): PaginatedSearchResult<T> {
  const { searchKeys, pageSize = 20, debounceMs = 200 } = options;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);

  // Debounce the raw query so filtering runs once after typing settles.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Reset to the first page whenever the effective query changes.
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery]);

  const filtered = useMemo(() => {
    const tokens = normalize(debouncedQuery)
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.length === 0) return items;
    return items.filter((item) => matchesQuery(item, tokens, searchKeys));
  }, [items, debouncedQuery, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pageItems = useMemo(
    () => filtered.slice(page * pageSize, (page + 1) * pageSize),
    [filtered, page, pageSize],
  );

  return {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    total: filtered.length,
    totalPages,
    isFiltered: debouncedQuery.trim().length > 0,
  };
}