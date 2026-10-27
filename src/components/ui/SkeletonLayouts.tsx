"use client";

import type { ReactNode } from "react";
import { cx } from "./cx";
import { Skeleton, type SkeletonWidth } from "./Skeleton";
import { SkeletonStatTile } from "./StatTile";
import s from "./SkeletonLayouts.module.scss";

/**
 * Ready-made skeleton layouts that mirror the real ones. Each accepts the
 * page's own layout class (`className`) so the placeholder uses the exact
 * grid of the content it stands in for. All are aria-hidden: wrap them in
 * <Loadable> or <SkeletonRegion>, which carry aria-busy and the status text.
 */

const LINE_WIDTHS: SkeletonWidth[] = ["75", "60", "90", "40", "60"];

/** Lines of body text; the last one is shorter. */
export function SkeletonText({ lines = 3, size = "md", className }: { lines?: number; size?: "xs" | "sm" | "md"; className?: string }) {
  return (
    <div className={cx(s.text, className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} shape="line" size={size} width={i === lines - 1 && lines > 1 ? "60" : "100"} />
      ))}
    </div>
  );
}

/** KPI strip: one large tile (the headline figure) and `small` small ones. */
export function SkeletonStatStrip({ small = 4, large = true, className }: { small?: number; large?: boolean; className?: string }) {
  return (
    <div className={cx(className ?? s.strip)} aria-hidden="true">
      {large && <SkeletonStatTile size="lg" />}
      {Array.from({ length: small }, (_, i) => (
        <SkeletonStatTile key={i} />
      ))}
    </div>
  );
}

export interface SkeletonListProps {
  rows?: number;
  /** Leading element: a status pill, an avatar circle, a time column, or nothing. */
  lead?: "pill" | "avatar" | "time" | null;
  /** Trailing element. */
  trail?: "pill" | "pills" | "button" | null;
  /** Text lines per row (1-3). */
  lines?: 1 | 2 | 3;
  /** "framed": one bordered list with hairlines; "spaced": separate bordered rows; "plain": no frame. */
  variant?: "framed" | "spaced" | "plain";
  /** 44px rows instead of 64px. */
  compact?: boolean;
  className?: string;
  rowClassName?: string;
}

/** Rows with a lead (pill, avatar, time), one to three lines and a trailing pill. */
export function SkeletonList({
  rows = 4,
  lead = "pill",
  trail = "pill",
  lines = 2,
  variant = "framed",
  compact = false,
  className,
  rowClassName,
}: SkeletonListProps) {
  return (
    <ul className={cx(s.list, variant === "framed" && s.framed, variant === "spaced" && s.spaced, className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className={cx(s.row, lead === "time" && s.rowTime, compact && s.compact, rowClassName)}>
          {lead === "pill" && (
            <span className={s.lead}>
              <Skeleton shape="pill" size="sm" width="pill-lg" />
            </span>
          )}
          {lead === "avatar" && (
            <span className={cx(s.lead, s.avatar)}>
              <Skeleton shape="circle" size="md" />
            </span>
          )}
          {lead === "time" && (
            <span className={cx(s.lead, s.leadTime)}>
              <Skeleton shape="line" size="md" width="75" />
              <Skeleton shape="line" size="xs" width="60" />
            </span>
          )}
          <span className={s.lines}>
            <Skeleton shape="line" size="md" width={LINE_WIDTHS[i % LINE_WIDTHS.length]} />
            {lines > 1 && <Skeleton shape="line" size="sm" width="40" />}
            {lines > 2 && <Skeleton shape="line" size="sm" width="75" />}
          </span>
          {trail === "pill" && (
            <span className={s.trail}>
              <Skeleton shape="pill" size="sm" />
            </span>
          )}
          {trail === "pills" && (
            <span className={s.trail}>
              <Skeleton shape="pill" size="sm" width="pill-sm" />
              <Skeleton shape="pill" size="sm" />
            </span>
          )}
          {trail === "button" && (
            <span className={s.trail}>
              <Skeleton shape="pill" size="lg" width="pill-lg" />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export interface SkeletonCardProps {
  /** Title line in the header. */
  title?: boolean;
  /** Pill on the right of the title. */
  badge?: boolean;
  lines?: number;
  /** A large figure under the title (balance, minutes left). */
  figure?: boolean;
  /** A block (progress bar, chart) under the text. */
  media?: "bar" | "chart" | null;
  /** A pill button at the bottom. */
  action?: boolean;
  tone?: "default" | "mist" | "accent";
  className?: string;
  children?: ReactNode;
}

/** Card placeholder on the Card surface (hairline, flat radius). */
export function SkeletonCard({
  title = true,
  badge = false,
  lines = 2,
  figure = false,
  media = null,
  action = false,
  tone = "default",
  className,
  children,
}: SkeletonCardProps) {
  return (
    <div className={cx(s.card, tone !== "default" && s[tone], className)} aria-hidden="true">
      {(title || badge) && (
        <div className={s.cardHead}>
          {title && <Skeleton shape="line" size="lg" width="40" />}
          {badge && <Skeleton shape="pill" size="sm" />}
        </div>
      )}
      {figure && <Skeleton shape="line" size="xl" width="40" />}
      {lines > 0 && <SkeletonText lines={lines} />}
      {media === "bar" && <Skeleton shape="pill" size="xs" width="100" />}
      {media === "chart" && <Skeleton shape="block" size="xl" />}
      {children}
      {action && <Skeleton shape="pill" size="lg" width="pill-lg" />}
    </div>
  );
}

export interface SkeletonBoardProps {
  /** Cards per column; its length is the column count. */
  cards?: number[];
  className?: string;
  columnClassName?: string;
}

/** Kanban placeholder: columns with a header and cards. */
export function SkeletonBoard({ cards = [3, 2, 2, 1], className, columnClassName }: SkeletonBoardProps) {
  return (
    <div className={cx(className ?? s.board)} aria-hidden="true">
      {cards.map((n, c) => (
        <div key={c} className={cx(s.col, columnClassName)}>
          <div className={s.colHead}>
            <Skeleton shape="line" size="sm" width="40" />
            <Skeleton shape="line" size="sm" width="15" />
          </div>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className={s.boardCard}>
              <Skeleton shape="line" size="md" width={(i + c) % 2 ? "60" : "75"} />
              <Skeleton shape="line" size="sm" width="90" />
              <Skeleton shape="line" size="xs" width="40" />
              <div className={s.boardFoot}>
                <Skeleton shape="pill" size="sm" />
                <Skeleton shape="pill" size="sm" width="pill-sm" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
