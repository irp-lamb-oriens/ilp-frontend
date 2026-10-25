"use client";

import { type ReactNode } from "react";
import s from "./emptyState.module.scss";

/**
 * Ghost presentational primitives for placeholder / example markup. Each
 * renders a dashed, muted silhouette of the real control it previews, so an
 * empty tab shows what will appear without pretending to hold data.
 */

export function GhostLine({
  width = "100%",
  height = 10,
}: {
  width?: number | string;
  height?: number;
}) {
  return <span className={s.ghostLine} style={{ width, height }} aria-hidden="true" />;
}

export function GhostBadge({ children }: { children?: ReactNode }) {
  return <span className={s.ghostBadge} aria-hidden="true">{children}</span>;
}

export function GhostField({
  label,
  width = "100%",
}: {
  label: string;
  width?: number | string;
}) {
  return (
    <div className={s.ghostField}>
      <span className={s.ghostFieldLabel}>{label}</span>
      <GhostLine width={width} height={12} />
    </div>
  );
}