"use client";

import type { ReactNode } from "react";
import { Skeleton, SkeletonStatStrip, SkeletonTable } from "@/components/ui";
import tabsCss from "@/components/ui/Tabs.module.scss";
import TodaySkeleton from "../today/TodaySkeleton";
import MembersSkeleton from "../members/MembersSkeleton";
import MemberSkeleton from "../member/MemberSkeleton";
import { OpportunityBoardSkeleton, OpportunitySummarySkeleton } from "../opportunities/OpportunitiesSkeleton";
import { FinanceChartsSkeleton } from "../AdminSkeletons";
import { PmfSkeleton } from "../pmf/PmfPanel";
import pmf from "../pmf/PmfPanel.module.scss";
import { StageConfigSkeleton } from "../views/SettingsView";
import views from "../views/views.module.scss";
import { PageHeader } from "./PageHeader";

const sub = <Skeleton shape="line" size="sm" width="25" />;

/** The Tabs strip (same frame as ui/Tabs) with `count` placeholder labels over `children`. */
function TabsSkeleton({ count, children }: { count: number; children: ReactNode }) {
  return (
    <div className={tabsCss.tabs}>
      <div className={tabsCss.list} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={tabsCss.tab}>
            <Skeleton shape="line" size="sm" width="pill-sm" />
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

const action = <Skeleton shape="block" size="sm" width="pill-lg" />;

/** A labeled select in a filter bar. */
const filterBar = (
  <div className={views.bar} aria-hidden="true">
    <div className={views.fieldSk}>
      <Skeleton shape="line" size="sm" width="25" />
      <Skeleton shape="block" size="sm" width="pill-lg" />
    </div>
  </div>
);

/**
 * The page body for a /dashboard route, shown by the staff gate while the
 * session is checked and by each route's loading.tsx while it opens: the same
 * skeleton the page itself shows, so the hand-off is seamless.
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
  if (pathname.startsWith("/dashboard/pipeline")) {
    return (
      <>
        <PageHeader title="Pipeline" sub={sub} actions={action} />
        <TabsSkeleton count={2}>
          <div>
            {filterBar}
            <SkeletonTable
              columns={[
                { header: "Matter", width: "wide" },
                { header: "Stage" },
                { header: "In stage" },
                { header: "Area", hideOnMobile: true },
                { header: "Next step", hideOnMobile: true },
                { header: "Lawyer", hideOnMobile: true },
              ]}
              rows={6}
            />
          </div>
        </TabsSkeleton>
      </>
    );
  }
  if (pathname.startsWith("/dashboard/lawyers")) {
    return (
      <>
        <PageHeader title="Lawyers" sub={sub} />
        <TabsSkeleton count={4}>
          <SkeletonTable
            columns={[
              { header: "Lawyer", width: "wide" },
              { header: "Areas", hideOnMobile: true },
              { header: "Open matters", align: "end" },
              { header: "14+ days in stage" },
              { header: "Calls next 7 days", align: "end" },
            ]}
            rows={5}
          />
        </TabsSkeleton>
      </>
    );
  }
  if (pathname.startsWith("/dashboard/finance")) {
    return (
      <>
        <PageHeader title="Finance" sub={sub} />
        <div className={views.stack}>
          <SkeletonStatStrip className={views.tiles} small={3} />
          <FinanceChartsSkeleton />
        </div>
      </>
    );
  }
  if (pathname.startsWith("/dashboard/reports")) {
    return (
      <>
        <PageHeader title="Reports" sub={sub} />
        <TabsSkeleton count={7}>
          <div className={pmf.wrap} aria-hidden="true">
            <PmfSkeleton />
          </div>
        </TabsSkeleton>
      </>
    );
  }
  if (pathname.startsWith("/dashboard/settings")) {
    return (
      <>
        <PageHeader title="Settings" sub={sub} />
        <TabsSkeleton count={3}>
          <StageConfigSkeleton />
        </TabsSkeleton>
      </>
    );
  }
  if (pathname.startsWith("/dashboard/privacy")) {
    return (
      <>
        <PageHeader title="Privacy requests" sub={sub} actions={action} />
        <SkeletonTable
          columns={[
            { header: "Member" },
            { header: "Request" },
            { header: "Status" },
            { header: "Received", hideOnMobile: true },
            { header: "Answer by" },
          ]}
          rows={5}
        />
      </>
    );
  }
  return (
    <>
      <PageHeader title="ILP staff" sub={sub} />
      <SkeletonTable columns={5} rows={6} />
    </>
  );
}
