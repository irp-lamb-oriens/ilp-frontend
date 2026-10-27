import type { ReactNode } from "react";
import { cx } from "./cx";
import { Skeleton } from "./Skeleton";
import s from "./StatTile.module.scss";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  /** "lg" = the one headline figure in a KPI strip (e.g. MRR). */
  size?: "lg" | "sm";
  /** Change vs previous period, already formatted, e.g. "+US$79.99". */
  delta?: string;
  /** Direction of the delta; decides wording color, never color alone. */
  trend?: "up" | "down" | "flat";
  /** Whether "up" is good (MRR) or bad (churn). Default true. */
  upIsGood?: boolean;
  /** One line under the value, e.g. "target ≥ 80%". */
  hint?: ReactNode;
  className?: string;
}

/** KPI tile. Use one "lg" per strip and "sm" for the rest (asymmetric, not equal cards). */
export function StatTile({
  label,
  value,
  size = "sm",
  delta,
  trend = "flat",
  upIsGood = true,
  hint,
  className,
}: StatTileProps) {
  const good = trend === "flat" ? null : (trend === "up") === upIsGood;
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "";
  return (
    <div className={cx(s.tile, s[size], className)}>
      <span className={s.label}>{label}</span>
      <span className={s.value}>{value}</span>
      {(delta || hint) && (
        <span className={s.meta}>
          {delta && (
            <span className={cx(s.delta, good === true && s.good, good === false && s.bad)}>
              {arrow && <span aria-hidden="true">{arrow} </span>}
              {delta}
              <span className={s.sr}>
                {trend === "flat" ? " unchanged" : trend === "up" ? " increase" : " decrease"}
              </span>
            </span>
          )}
          {hint && <span className={s.hint}>{hint}</span>}
        </span>
      )}
    </div>
  );
}

/** StatTile placeholder with the same padding, border and line rhythm. */
export function SkeletonStatTile({ size = "sm", hint = true, className }: { size?: "lg" | "sm"; hint?: boolean; className?: string }) {
  return (
    <div className={cx(s.tile, s[size], className)} aria-hidden="true">
      <Skeleton shape="line" size="sm" width={size === "lg" ? "40" : "60"} />
      <Skeleton shape="line" size={size === "lg" ? "xl" : "lg"} width={size === "lg" ? "60" : "40"} />
      {hint && <Skeleton shape="line" size="xs" width={size === "lg" ? "40" : "75"} className={s.skHint} />}
    </div>
  );
}

export default StatTile;
