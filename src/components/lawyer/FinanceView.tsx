"use client";

import { useEffect, useState } from "react";
import { Button, DataTable, EmptyState, StatTile, StatusPill, type Column } from "@/components/ui";
import { errorText, fmtDate, lawyerApi, money, type FinanceData, type FinancePayment } from "./lawyerApi";
import s from "./FinanceView.module.scss";

type MatterRow = FinanceData["byMatter"][number];

/** The lawyer's own fees only: paid, pending, per matter, payout dates. No margins, no platform costs. */
export default function FinanceView() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setData(await lawyerApi.finance());
    } catch (err) {
      setError(errorText(err, "Could not load your fees."));
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <EmptyState title="Fees did not load" body={error} action={<Button onClick={load}>Try again</Button>} />;
  if (!data) return <p className={s.muted} aria-busy="true">Loading your fees…</p>;

  const cur = data.currency || "USD";
  const nextPayout = data.payments.filter((p) => !p.paid && p.date).sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];

  const matterCols: Column<MatterRow>[] = [
    { key: "title", header: "Matter", render: (r) => <span className={s.strong}>{r.title}</span>, sortValue: (r) => r.title, width: "wide" },
    { key: "client", header: "Member", render: (r) => r.clientName, sortValue: (r) => r.clientName, hideOnMobile: true },
    { key: "paid", header: "Paid", render: (r) => money(r.paid, cur), sortValue: (r) => r.paid, align: "end" },
    { key: "pending", header: "Pending", render: (r) => money(r.pending, cur), sortValue: (r) => r.pending, align: "end" },
    { key: "next", header: "Next payout", render: (r) => fmtDate(r.nextPayoutAt), sortValue: (r) => r.nextPayoutAt ?? "9999", hideOnMobile: true },
  ];

  const payCols: Column<FinancePayment>[] = [
    { key: "date", header: "Payout date", render: (p) => fmtDate(p.date), sortValue: (p) => p.date ?? "" },
    { key: "work", header: "Work", render: (p) => p.note ?? p.quoteTitle ?? "Legal fee", sortValue: (p) => p.note ?? "", width: "wide" },
    { key: "client", header: "Member", render: (p) => p.clientName, sortValue: (p) => p.clientName, hideOnMobile: true },
    { key: "status", header: "Status", render: (p) => <StatusPill size="sm" tone={p.paid ? "success" : "warning"} label={p.paid ? "Paid" : "Pending"} />, sortValue: (p) => (p.paid ? 1 : 0) },
    { key: "amount", header: "Your fee", render: (p) => money(p.amount, cur), sortValue: (p) => p.amount, align: "end" },
  ];

  return (
    <div className={s.page}>
      <div className={s.tiles}>
        <StatTile size="lg" label="Paid to you" value={money(data.totals.paid, cur)} hint={`${data.payments.filter((p) => p.paid).length} payouts`} />
        <StatTile label="Pending" value={money(data.totals.pending, cur)} hint={`${data.payments.filter((p) => !p.paid).length} not yet paid`} />
        <StatTile label="Next payout" value={nextPayout ? fmtDate(nextPayout.date) : "None scheduled"} hint={nextPayout ? money(nextPayout.amount, cur) : undefined} />
      </div>

      {data.payments.length === 0 ? (
        <EmptyState title="No fees recorded yet" body="Fees appear here once a member accepts a quote you scoped." />
      ) : (
        <>
          <section aria-labelledby="fin-matters">
            <h2 id="fin-matters" className={s.h}>By matter</h2>
            <DataTable columns={matterCols} rows={data.byMatter} rowKey={(r) => r.key} caption="Your fees by matter" defaultSort={{ key: "pending", dir: "desc" }} />
          </section>
          <section aria-labelledby="fin-payouts">
            <h2 id="fin-payouts" className={s.h}>Payouts</h2>
            <DataTable columns={payCols} rows={data.payments} rowKey={(p) => p.id} caption="Your payouts" defaultSort={{ key: "date", dir: "desc" }} />
          </section>
        </>
      )}
      <p className={s.muted}>Amounts are your fees as agreed with ILP. Member pricing is not shown here.</p>
    </div>
  );
}
