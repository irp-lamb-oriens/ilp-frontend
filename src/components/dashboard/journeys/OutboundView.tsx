"use client";

import { useMemo } from "react";
import type { OutboundRow } from "@/lib/contracts";
import { formatCentsPlain, DataTable, SkeletonStatStrip, SkeletonTable, StatTile, type Column, useSkeleton } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { getOutbound } from "./journeysApi";
import { CHANNEL_LABEL, SampleNotice } from "./JourneysFrame";
import { count, pct } from "./model";
import { useJourneyData, useJourneyFilters } from "./useJourneys";
import s from "./journeys.module.scss";

const rate = (a: number, b: number) => (a > 0 ? b / a : null);
const money = (cents: number) => `US$${formatCentsPlain(cents)}`;

function cell(n: number, of: number, show: boolean) {
  return show ? `${count(n)} (${pct(rate(of, n))})` : count(n);
}

/**
 * Outbound: each campaign from the first contact to paying members. Opens
 * and clicks exist only for emails; imported leads and CSM calls start at
 * the free check.
 */
export default function OutboundView() {
  const { query, queryKey } = useJourneyFilters();
  const out = useJourneyData(() => getOutbound(query), queryKey);
  const sk = useSkeleton(out.loading && !out.data);
  const rows = useMemo(() => out.data?.rows ?? [], [out.data]);
  const total = useMemo(
    () => rows.reduce((t, r) => ({ sent: t.sent + r.sent, members: t.members + r.activationPaid, revenue: t.revenue + r.revenueCents, checks: t.checks + r.checkStarted }), { sent: 0, members: 0, revenue: 0, checks: 0 }),
    [rows],
  );

  const columns = useMemo<Column<OutboundRow>[]>(
    () => [
      { key: "campaign", header: "Campaign", width: "wide", render: (r) => <span className={s.who}>{r.campaign}<span className={s.whoSub}>{CHANNEL_LABEL[r.channel] ?? r.channel}</span></span>, sortValue: (r) => r.campaign },
      { key: "sent", header: "Contacted", align: "end", render: (r) => count(r.sent), sortValue: (r) => r.sent },
      { key: "opened", header: "Opened", align: "end", render: (r) => (r.channel === "email_outreach" ? cell(r.opened, r.sent, true) : "Not tracked"), sortValue: (r) => r.opened, hideOnMobile: true },
      { key: "clicked", header: "Clicked", align: "end", render: (r) => (r.channel === "email_outreach" ? cell(r.clicked, r.opened, true) : "Not tracked"), sortValue: (r) => r.clicked, hideOnMobile: true },
      { key: "check", header: "Started check", align: "end", render: (r) => cell(r.checkStarted, r.sent, true), sortValue: (r) => r.checkStarted },
      { key: "account", header: "Free account", align: "end", render: (r) => cell(r.accountCreated, r.checkStarted, true), sortValue: (r) => r.accountCreated, hideOnMobile: true },
      { key: "member", header: "Members", align: "end", render: (r) => cell(r.activationPaid, r.sent, true), sortValue: (r) => r.activationPaid },
      { key: "revenue", header: "Revenue", align: "end", render: (r) => money(r.revenueCents), sortValue: (r) => r.revenueCents },
    ],
    [],
  );

  if (out.error && !out.data) return <ErrorText onRetry={out.retry}>Outbound campaigns could not be loaded. {out.error}</ErrorText>;
  if (sk.showSkeleton || !out.data)
    return sk.skeletonVisible ? (
      <div className={s.stack} aria-hidden="true">
        <SkeletonStatStrip small={3} />
        <SkeletonTable columns={[{ header: "Campaign", width: "wide" }, { header: "Contacted", align: "end" }, { header: "Started check", align: "end" }, { header: "Members", align: "end" }, { header: "Revenue", align: "end" }]} rows={5} />
      </div>
    ) : null;

  return (
    <div className={s.stack}>
      <SampleNotice show={out.sample} />
      <div className={s.kpis}>
        <StatTile size="lg" label="Revenue from outbound" value={money(total.revenue)} hint="Activation fees and first months of the members these campaigns brought in." />
        <StatTile label="People contacted" value={count(total.sent)} />
        <StatTile label="Started the check" value={pct(rate(total.sent, total.checks))} hint={`${count(total.checks)} people`} />
        <StatTile label="Became members" value={pct(rate(total.sent, total.members))} hint={`${count(total.members)} of ${count(total.sent)}`} />
        <StatTile label="Revenue per contact" value={total.sent ? money(Math.round(total.revenue / total.sent)) : "None"} />
      </div>
      <section aria-labelledby="o-table">
        <h2 className={s.panelHead} id="o-table">Campaigns</h2>
        <p className={s.panelSub}>Each rate is out of the column before it, except Started check and Members, which are out of everyone contacted.</p>
        <DataTable caption="Outbound campaigns" columns={columns} rows={rows} rowKey={(r) => `${r.channel}:${r.campaign}`} defaultSort={{ key: "revenue", dir: "desc" }} empty="No outbound campaigns in this range." />
      </section>
    </div>
  );
}
