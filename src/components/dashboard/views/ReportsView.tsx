"use client";

import { useEffect, useState } from "react";
import { staffApi } from "@/lib/api";
import { Loadable, Skeleton, SkeletonStatStrip, Stagger, StaggerItem, StatTile, Tabs, type TabItem } from "@/components/ui";
import { SimpleBarChart, PALETTE } from "@/components/dashboard/charts";
import { SalesView } from "@/components/dashboard/AdminViews";
import PmfPanel from "@/components/dashboard/pmf/PmfPanel";
import { PageHeader, ErrorText, Muted } from "../staff/PageHeader";
import s from "./views.module.scss";

interface FunnelMetrics {
  qualifiedProfiles: number;
  templateDownloads: number;
  alertsDispatched: number;
  alertResponses: number;
  needsHelpRate: number;
  bookedConsultations: number;
  confirmedConsultations: number;
}

interface DashboardMetrics {
  pipeline: { stageCounts: Record<string, number>; stageLabels: Array<{ id: string; label: string }>; total: number };
  emailQueue: { pending: number; sent: number; dead: number; total: number };
  llmCosts: { totalCostUSD: number; totalCalls: number };
  sourceBreakdown: Record<string, number>;
  jurisdictionBreakdown: Record<string, number>;
  stageRatings: { perStage: Array<{ stage: string; label: string; average: number; count: number }> };
  activity: { calls: { total: number }; quotes: { total: number; accepted: number } };
}

/** The pre-W6 analytics tabs (funnel, satisfaction, activity, sources, jurisdictions) plus the sales report. */
export default function ReportsView() {
  const [funnel, setFunnel] = useState<FunnelMetrics | null>(null);
  const [dash, setDash] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      staffApi.get<FunnelMetrics>("/api/analytics/funnel"),
      staffApi.get<DashboardMetrics>("/api/dashboard/metrics"),
    ]).then(([f, d]) => {
      if (f.status === "fulfilled") setFunnel(f.value);
      if (d.status === "fulfilled") setDash(d.value);
      if (f.status === "rejected" && d.status === "rejected") setError("Reports could not be loaded.");
      setLoaded(true);
    });
  }, []);

  const chartSkeleton = (
    <div className={s.chartSk}>
      <Skeleton shape="block" size="fill" />
    </div>
  );
  const chart = (label: string, render: () => React.ReactNode) => (
    <Loadable loading={!loaded} label={`Loading ${label}`} skeleton={chartSkeleton}>
      {() => <StaggerItem>{render()}</StaggerItem>}
    </Loadable>
  );
  const tiles = (label: string, small: number, render: () => React.ReactNode) => (
    <Loadable loading={!loaded} label={`Loading ${label}`} skeleton={<SkeletonStatStrip className={s.tiles} small={small} />}>
      {() => <Stagger>{render()}</Stagger>}
    </Loadable>
  );

  const breakdown = (rec: Record<string, number> | undefined) =>
    Object.entries(rec ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));

  const tabs: TabItem[] = [
    { id: "pmf", label: "Member funnel", content: () => <PmfPanel /> },
    {
      id: "funnel",
      label: "Funnel",
      content: () =>
        tiles("the funnel", 4, () =>
          funnel ? (
            <div className={s.tiles}>
              <StaggerItem index={0} className={s.tileCell}>
                <StatTile size="lg" label="Booked consultations" value={funnel.bookedConsultations} hint={`${funnel.confirmedConsultations} confirmed`} />
              </StaggerItem>
              <StaggerItem index={1} className={s.tileCell}>
                <StatTile label="Qualified profiles" value={funnel.qualifiedProfiles} />
              </StaggerItem>
              <StaggerItem index={2} className={s.tileCell}>
                <StatTile label="Template downloads" value={funnel.templateDownloads} />
              </StaggerItem>
              <StaggerItem index={3} className={s.tileCell}>
                <StatTile label="Alerts sent" value={funnel.alertsDispatched} hint={`${funnel.alertResponses} responses`} />
              </StaggerItem>
              <StaggerItem index={4} className={s.tileCell}>
                <StatTile label="Needs-help rate" value={`${funnel.needsHelpRate.toFixed(1)}%`} />
              </StaggerItem>
            </div>
          ) : (
            <StaggerItem>
              <Muted>No funnel data.</Muted>
            </StaggerItem>
          ),
        ),
    },
    {
      id: "pipeline",
      label: "Pipeline",
      content: () =>
        chart("the pipeline chart", () => (
          <SimpleBarChart
            data={(dash?.pipeline.stageLabels ?? []).map((st) => ({ label: st.label, value: dash?.pipeline.stageCounts[st.id] ?? 0 }))}
            color={PALETTE.accent}
            emptyMessage="No clients in the pipeline yet."
          />
        )),
    },
    {
      id: "satisfaction",
      label: "Satisfaction",
      content: () =>
        chart("stage ratings", () => (
          <SimpleBarChart
            data={(dash?.stageRatings.perStage ?? []).map((r) => ({ label: r.label, value: r.count > 0 ? r.average : 0 }))}
            color={PALETTE.success}
            emptyMessage="No stage ratings yet."
            valueFormatter={(v) => `${v.toFixed(1)} of 5`}
          />
        )),
    },
    {
      id: "activity",
      label: "Activity",
      content: () =>
        tiles("activity", 3, () =>
          dash ? (
            <div className={s.tiles}>
              <StaggerItem index={0} className={s.tileCell}>
                <StatTile size="lg" label="Completed calls" value={dash.activity.calls.total} />
              </StaggerItem>
              <StaggerItem index={1} className={s.tileCell}>
                <StatTile label="Quotes" value={dash.activity.quotes.total} hint={`${dash.activity.quotes.accepted} accepted`} />
              </StaggerItem>
              <StaggerItem index={2} className={s.tileCell}>
                <StatTile label="AI calls" value={dash.llmCosts.totalCalls} hint={`US$${dash.llmCosts.totalCostUSD.toFixed(2)} cost`} />
              </StaggerItem>
              <StaggerItem index={3} className={s.tileCell}>
                <StatTile label="Emails pending" value={dash.emailQueue.pending} />
              </StaggerItem>
            </div>
          ) : (
            <StaggerItem>
              <Muted>No activity data.</Muted>
            </StaggerItem>
          ),
        ),
    },
    {
      id: "sources",
      label: "Sources",
      content: () => chart("sources", () => <SimpleBarChart data={breakdown(dash?.sourceBreakdown)} color={PALETTE.navy} emptyMessage="No sources yet." />),
    },
    {
      id: "jurisdictions",
      label: "Jurisdictions",
      content: () => chart("jurisdictions", () => <SimpleBarChart data={breakdown(dash?.jurisdictionBreakdown)} color={PALETTE.navy} emptyMessage="No jurisdictions yet." />),
    },
    { id: "sales", label: "Sales report", content: () => <SalesView /> },
  ];

  return (
    <>
      <PageHeader title="Reports" sub="Acquisition funnel, pipeline and the sales report. Membership KPIs are on Today." />
      {error && <ErrorText>{error}</ErrorText>}
      <Tabs tabs={tabs} label="Reports" />
    </>
  );
}
