"use client";

import { Skeleton, SkeletonList, SkeletonStatStrip } from "@/components/ui";
import s from "./today.module.scss";

/** KPI strip (MRR large, four small) plus the GMV line under it. */
export function TodayKpisSkeleton() {
  return (
    <>
      <SkeletonStatStrip className={s.kpis} small={4} />
      <p className={s.gmv} aria-hidden="true">
        <Skeleton shape="line" size="sm" width="60" />
      </p>
    </>
  );
}

/** My queue rows: type pill, title and member, due pill. */
export function QueueSkeleton() {
  return <SkeletonList rows={5} lead="pill" trail="pill" lines={2} />;
}

/** Needs-attention groups: heading and two linked rows each. */
export function RailSkeleton() {
  return (
    <div className={s.railGroups} aria-hidden="true">
      {[0, 1, 2].map((g) => (
        <div key={g} className={s.railGroup}>
          <Skeleton shape="line" size="sm" width={g === 1 ? "75" : "60"} />
          <SkeletonList rows={2} lead={null} trail="pill" lines={2} variant="spaced" compact />
        </div>
      ))}
    </div>
  );
}

/** The whole Today page body (used by the staff gate before TodayView mounts). */
export default function TodaySkeleton() {
  return (
    <>
      <TodayKpisSkeleton />
      <div className={s.grid}>
        <section className={s.queue}>
          <div className={s.queueHead}>
            <h2 className={s.h2}>My queue</h2>
            <Skeleton shape="pill" size="lg" width="pill-lg" />
          </div>
          <QueueSkeleton />
        </section>
        <aside className={s.rail}>
          <h2 className={s.h2}>Needs attention</h2>
          <RailSkeleton />
        </aside>
      </div>
    </>
  );
}
