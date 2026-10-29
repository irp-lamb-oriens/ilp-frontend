"use client";

import type { Kpi, KpisResponse } from "@/lib/csm";
import { SkeletonRegion, Stagger, StaggerItem, StatTile } from "@/components/ui";
import { ErrorText, PageHeader } from "../dashboard/staff/PageHeader";
import { KpisSkeleton } from "./CsmSkeletons";
import { useCsmData } from "./useCsmData";
import s from "./csm.module.scss";

function show(k: Kpi): string {
  if (k.value === null) return "No data yet";
  if (k.unit === "percent") return `${k.value}%`;
  if (k.unit === "hours") return `${k.value} h`;
  return String(k.value);
}

function hint(k: Kpi): string {
  if (k.target === undefined) return k.hint;
  return `${k.hint}. Target ${k.unit === "hours" ? `${k.target} h or less` : `${k.target}%`}.`;
}

/** My KPIs: how this book is doing on the habits that keep members. */
export default function CsmKpis() {
  const { data, error, reload, showSkeleton, skeletonVisible } = useCsmData<KpisResponse>("/api/csm/kpis");
  if (error) return <ErrorText onRetry={reload}>{error}</ErrorText>;
  if (showSkeleton || !data) return <SkeletonRegion label="Loading your figures" visible={skeletonVisible}><KpisSkeleton /></SkeletonRegion>;
  return (
    <Stagger>
      <PageHeader title="My KPIs" sub={`${data.bookSize} member${data.bookSize === 1 ? "" : "s"} in the book, ${data.atRisk} at risk.`} />
      <section className={s.counts} aria-label="First weeks" data-tour="csm-kpis">
        <StaggerItem index={0}>
          <StatTile size="lg" label="Time to first contact" value={show(data.timeToFirstContact)} hint={hint(data.timeToFirstContact)} upIsGood={false} />
        </StaggerItem>
        <StaggerItem index={1}>
          <StatTile label="First contact in one business day" value={show(data.firstContactInSla)} hint={hint(data.firstContactInSla)} />
        </StaggerItem>
        <StaggerItem index={2}>
          <StatTile label="Consultation-ready after 7 days" value={show(data.readyIn7Days)} hint={hint(data.readyIn7Days)} />
        </StaggerItem>
        <StaggerItem index={3}>
          <StatTile label="Handoff follow-ups on time" value={show(data.handoffSla)} hint={hint(data.handoffSla)} />
        </StaggerItem>
      </section>
      <section className={s.countsSmall} aria-label="Keeping members">
        <StaggerItem index={4}>
          <StatTile label="Book retention after 90 days" value={show(data.bookRetention)} hint={hint(data.bookRetention)} />
        </StaggerItem>
        <StaggerItem index={5}>
          <StatTile label="Tasks closed on time, 30 days" value={show(data.tasksOnTime)} hint={hint(data.tasksOnTime)} />
        </StaggerItem>
        <StaggerItem index={6}>
          <StatTile label="Contacts logged, 7 days" value={show(data.contacts7d)} hint={data.contacts7d.hint} />
        </StaggerItem>
      </section>
      <p className={s.meta}>Figures describe this book only. They are not compared with other CSMs.</p>
    </Stagger>
  );
}
