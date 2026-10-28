"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { StreamedList } from "@/lib/useStreamedList";
import { Button } from "./Button";
import { cx } from "./cx";
import { ErrorNotice, type NoticeAudience } from "./ErrorNotice";
import s from "./ListFooter.module.scss";

export interface ListFooterProps {
  list: Pick<StreamedList<unknown>, "items" | "status" | "hasMore" | "loadingMore" | "error" | "loadMore" | "refresh" | "initialLoading">;
  /** Who reads the error steps. */
  audience: NoticeAudience;
  /** Placeholder rows while the next page loads (lists that are not a DataTable; a DataTable takes `loadingMore`). */
  skeleton?: ReactNode;
  /** Load the next page when the footer scrolls into view. Default true. */
  auto?: boolean;
  loadMoreLabel?: string;
  /** Text under the last row; null for none. */
  endLabel?: string | null;
  className?: string;
}

/**
 * Under a streamed list: "Load more" (and infinite scroll through an
 * IntersectionObserver sentinel), placeholder rows while the next page
 * streams in, an end-of-list line, and a retry notice when a page fails.
 */
export function ListFooter({ list, audience, skeleton, auto = true, loadMoreLabel = "Load more", endLabel = "End of the list.", className }: ListFooterProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMore = useRef(list.loadMore);
  loadMore.current = list.loadMore;
  const canAuto = auto && list.hasMore && list.status === "done";

  useEffect(() => {
    const el = sentinel.current;
    if (!canAuto || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore.current();
    }, { rootMargin: "320px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [canAuto]);

  if (list.initialLoading) return null;
  return (
    <div className={cx(s.footer, className)} aria-busy={list.loadingMore || undefined}>
      {list.loadingMore && skeleton}
      {list.error && (
        <ErrorNotice audience={audience} onRetry={list.items.length ? list.loadMore : list.refresh}>
          {list.error}
        </ErrorNotice>
      )}
      {list.hasMore && !list.error && (
        <div ref={sentinel} className={s.more}>
          <Button size="sm" variant="secondary" onClick={list.loadMore} disabled={list.loadingMore}>
            {list.loadingMore ? "Loading more…" : loadMoreLabel}
          </Button>
        </div>
      )}
      {!list.hasMore && list.status === "done" && list.items.length > 0 && endLabel && <p className={s.end}>{endLabel}</p>}
    </div>
  );
}

export default ListFooter;
