"use client";

import { Skeleton, SkeletonCard, SkeletonText, SkeletonTimeline } from "@/components/ui";
import s from "./member.module.scss";

/** Profile left, timeline centre, next actions right: the member page frame. */
export default function MemberSkeleton() {
  return (
    <>
      <div className={s.skHead} aria-hidden="true">
        <Skeleton shape="line" size="xl" width="40" />
        <Skeleton shape="line" size="sm" width="25" />
      </div>
      <div className={s.layout} aria-hidden="true">
        <div className={s.col}>
          <div className={s.block}>
            <Skeleton shape="line" size="md" width="40" />
            <Skeleton shape="pill" size="xs" width="100" />
            <SkeletonText lines={6} size="sm" />
          </div>
          <SkeletonCard lines={3} badge className={s.skCard} />
        </div>
        <div className={s.col}>
          <div className={s.nextStep}>
            <Skeleton shape="line" size="xs" width="25" />
            <Skeleton shape="line" size="md" width="75" />
            <Skeleton shape="line" size="xs" width="40" />
          </div>
          <div className={s.block}>
            <Skeleton shape="line" size="md" width="25" />
            <div className={s.timelineFilter}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} shape="pill" size="lg" width={i % 2 ? "pill-sm" : "pill"} />
              ))}
            </div>
            <SkeletonTimeline items={5} />
          </div>
        </div>
        <div className={s.col}>
          <SkeletonCard lines={2} action className={s.skCard} />
          <SkeletonCard lines={3} className={s.skCard} />
          <SkeletonCard lines={1} className={s.skCard} />
        </div>
      </div>
    </>
  );
}
