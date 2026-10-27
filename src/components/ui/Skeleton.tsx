"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cx } from "./cx";
import { SKELETON_DELAY_MS, SKELETON_MIN_MS } from "./loadingTiming";
import s from "./Skeleton.module.scss";

export type SkeletonShape = "line" | "block" | "circle" | "pill";
export type SkeletonSize = "xs" | "sm" | "md" | "lg" | "xl" | "fill";
export type SkeletonWidth = "15" | "25" | "40" | "60" | "75" | "90" | "100" | "pill" | "pill-sm" | "pill-lg";

export interface SkeletonProps {
  shape?: SkeletonShape;
  /** Height step (line: text size, block: panel height, circle: diameter). */
  size?: SkeletonSize;
  /** Width as a percent of the parent, or a pill width. Circles ignore it. */
  width?: SkeletonWidth;
  className?: string;
}

/**
 * One placeholder shape. Always aria-hidden: the surrounding <SkeletonRegion>
 * (or <Loadable>) carries aria-busy and the "Loading …" status text.
 */
export function Skeleton({ shape = "line", size = "md", width, className }: SkeletonProps) {
  const w = shape === "circle" ? undefined : width ?? (shape === "pill" ? "pill" : "100");
  return <span aria-hidden="true" className={cx(s.sk, s[shape], s[size], w && s[`w-${w}`], className)} />;
}

// ── Delay / minimum-visible timing ─────────────────────────────────────────

/** When a visible skeleton region last unmounted, and since when it had been visible. */
let handoff = { at: 0, since: 0 };

export interface SkeletonPhase {
  /** Render the skeleton instead of content. */
  showSkeleton: boolean;
  /** The skeleton is past its grace delay and should be visible. */
  skeletonVisible: boolean;
}

/**
 * Debounces a loading flag for skeletons: nothing visible for the first
 * `delay` ms (fast responses never flash), and once visible the skeleton stays
 * at least `minVisible` ms. If another skeleton just left the screen (the
 * portal gate handing over to the page), this one shows at once and inherits
 * its timer, so the hand-off never blinks.
 */
export function useSkeleton(
  loading: boolean,
  { delay = SKELETON_DELAY_MS, minVisible = SKELETON_MIN_MS }: { delay?: number; minVisible?: number } = {},
): SkeletonPhase {
  const [shownAt, setShownAt] = useState<number | null>(() =>
    loading && typeof window !== "undefined" && Date.now() - handoff.at < 250 ? handoff.since : null,
  );

  useEffect(() => {
    if (loading) {
      if (shownAt !== null) return;
      const t = window.setTimeout(() => setShownAt(Date.now()), delay);
      return () => window.clearTimeout(t);
    }
    if (shownAt === null) return;
    const left = Math.max(0, minVisible - (Date.now() - shownAt));
    const t = window.setTimeout(() => setShownAt(null), left);
    return () => window.clearTimeout(t);
  }, [loading, shownAt, delay, minVisible]);

  return { showSkeleton: loading || shownAt !== null, skeletonVisible: shownAt !== null };
}

/** Back-compat name used in the brief: true once `flag` has been on for `delay` ms. */
export function useDelayedFlag(flag: boolean, delay = SKELETON_DELAY_MS): boolean {
  return useSkeleton(flag, { delay, minVisible: 0 }).skeletonVisible;
}

// ── Region and Loadable ────────────────────────────────────────────────────

export interface SkeletonRegionProps {
  /** Read to screen readers, e.g. "Loading your queue". */
  label?: string;
  /** False during the grace delay: space reserved, nothing painted. */
  visible?: boolean;
  /** The layout class of the real content, so the skeleton uses the same grid. */
  className?: string;
  as?: ElementType;
  children: ReactNode;
}

/** aria-busy wrapper around skeleton shapes, with a visually hidden status line. */
export function SkeletonRegion({ label = "Loading", visible = true, className, as: Tag = "div", children }: SkeletonRegionProps) {
  const since = useRef<number | null>(null);
  if (visible && since.current === null && typeof window !== "undefined") since.current = Date.now();

  useEffect(
    () => () => {
      if (since.current !== null) handoff = { at: Date.now(), since: since.current };
    },
    [],
  );

  return (
    <Tag className={cx(s.region, !visible && s.pending, className)} aria-busy="true">
      <span className={s.sr} role="status">
        {label}…
      </span>
      {children}
    </Tag>
  );
}

export interface LoadableProps {
  loading: boolean;
  /** Skeleton layout shown while loading (use the Skeleton* compositions). */
  skeleton: ReactNode;
  /** Screen-reader status, e.g. "Loading members". */
  label?: string;
  /** Layout class applied to the skeleton region (match the content's grid). */
  className?: string;
  delay?: number;
  minVisible?: number;
  /** Content. Pass a function when it reads data that is null while loading. */
  children: ReactNode | (() => ReactNode);
}

/**
 * Skeleton while loading (after the grace delay, for at least the minimum
 * time), then the content. Wrap the content in <Stagger> + <StaggerItem> for
 * the staggered reveal.
 */
export function Loadable({ loading, skeleton, label, className, delay, minVisible, children }: LoadableProps) {
  const { showSkeleton, skeletonVisible } = useSkeleton(loading, { delay, minVisible });
  if (showSkeleton) {
    return (
      <SkeletonRegion label={label} visible={skeletonVisible} className={className}>
        {skeleton}
      </SkeletonRegion>
    );
  }
  return <>{typeof children === "function" ? (children as () => ReactNode)() : children}</>;
}

export default Skeleton;
