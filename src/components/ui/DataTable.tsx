"use client";

import { useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";
import { EmptyState } from "./EmptyState";
import { Skeleton, useSkeleton } from "./Skeleton";
import { Stagger, useReveal } from "./Stagger";
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
  /** Shows skeleton rows under the real header (after a short grace delay). */
  loading?: boolean;
  /** Skeleton rows while loading. Default 5. */
  skeletonRows?: number;
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
  skeletonRows = 5,
  className,
}: DataTableProps<T>) {
  const { showSkeleton, skeletonVisible } = useSkeleton(loading);
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
      <table className={s.table} aria-busy={showSkeleton || undefined}>
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
                      <SortIcon className={cx(s.sortIcon, active && s.sortActive)} dir={active ? sort!.dir : null} />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        {showSkeleton ? (
          <SkeletonRows columns={columns} rows={skeletonRows} visible={skeletonVisible} />
        ) : (
          <tbody ref={bodyRef}>
            <Stagger>
              {sorted.map((row, i) => {
                const key = rowKey(row);
                return (
                  <RevealRow
                    key={key}
                    index={i}
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
                  </RevealRow>
                );
              })}
            </Stagger>
          </tbody>
        )}
      </table>
      {!showSkeleton && sorted.length === 0 && (
        <div className={s.emptyWrap}>
          {empty ?? <EmptyState compact title="Nothing to show" body="Rows appear here as soon as there is data." />}
        </div>
      )}
      {showSkeleton && (
        <span className={s.srCaption} role="status">
          Loading {caption.toLowerCase()}…
        </span>
      )}
    </div>
  );
}

/** A body row that fades in with the first-load stagger. */
function RevealRow({ index, className, children, ...rest }: HTMLAttributes<HTMLTableRowElement> & { index: number }) {
  const reveal = useReveal(index, className);
  return (
    <tr {...rest} className={reveal.className} data-reveal-i={reveal["data-reveal-i"]} onAnimationEnd={reveal.onAnimationEnd}>
      {children}
    </tr>
  );
}

type SkeletonColumn = Pick<Column<unknown>, "align" | "hideOnMobile" | "width"> & { header?: string; key?: string };

const CELL_WIDTHS = ["75", "60", "40", "60", "25", "40"] as const;

function SkeletonRows({ columns, rows, visible }: { columns: SkeletonColumn[]; rows: number; visible: boolean }) {
  return (
    <tbody className={cx(s.skBody, !visible && s.skPending)} aria-hidden="true">
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className={s.tr}>
          {columns.map((c, i) => (
            <td key={c.key ?? i} className={cx(s.td, s.skCell, c.align === "end" && s.end, c.hideOnMobile && s.hideMobile)}>
              <Skeleton
                shape="line"
                size="sm"
                width={i === 0 ? "75" : CELL_WIDTHS[(i + r) % CELL_WIDTHS.length]}
                className={c.align === "end" ? s.skEnd : undefined}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export interface SkeletonTableProps {
  /** Column count, or column shapes (header text, hideOnMobile, align) to mirror a real table. */
  columns: number | SkeletonColumn[];
  rows?: number;
  className?: string;
}

/**
 * Stand-alone table skeleton with DataTable's exact frame, header row and
 * mobile column hiding. Use it before the page that owns the table mounts.
 */
export function SkeletonTable({ columns, rows = 5, className }: SkeletonTableProps) {
  const cols: SkeletonColumn[] = typeof columns === "number" ? Array.from({ length: columns }, () => ({})) : columns;
  return (
    <div className={cx(s.wrap, className)} aria-hidden="true">
      <table className={s.table}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={c.key ?? i} className={cx(s.th, c.align === "end" && s.end, c.hideOnMobile && s.hideMobile, c.width && s[c.width])}>
                {c.header ?? <Skeleton shape="line" size="xs" width={i === 0 ? "40" : "60"} />}
              </th>
            ))}
          </tr>
        </thead>
        <SkeletonRows columns={cols} rows={rows} visible />
      </table>
    </div>
  );
}

export default DataTable;

/** Sort marker: one arrow for the active direction, a double arrow when the column is not sorted. */
function SortIcon({ dir, className }: { dir: "asc" | "desc" | null; className?: string }) {
  const d = dir === "asc" ? "M6 9.5V2.5M3.5 5L6 2.5 8.5 5" : dir === "desc" ? "M6 2.5v7M3.5 7L6 9.5 8.5 7" : "M4 4.5L6 2.5l2 2M4 7.5l2 2 2-2";
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}
