"use client";

import { Skeleton, SkeletonList, SkeletonStatStrip, SkeletonTable, SkeletonText } from "@/components/ui";
import { ScreenIntroSkeleton } from "../dashboard/staff/ScreenIntro";
import MemberSkeleton from "../dashboard/member/MemberSkeleton";
import s from "./csm.module.scss";

/** Today: count strip, then the queue beside the new-members and at-risk rails. */
export function TodaySkeleton() {
  return (
    <div className={s.page}>
      <SkeletonStatStrip small={3} />
      <div className={s.split}>
        <SkeletonList rows={6} variant="spaced" />
        <div className={s.stack}>
          <Skeleton shape="line" size="md" width="40" />
          <SkeletonList rows={3} />
          <Skeleton shape="line" size="md" width="40" />
          <SkeletonList rows={3} />
        </div>
      </div>
    </div>
  );
}

/** A list page: a filter row and a table. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={s.page}>
      <Skeleton shape="block" size="md" width="75" />
      <SkeletonTable rows={rows} columns={5} />
    </div>
  );
}

/** Grouped lists (risk, calls, messages). */
export function GroupsSkeleton({ groups = 3 }: { groups?: number }) {
  return (
    <div className={s.page}>
      {Array.from({ length: groups }, (_, i) => (
        <div key={i} className={s.stack}>
          <Skeleton shape="line" size="md" width="40" />
          <SkeletonList rows={3} />
        </div>
      ))}
    </div>
  );
}

/** KPIs: one large tile and smaller ones. */
export function KpisSkeleton() {
  return (
    <div className={s.page}>
      <SkeletonStatStrip small={3} />
      <SkeletonStatStrip small={3} large={false} />
      <SkeletonText lines={2} />
    </div>
  );
}

/** Playbooks: a list of checklists. */
export function PlaybooksSkeleton() {
  return (
    <div className={s.page}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={s.stack}>
          <Skeleton shape="line" size="lg" width="40" />
          <SkeletonText lines={4} />
        </div>
      ))}
    </div>
  );
}

/** The route skeleton: same shape as the page that is opening. */
export default function CsmRouteSkeleton({ pathname }: { pathname: string }) {
  const intro = <ScreenIntroSkeleton storageKey={pathname} />;
  if (/^\/csm\/book\/[^/]+/.test(pathname)) return <MemberSkeleton />;
  const body =
    pathname === "/csm" ? <TodaySkeleton /> :
    pathname.startsWith("/csm/kpis") ? <KpisSkeleton /> :
    pathname.startsWith("/csm/playbooks") ? <PlaybooksSkeleton /> :
    /^\/csm\/(risk|calls|messages)/.test(pathname) ? <GroupsSkeleton /> :
    <TableSkeleton />;
  return (
    <>
      {intro}
      {body}
    </>
  );
}
