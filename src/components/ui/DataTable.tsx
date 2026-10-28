"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode, type RefObject } from "react";
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
  /** Server-sorted tables (onSortChange): the column offers a sort without a local sortValue. */
  sortable?: boolean;
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
  /**
   * Server-side sort (LISTS): the table shows this order and reports header
   * clicks instead of sorting the rows itself.
   */
  sort?: { key: string; dir: SortDir } | null;
  onSortChange?: (sort: { key: string; dir: SortDir }) => void;
  /** Rows of the next page are on their way: skeleton rows after the real ones. */
  loadingMore?: boolean;
  /** Skeleton rows while loading more. Default 3. */
  moreSkeletonRows?: number;
  /** The rows belong to the previous search while a new one loads. */
  stale?: boolean;
  /** Render only the rows near the viewport once there are more than this many. Default 200; 0 turns it off. */
  windowAfter?: number;
  className?: string;
}

const OVERSCAN = 15;

/** Rows to render for a long table: the ones near the viewport (page scroll). */
function useRowWindow(count: number, enabled: boolean, bodyRef: RefObject<HTMLTableSectionElement | null>) {
  const [range, setRange] = useState({ start: 0, end: Math.min(count, 60) });
  const rowH = useRef(48);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const body = bodyRef.current;
      if (!body) return;
      const row = body.querySelector<HTMLElement>("tr[data-i]");
      const h = row?.getBoundingClientRect().height;
      if (h) rowH.current = h;
      const top = body.getBoundingClientRect().top;
      const start = Math.max(0, Math.floor(-top / rowH.current) - OVERSCAN);
      const end = Math.min(count, Math.max(start + 1, Math.ceil((window.innerHeight - top) / rowH.current) + OVERSCAN));
      setRange((r) => (r.start === start && r.end === end ? r : { start, end }));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [enabled, count, bodyRef]);
  return { range: enabled ? { start: Math.min(range.start, count), end: Math.min(range.end, count) } : { start: 0, end: count }, rowH };
}

