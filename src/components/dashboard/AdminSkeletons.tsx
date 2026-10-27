"use client";

import { Skeleton, SkeletonTable } from "@/components/ui";
import a from "./adminViews.module.scss";
import s from "./AdminSkeletons.module.scss";

/**
 * Placeholders for the R5.5 admin views (AdminViews.tsx): same list, chart
 * and table frames as the real views, so the swap does not move anything.
 * All aria-hidden; wrap them in <SkeletonRegion> / <Loadable>.
 */

/** Search field, then bordered rows (title and sub line, optional trailing status). */
export function AdminListSkeleton({ rows = 6, sub = true, trail = false, search = true }: { rows?: number; sub?: boolean; trail?: boolean; search?: boolean }) {
  return (
    <div className={a.listStack} aria-hidden="true">
      {search && <Skeleton shape="block" size="sm" />}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={a.listItem}>
          <span className={s.itemLines}>
            <Skeleton shape="line" size="md" width={i % 2 ? "40" : "25"} />
            {sub && <Skeleton shape="line" size="sm" width={i % 3 ? "60" : "40"} />}
          </span>
          {trail && <Skeleton shape="line" size="xs" width="15" />}
        </div>
      ))}
    </div>
  );
}

function ChartCard({ kind = "chart" }: { kind?: "chart" | "chartTall" | "chartRanked" | "donut" }) {
  return (
    <div className={a.financeCard}>
      <Skeleton shape="line" size="md" width="40" />
      {kind === "donut" ? (
        <>
          <div className={s.donut}>
            <Skeleton shape="circle" size="xl" />
          </div>
          <Skeleton shape="line" size="xs" width="40" />
        </>
      ) : (
        <div className={s[kind]}>
          <Skeleton shape="block" size="fill" />
        </div>
      )}
    </div>
  );
}

/** Quote finance: meta line, totals and win rate, by month, then four ranked charts. */
export function FinanceChartsSkeleton() {
  return (
    <div className={a.finance} aria-hidden="true">
      <div className={a.financeMeta}>
        <Skeleton shape="line" size="sm" width="pill-lg" />
        <Skeleton shape="line" size="sm" width="pill-lg" />
      </div>
      <div className={a.financeGrid}>
        <ChartCard kind="chartTall" />
        <ChartCard kind="donut" />
      </div>
      <ChartCard />
      <div className={a.financeGrid}>
        <ChartCard kind="chartRanked" />
        <ChartCard kind="chartRanked" />
      </div>
      <div className={a.financeGrid}>
        <ChartCard kind="chartRanked" />
        <ChartCard kind="chartRanked" />
      </div>
    </div>
  );
}

/** Sales report: search field and a plain table. */
export function SalesSkeleton() {
  return (
    <div className={a.listStack} aria-hidden="true">
      <Skeleton shape="block" size="sm" />
      <SkeletonTable columns={6} rows={8} />
    </div>
  );
}

/** Assignment queue: count and auto-assign bar, lawyers by score, unassigned clients. */
export function AssignmentSkeleton() {
  return (
    <div className={a.listStack} aria-hidden="true">
      <div className={a.assignmentBar}>
        <Skeleton shape="line" size="sm" width="pill-lg" />
        <Skeleton shape="block" size="sm" width="pill-lg" />
      </div>
      <Skeleton shape="line" size="md" width="25" />
      <AdminListSkeleton rows={3} search={false} />
      <Skeleton shape="line" size="md" width="25" />
      <div className={a.listStack}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={a.listItem}>
            <span className={s.itemLines}>
              <Skeleton shape="line" size="md" width="40" />
              <Skeleton shape="line" size="sm" width="60" />
            </span>
            <Skeleton shape="block" size="sm" width="pill-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
