"use client";

import { Skeleton, SkeletonBoard, SkeletonCard, SkeletonList, SkeletonStatStrip, SkeletonTable, SkeletonText } from "@/components/ui";
import today from "./TodayView.module.scss";
import board from "./BoardView.module.scss";
import clients from "./ClientsView.module.scss";
import finance from "./FinanceView.module.scss";
import avail from "./AvailabilityView.module.scss";
import call from "./CallView.module.scss";

/** Today's call rows: time, member and matter, consent and summary pills. */
export function CallsSkeleton({ rows = 4 }: { rows?: number }) {
  return <SkeletonList rows={rows} lead="time" trail="pills" lines={2} variant="spaced" />;
}

/** "Next 3 days" rail rows: when, member, matter. */
export function UpcomingSkeleton() {
  return <SkeletonList rows={3} lead={null} trail={null} lines={3} variant="plain" compact />;
}

/** Lawyer Today, header included (used by the gate before TodayView mounts). */
export function LawyerTodaySkeleton() {
  return (
    <div className={today.page}>
      <section className={today.main}>
        <header className={today.head}>
          <Skeleton shape="line" size="lg" width="40" />
          <Skeleton shape="line" size="sm" width="25" />
          <Skeleton shape="line" size="sm" width="40" />
        </header>
        <CallsSkeleton />
      </section>
      <aside className={today.rail}>
        <h3 className={today.railH}>Next 3 days</h3>
        <UpcomingSkeleton />
      </aside>
    </div>
  );
}

/** Stage columns with cards, in the board's own grid. */
export function BoardColumnsSkeleton() {
  return <SkeletonBoard className={board.board} columnClassName={board.col} cards={[3, 2, 2, 1]} />;
}

/** Toolbar plus columns (gate). */
export function LawyerBoardSkeleton() {
  return (
    <div className={board.page}>
      <div className={board.toolbar} aria-hidden="true">
        <Skeleton shape="pill" size="lg" width="pill-lg" />
        <Skeleton shape="block" size="sm" width="25" />
      </div>
      <BoardColumnsSkeleton />
    </div>
  );
}

export const CLIENT_SKELETON_COLUMNS = [
  { header: "Member" },
  { header: "Matter", width: "wide" as const },
  { header: "Area", hideOnMobile: true },
  { header: "Stage" },
  { header: "Deadlines", hideOnMobile: true },
  { header: "Next call" },
];

/** Search bar and the members table (gate). */
export function LawyerClientsSkeleton() {
  return (
    <div className={clients.page}>
      <div className={clients.bar} aria-hidden="true">
        <Skeleton shape="block" size="sm" width="60" />
      </div>
      <SkeletonTable columns={CLIENT_SKELETON_COLUMNS} rows={6} />
    </div>
  );
}

/** Paid (large), pending, next payout, then the by-matter table. */
export function LawyerFinanceSkeleton() {
  return (
    <div className={finance.page}>
      <SkeletonStatStrip className={finance.tiles} small={2} />
      <div aria-hidden="true">
        <Skeleton shape="line" size="lg" width="25" />
        <SkeletonTable columns={[{ header: "Matter", width: "wide" }, { header: "Member", hideOnMobile: true }, { header: "Paid", align: "end" }, { header: "Pending", align: "end" }, { header: "Next payout", hideOnMobile: true }]} rows={4} />
      </div>
    </div>
  );
}

/** Weekly hours (seven day rows) beside days off, limits and specialties. */
export function LawyerAvailabilitySkeleton() {
  return (
    <div className={avail.page}>
      <header className={avail.head} aria-hidden="true">
        <Skeleton shape="line" size="lg" width="40" />
        <Skeleton shape="line" size="sm" width="75" />
      </header>
      <div className={avail.cols} aria-hidden="true">
        <section className={avail.week}>
          <Skeleton shape="line" size="md" width="25" />
          <Skeleton shape="line" size="sm" width="40" />
          <div className={avail.days}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <div key={d} className={avail.day}>
                <Skeleton shape="line" size="md" width="75" />
                <Skeleton shape="block" size="sm" width={d > 4 ? "40" : "90"} />
              </div>
            ))}
          </div>
        </section>
        <div className={avail.side}>
          {[0, 1, 2].map((b) => (
            <section key={b} className={avail.block}>
              <Skeleton shape="line" size="md" width="40" />
              <SkeletonText lines={2} size="sm" />
              <Skeleton shape="block" size="sm" />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One call: the one-screen brief on the left, the call flow on the right. */
export function LawyerCallSkeleton() {
  return (
    <div className={call.page}>
      <div className={call.crumbs} aria-hidden="true">
        <Skeleton shape="line" size="sm" width="pill" />
      </div>
      <div className={call.cols}>
        <div className={call.briefCol}>
          <SkeletonCard badge lines={2}>
            <SkeletonText lines={5} size="sm" />
          </SkeletonCard>
          <SkeletonCard lines={2} />
        </div>
        <div className={call.callCol}>
          <SkeletonCard badge lines={3} action />
        </div>
      </div>
    </div>
  );
}

/** Gate: the skeleton of the lawyer page being opened. */
export default function LawyerRouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/lawyer/board")) return <LawyerBoardSkeleton />;
  if (pathname.startsWith("/lawyer/clients")) return <LawyerClientsSkeleton />;
  if (pathname.startsWith("/lawyer/finance")) return <LawyerFinanceSkeleton />;
  if (pathname.startsWith("/lawyer/availability")) return <LawyerAvailabilitySkeleton />;
  if (pathname.startsWith("/lawyer/calls/")) return <LawyerCallSkeleton />;
  return <LawyerTodaySkeleton />;
}
