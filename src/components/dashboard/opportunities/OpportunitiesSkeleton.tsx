"use client";

import { Skeleton, SkeletonBoard, SkeletonStatTile } from "@/components/ui";
import s from "./opportunities.module.scss";

/** Open pipeline (large), four small figures and the by-stage strip. */
export function OpportunitySummarySkeleton() {
  return (
    <div className={s.summary} aria-hidden="true">
      <SkeletonStatTile size="lg" />
      <div className={s.summarySmall}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonStatTile key={i} />
        ))}
      </div>
      <div className={s.byStage}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} shape="line" size="sm" width="pill" />
        ))}
      </div>
    </div>
  );
}

/** Five stage columns with cards, in the board's own grid. */
export function OpportunityBoardSkeleton() {
  return <SkeletonBoard className={s.board} columnClassName={s.column} cards={[3, 2, 2, 1, 1]} />;
}
