"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";
import { EmptyState } from "./EmptyState";
import s from "./DataTable.module.scss";

export type SortDir = "asc" | "desc";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. Defaults to String(row[key]). */
  render?: (row: T) => ReactNode;
  /** Value used for sorting. Setting it makes the column sortable. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: "start" | "end";
  /** Hide below 768px to keep phones free of horizontal scroll. */
  hideOnMobile?: boolean;
  width?: "auto" | "narrow" | "wide";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Enter, Space or click on a row. Makes rows focusable. */
  onRowActivate?: (row: T) => void;
  /** Accessible table caption (visually hidden unless showCaption). */
  caption: string;
  showCaption?: boolean;
  defaultSort?: { key: string; dir: SortDir };
  /** Highlights the row whose key matches, e.g. the one open in a drawer. */
  selectedKey?: string | null;
  empty?: ReactNode;
  loading?: boolean;
  className?: string;
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // blanks last
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "en", { numeric: true, sensitivity: "base" });
}

/**
 * Sortable table. Rows are keyboard-navigable: Tab into the table, then
 * ArrowUp/ArrowDown, Home/End to move and Enter to open.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowActivate,
  caption,
  showCaption = false,
  defaultSort,
  selectedKey,
  empty,
  loading = false,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(defaultSort ?? null);
  const [focusIdx, setFocusIdx] = useState(0);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    const out = [...rows].sort((a, b) => compare(get(a), get(b)));
    return sort.dir === "desc" ? out.reverse() : out;
  }, [rows, columns, sort]);

  const interactive = !!onRowActivate;
  const safeFocus = Math.min(focusIdx, Math.max(0, sorted.length - 1));

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  function focusRow(i: number) {
    setFocusIdx(i);
    const row = bodyRef.current?.querySelectorAll<HTMLTableRowElement>("tr")[i];
    row?.focus();
  }

  function onRowKeyDown(e: KeyboardEvent<HTMLTableRowElement>, i: number, row: T) {
    const last = sorted.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusRow(Math.min(last, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusRow(Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      focusRow(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusRow(last);
    } else if ((e.key === "Enter" || e.key === " ") && onRowActivate) {
      e.preventDefault();
      onRowActivate(row);
    }
  }

  return (
    <div className={cx(s.wrap, className)}>
      <table className={s.table} aria-busy={loading || undefined}>
        <caption className={showCaption ? s.caption : s.srCaption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const ariaSort = active ? (sort!.dir === "asc" ? "ascending" : "descending") : c.sortValue ? "none" : undefined;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cx(
                    s.th,
                    c.align === "end" && s.end,
                    c.hideOnMobile && s.hideMobile,
                    c.width && s[c.width],
                  )}
                >
                  {c.sortValue ? (
                    <button type="button" className={s.sortBtn} onClick={() => toggleSort(c.key)}>
                      {c.header}
                      <span className={cx(s.sortIcon, active && s.sortActive)} aria-hidden="true">
                        {active ? (sort!.dir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {sorted.map((row, i) => {
            const key = rowKey(row);
            return (
              <tr
                key={key}
                className={cx(s.tr, interactive && s.clickable, selectedKey === key && s.selected)}
                tabIndex={interactive ? (i === safeFocus ? 0 : -1) : undefined}
                aria-selected={selectedKey != null ? selectedKey === key : undefined}
                onClick={interactive ? () => { setFocusIdx(i); onRowActivate!(row); } : undefined}
                onKeyDown={interactive ? (e) => onRowKeyDown(e, i, row) : undefined}
                onFocus={interactive ? () => setFocusIdx(i) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cx(s.td, c.align === "end" && s.end, c.hideOnMobile && s.hideMobile)}
                  >
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!loading && sorted.length === 0 && (
        <div className={s.emptyWrap}>
          {empty ?? <EmptyState compact title="Nothing to show" body="Rows appear here as soon as there is data." />}
        </div>
      )}
      {loading && <p className={s.loading}>Loading…</p>}
    </div>
  );
}

export default DataTable;
