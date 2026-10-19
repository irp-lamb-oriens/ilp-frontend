"use client";

import styles from "./listControls.module.scss";

/**
 * Centralized search input + pagination controls for dashboard lists.
 * Pairs with `usePaginatedSearch` in lib/usePaginatedSearch.ts.
 */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  resultCount,
}: {
  value: string;
  onChange: (q: string) => void;
  placeholder?: string;
  resultCount?: number;
}) {
  return (
    <div className={styles.search}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {resultCount !== undefined && (
        <span className={styles.count}>{resultCount} result{resultCount === 1 ? "" : "s"}</span>
      )}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className={styles.pageBtn}
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className={styles.gap}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p as number)}
            className={`${styles.pageBtn} ${p === page ? styles.active : ""}`}
            aria-current={p === page ? "page" : undefined}
          >
            {(p as number) + 1}
          </button>
        )
      )}

      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className={styles.pageBtn}
      >
        Next
      </button>
    </nav>
  );
}

/**
 * Build a compact page list with ellipsis gaps, e.g. [0, 1, 2, '…', 9] for a
 * long range. Keeps the control narrow even with hundreds of pages.
 */
function buildPageList(page: number, totalPages: number): Array<number | "…"> {
  const out: Array<number | "…"> = [];
  const last = totalPages - 1;

  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) out.push(i);
    return out;
  }

  out.push(0);
  if (page > 3) out.push("…");

  const start = Math.max(1, page - 1);
  const end = Math.min(last - 1, page + 1);
  for (let i = start; i <= end; i++) out.push(i);

  if (page < last - 3) out.push("…");
  out.push(last);

  return out;
}