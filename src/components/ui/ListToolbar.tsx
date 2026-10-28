"use client";

import type { ReactNode } from "react";
import { countLabel } from "@/lib/listState";
import type { StreamedList } from "@/lib/useStreamedList";
import { cx } from "./cx";
import { SearchInput } from "./SearchInput";
import { Select } from "./Select";
import s from "./ListToolbar.module.scss";

export interface ListSortOption {
  /** "key:dir", e.g. "name:asc". */
  value: string;
  label: string;
}

export interface ListToolbarProps {
  /** The streamed list (lib/useStreamedList). */
  list: Pick<StreamedList<unknown>, "query" | "setQuery" | "items" | "total" | "hasMore" | "status" | "stale" | "initialLoading" | "sort" | "setSort">;
  /** What the rows are, plural ("members"), for the count line. */
  noun: string;
  searchLabel?: string;
  placeholder?: string;
  /** Filter controls (Select, Checkbox) placed after the search box. */
  children?: ReactNode;
  /** Sort choices, when the list is not a table with sortable headers. */
  sortOptions?: ListSortOption[];
  /** Hide the count line (a page header already says it). */
  hideCount?: boolean;
  className?: string;
}

/**
 * Search, filters, sort and the result count above a streamed list. The
 * count is a polite live region, so screen readers hear "Showing 40 of 312"
 * after a search settles, not on every keystroke.
 */
export function ListToolbar({ list, noun, searchLabel = "Search", placeholder, children, sortOptions, hideCount, className }: ListToolbarProps) {
  const sortValue = list.sort ? `${list.sort.key}:${list.sort.dir}` : "";
  const settled = !list.initialLoading && !list.stale && list.status !== "loading";
  const count = list.initialLoading
    ? `Loading ${noun}…`
    : list.stale
      ? "Updating results…"
      : list.items.length === 0 && list.status === "done"
        ? `No ${noun} match.`
        : countLabel(list.items.length, list.total, list.hasMore, noun);
  return (
    <div className={cx(s.toolbar, className)}>
      <form className={s.bar} role="search" onSubmit={(e) => e.preventDefault()}>
        <SearchInput label={searchLabel} value={list.query} onValueChange={list.setQuery} placeholder={placeholder} className={s.search} />
        {children}
        {sortOptions && sortOptions.length > 0 && (
          <Select
            label="Sort"
            value={sortValue}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":");
              list.setSort({ key, dir: dir === "desc" ? "desc" : "asc" });
            }}
            options={sortOptions}
          />
        )}
      </form>
      {!hideCount && (
        <p className={cx(s.count, !settled && s.pending)} aria-live="polite" aria-atomic="true">
          {count}
        </p>
      )}
    </div>
  );
}

export default ListToolbar;
