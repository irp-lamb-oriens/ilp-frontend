"use client";

import { Skeleton, SkeletonTable } from "@/components/ui";
import TodaySkeleton from "../today/TodaySkeleton";
import MembersSkeleton from "../members/MembersSkeleton";
import MemberSkeleton from "../member/MemberSkeleton";
import { OpportunityBoardSkeleton, OpportunitySummarySkeleton } from "../opportunities/OpportunitiesSkeleton";
import { PageHeader } from "./PageHeader";

const TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard\/pipeline/, "Pipeline"],
  [/^\/dashboard\/lawyers/, "Lawyers"],
  [/^\/dashboard\/finance/, "Finance"],
  [/^\/dashboard\/reports/, "Reports"],
  [/^\/dashboard\/settings/, "Settings"],
  [/^\/dashboard\/privacy/, "Privacy"],
];

const sub = <Skeleton shape="line" size="sm" width="25" />;

/**
 * The page body the staff gate shows inside the shell while the session is
 * checked: the same skeleton the page itself shows, so the hand-off is seamless.
 */
export default function StaffRouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return (
      <>
        <PageHeader title="Today" sub={sub} />
        <TodaySkeleton />
      </>
    );
  }
  if (/^\/dashboard\/members\/[^/]+/.test(pathname)) return <MemberSkeleton />;
  if (pathname.startsWith("/dashboard/members")) {
    return (
      <>
        <PageHeader title="Members" sub={sub} />
        <MembersSkeleton />
      </>
    );
  }
  if (pathname.startsWith("/dashboard/opportunities")) {
    return (
      <>
        <PageHeader title="Opportunities" sub={sub} />
        <OpportunitySummarySkeleton />
        <OpportunityBoardSkeleton />
      </>
    );
  }
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? "ILP staff";
  return (
    <>
      <PageHeader title={title} sub={sub} />
      <SkeletonTable columns={5} rows={6} />
    </>
  );
}