/** An empty row that holds the height of the rows not rendered. Height set through the ref (no inline styles). */
function SpacerRow({ height, colSpan }: { height: number; colSpan: number }) {
  const ref = useCallback((el: HTMLTableCellElement | null) => {
    if (el) el.style.height = `${height}px`;
  }, [height]);
  if (height <= 0) return null;
  return (
    <tr aria-hidden="true" className={s.spacer}>
      <td ref={ref} colSpan={colSpan} className={s.spacerCell} />
    </tr>
  );
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
  sort: controlledSort,
  onSortChange,
  loadingMore = false,
  moreSkeletonRows = 3,
  stale = false,
  windowAfter = 200,
  className,
}: DataTableProps<T>) {
  const { showSkeleton, skeletonVisible } = useSkeleton(loading);
  const [localSort, setLocalSort] = useState<{ key: string; dir: SortDir } | null>(defaultSort ?? null);
  const manual = !!onSortChange;
  const sort = manual ? controlledSort ?? null : localSort;
  const [focusIdx, setFocusIdx] = useState(0);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const sorted = useMemo(() => {
    if (manual || !sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    const out = [...rows].sort((a, b) => compare(get(a), get(b)));
    return sort.dir === "desc" ? out.reverse() : out;
  }, [rows, columns, sort, manual]);

  const interactive = !!onRowActivate;
  const safeFocus = Math.min(focusIdx, Math.max(0, sorted.length - 1));
  const windowed = windowAfter > 0 && sorted.length > windowAfter;
  const { range, rowH } = useRowWindow(sorted.length, windowed, bodyRef);

  function toggleSort(key: string) {
    const next = (prev: { key: string; dir: SortDir } | null): { key: string; dir: SortDir } =>
      !prev || prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    if (manual) onSortChange!(next(sort));
    else setLocalSort(next);
  }

  function focusRow(i: number) {
    setFocusIdx(i);
    const body = bodyRef.current;
    const find = () => body?.querySelector<HTMLTableRowElement>(`tr[data-i="${i}"]`);
    const row = find();
    if (row) {
      row.focus();
      return;
    }
    if (!body) return;
    // Outside the rendered window: scroll it into place, then focus once it renders.
    const top = body.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + i * rowH.current - window.innerHeight / 2 });
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => find()?.focus()));
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

  // Stable handlers so memoized rows do not re-render on every parent render.
  const keyNavRef = useRef(onRowKeyDown);
  keyNavRef.current = onRowKeyDown;
  const onKeyNav = useCallback((e: KeyboardEvent<HTMLTableRowElement>, i: number, row: T) => keyNavRef.current(e, i, row), []);
  const activateRef = useRef(onRowActivate);
  activateRef.current = onRowActivate;
  const onActivate = useCallback((row: T) => activateRef.current?.(row), []);

  return (
    <div className={cx(s.wrap, className)}>
      <table
        className={cx(s.table, stale && s.stale)}
        aria-busy={showSkeleton || stale || loadingMore || undefined}
        aria-rowcount={windowed ? sorted.length + 1 : undefined}
      >
        <caption className={showCaption ? s.caption : s.srCaption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const canSort = !!c.sortValue || (manual && !!c.sortable);
              const ariaSort = active ? (sort!.dir === "asc" ? "ascending" : "descending") : canSort ? "none" : undefined;
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
                  {canSort ? (
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
            {windowed && <SpacerRow height={range.start * rowH.current} colSpan={columns.length} />}
            <Stagger>
              {sorted.slice(range.start, range.end).map((row, j) => {
                const i = range.start + j;
                const key = rowKey(row);
                return (
                  <BodyRow
                    key={key}
                    row={row}
                    index={i}
                    columns={columns}
                    selected={selectedKey === key}
                    hasSelection={selectedKey != null}
                    interactive={interactive}
                    focusable={i === safeFocus}
                    ariaRowIndex={windowed ? i + 2 : undefined}
                    onActivate={onActivate}
                    onKeyNav={onKeyNav}
                    setFocusIdx={setFocusIdx}
                  />
                );
              })}
            </Stagger>
            {windowed && <SpacerRow height={(sorted.length - range.end) * rowH.current} colSpan={columns.length} />}
          </tbody>
        )}
        {!showSkeleton && loadingMore && <SkeletonRows columns={columns} rows={moreSkeletonRows} visible />}
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

interface BodyRowProps<T> {
  row: T;
  index: number;
  columns: Column<T>[];
  selected: boolean;
  hasSelection: boolean;
  interactive: boolean;
  focusable: boolean;
  ariaRowIndex?: number;
  onActivate?: (row: T) => void;
  onKeyNav: (e: KeyboardEvent<HTMLTableRowElement>, i: number, row: T) => void;
  setFocusIdx: (i: number) => void;
}

/**
 * One body row. Memoized: appending a page re-renders only the new rows when
 * the caller keeps `columns` stable (useMemo) and rows keep their identity.
 */
const BodyRow = memo(function BodyRow<T>({ row, index, columns, selected, hasSelection, interactive, focusable, ariaRowIndex, onActivate, onKeyNav, setFocusIdx }: BodyRowProps<T>) {
  return (
    <RevealRow
      index={index}
      data-i={index}
      aria-rowindex={ariaRowIndex}
      className={cx(s.tr, interactive && s.clickable, selected && s.selected)}
      tabIndex={interactive ? (focusable ? 0 : -1) : undefined}
      aria-selected={hasSelection ? selected : undefined}
      onClick={interactive ? () => { setFocusIdx(index); onActivate!(row); } : undefined}
      onKeyDown={interactive ? (e) => onKeyNav(e, index, row) : undefined}
      onFocus={interactive ? () => setFocusIdx(index) : undefined}
    >
      {columns.map((c) => (
        <td key={c.key} className={cx(s.td, c.align === "end" && s.end, c.hideOnMobile && s.hideMobile)}>
          {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
        </td>
      ))}
    </RevealRow>
  );
}) as <T>(props: BodyRowProps<T>) => ReactNode;

/** A body row that fades in with the first-load stagger. */
function RevealRow({ index, className, children, ...rest }: HTMLAttributes<HTMLTableRowElement> & { index: number; "data-i"?: number }) {
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
