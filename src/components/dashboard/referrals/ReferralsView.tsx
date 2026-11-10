"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  BRAND_LABEL,
  BRANDS,
  type Brand,
  money,
  monthShort,
  PARTNER_TYPE_LABEL,
  type PartnerRow,
  refStaff,
  type YearReport,
} from "@/lib/referral";
import { Button, DataTable, Select, SkeletonStatStrip, StatTile, StatusPill, Tabs, Toast, type Column, type StatusTone } from "@/components/ui";
import { SimpleBarChart } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/dashboard/staff/PageHeader";
import { useStaff } from "@/components/dashboard/staff/StaffSession";
import NewPartnerDialog from "./NewPartnerDialog";
import PartnerDrawer from "./PartnerDrawer";
import PayoutsPanel from "./PayoutsPanel";
import RulesPanel from "./RulesPanel";
import ToolsPanel from "./ToolsPanel";
import s from "./referrals.module.scss";

export const STATUS_TONE: Record<PartnerRow["status"], StatusTone> = { invited: "info", active: "success", paused: "warning", closed: "neutral" };
export const STATUS_LABEL: Record<PartnerRow["status"], string> = { invited: "Invited", active: "Active", paused: "Paused", closed: "Closed" };

export function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 403) return "Only an admin can do this.";
    return e.message;
  }
  if (e instanceof Error && e.message) return e.message;
  return "Could not reach the server. Try again.";
}

/**
 * REFERRALS: the partner program on one screen. Year figures on top, then
 * Partners (open one for its links, totals and payments), Payouts, Rules and
 * Tools (record a sale, assign a customer, refunds, import past payments).
 */
export default function ReferralsView() {
  const { isAdmin } = useStaff();
  const thisYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(thisYear);
  const [brand, setBrand] = useState<Brand | "">("");
  const [report, setReport] = useState<YearReport | null>(null);
  const [partners, setPartners] = useState<PartnerRow[] | null>(null);
  const [toPay, setToPay] = useState<{ readyCount: number; readyCents: number; heldCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState("partners");

  const load = useCallback(async () => {
    try {
      const r = await refStaff.overview(year, brand);
      setReport(r.report);
      setPartners(r.partners);
      setToPay(r.payouts);
      setError(null);
    } catch (e) {
      setError(errorText(e));
    }
  }, [year, brand]);

  useEffect(() => {
    load();
  }, [load]);

  const t = report?.totals;
  const years = report?.years?.length ? report.years : [thisYear];

  const columns: Column<PartnerRow>[] = useMemo(() => [
    {
      key: "name",
      header: "Partner",
      width: "wide",
      sortValue: (r) => r.name.toLowerCase(),
      render: (r) => (
        <span>
          <strong>{r.name}</strong>
          <br />
          <span className={s.muted}>{PARTNER_TYPE_LABEL[r.type]} · {r.brands.map((b) => BRAND_LABEL[b]).join(", ")}</span>
        </span>
      ),
    },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <StatusPill label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} size="sm" /> },
    { key: "clicks", header: "Clicks", align: "end", hideOnMobile: true, sortValue: (r) => r.clicks, render: (r) => r.clicks.toLocaleString("en-US") },
    { key: "leads", header: "People", align: "end", sortValue: (r) => r.leads, render: (r) => r.leads.toLocaleString("en-US") },
    { key: "customers", header: "Customers", align: "end", sortValue: (r) => r.customers, render: (r) => r.customers.toLocaleString("en-US") },
    { key: "earned", header: "Earned", align: "end", sortValue: (r) => r.earnedCents, render: (r) => money(r.earnedCents) },
    { key: "paid", header: "Paid", align: "end", sortValue: (r) => r.paidCents, render: (r) => money(r.paidCents) },
    {
      key: "owed",
      header: "To pay",
      align: "end",
      sortValue: (r) => r.approvedCents,
      render: (r) => (
        <span>
          {money(r.approvedCents)}
          {!r.hasPayout && r.approvedCents > 0 ? <><br /><span className={s.muted}>No bank details</span></> : null}
        </span>
      ),
    },
  ], []);

  const tabs = [
    {
      id: "partners",
      label: "Partners",
      count: partners?.length,
      content: (
        <DataTable
          caption="Partners"
          columns={columns}
          rows={partners ?? []}
          rowKey={(r) => r.id}
          loading={!partners && !error}
          onRowActivate={(r) => setOpenId(r.id)}
          selectedKey={openId}
          defaultSort={{ key: "earned", dir: "desc" }}
          empty={<p className={s.muted}>No partners yet. Add the first one with New partner.</p>}
        />
      ),
    },
    { id: "payouts", label: "Payouts", count: toPay?.readyCount || undefined, content: () => <PayoutsPanel isAdmin={isAdmin} onChange={load} onOpenPartner={setOpenId} /> },
    { id: "rules", label: "Commission rules", content: () => <RulesPanel isAdmin={isAdmin} /> },
    { id: "tools", label: "Record and import", content: () => <ToolsPanel isAdmin={isAdmin} partners={partners ?? []} onChange={load} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Partners"
        sub="Links for influencers, media, experts and teachers. Who they brought, what they earned and what we have sent them."
        actions={<Button onClick={() => setCreating(true)}>New partner</Button>}
      />
      {error && <p className={s.error} role="alert">{error}</p>}

      <div className={s.filters}>
        <Select label="Year" value={String(year)} onChange={(e) => setYear(Number(e.target.value))} options={years.map((y) => ({ value: String(y), label: String(y) }))} />
        <Select
          label="Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value as Brand | "")}
          options={[{ value: "", label: "All brands" }, ...BRANDS.map((b) => ({ value: b, label: BRAND_LABEL[b] }))]}
        />
      </div>

      {!t ? (
        <SkeletonStatStrip />
      ) : (
        <div className={s.kpis}>
          <StatTile size="lg" label={`Sent to partners in ${year}`} value={money(t.paidCents)} hint={`${money(t.earnedCents)} earned this year, ${money(t.reversedCents)} cancelled by refunds`} />
          <div className={s.kpiSmall}>
            <StatTile size="sm" label="People brought" value={t.leads.toLocaleString("en-US")} />
            <StatTile size="sm" label="Became customers" value={t.customers.toLocaleString("en-US")} hint={t.leads ? `${Math.round((t.customers / t.leads) * 100)}% of people` : undefined} />
            <StatTile size="sm" label="Earned, not paid" value={money(t.pendingCents)} />
            <StatTile size="sm" label="Ready to pay now" value={money(toPay?.readyCents ?? 0)} hint={toPay ? `${toPay.readyCount} partner(s); ${toPay.heldCount} on hold` : undefined} />
          </div>
        </div>
      )}

      {report && (
        <div className={s.chart}>
          <SimpleBarChart
            data={report.months.map((m) => ({ label: monthShort(m.month), value: m.earnedCents / 100 }))}
            valueFormatter={(v) => money(Math.round(v * 100))}
            emptyMessage="No commissions this year yet."
          />
          <p className={s.muted}>Commission earned per month in {year}{brand ? ` on ${BRAND_LABEL[brand]}` : ""}.</p>
        </div>
      )}

      <Tabs label="Partner program" tabs={tabs} value={tab} onChange={setTab} />

      <NewPartnerDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id, msg) => {
          setCreating(false);
          setToast(msg);
          load();
          setOpenId(id);
        }}
      />
      <PartnerDrawer id={openId} isAdmin={isAdmin} onClose={() => setOpenId(null)} onChange={load} />
      <Toast message={toast} tone="success" onDismiss={() => setToast(null)} />
    </div>
  );
}
