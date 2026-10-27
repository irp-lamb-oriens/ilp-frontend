"use client";

import { useEffect, useState } from "react";
import { staffApi } from "@/lib/api";
import { Loadable, SkeletonStatStrip, StatTile } from "@/components/ui";
import { FinanceView } from "@/components/dashboard/AdminViews";
import { PageHeader } from "../staff/PageHeader";
import { usd } from "../staff/format";
import type { StaffSummary } from "../staff/types";
import s from "./views.module.scss";

/** Platform revenue and legal fees side by side, never summed; then the quote finance charts. */
export default function FinanceHome() {
  const [k, setK] = useState<StaffSummary["kpis"] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    staffApi
      .get<StaffSummary>("/api/dashboard/staff/summary")
      .then((r) => setK(r.kpis))
      .catch(() => setFailed(true));
  }, []);

  return (
    <>
      <PageHeader title="Finance" sub="Membership revenue is ILP's. Legal fees (GMV) belong to the work lawyers do and are reported apart." />
      <div className={s.stack}>
        <Loadable loading={!k && !failed} label="Loading revenue figures" skeleton={<SkeletonStatStrip className={s.tiles} small={3} />}>
        {() => k && (
          <div className={s.tiles} data-tour="staff-finance-kpis">
            <StatTile size="lg" label="MRR" value={usd(k.mrr.cents)} hint={`${k.mrr.activeMembers} active members × US$79.99`} />
            <StatTile label="ARR run rate" value={usd(k.mrr.cents * 12, true)} />
            <StatTile label="Membership revenue, 30 days" value={usd(k.platformRevenue30d.cents, true)} hint="Activation and monthly fees paid" />
            <StatTile label="Legal fees (GMV), 30 days" value={usd(k.legalGmv30d.cents, true)} hint={`${k.legalGmv30d.quotes} accepted quote${k.legalGmv30d.quotes === 1 ? "" : "s"}; not platform revenue`} />
          </div>
        )}
        </Loadable>
        <FinanceView />
      </div>
    </>
  );
}
