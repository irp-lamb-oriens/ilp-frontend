"use client";

import { useMemo } from "react";
import { useStreamedList } from "@/lib/useStreamedList";
import { DataTable, ListFooter, ListToolbar, Select, SkeletonRegion, Stagger, StaggerItem, StatTile, StatusPill, useSkeleton, type Column, ErrorNotice, EmptyState } from "@/components/ui";
import CountUp from "@/components/motion/CountUp";
import { fmtDate, money, paymentsSource, type FinanceData, type FinanceMeta, type FinancePayment } from "./lawyerApi";
import { LawyerFinanceSkeleton } from "./LawyerSkeletons";
import s from "./FinanceView.module.scss";

type MatterRow = FinanceData["byMatter"][number];

/** Stable CountUp formatters per currency (the effect depends on the function). */
const FORMATTERS = new Map<string, (v: number) => string>();
function moneyFmt(cur: string): (v: number) => string {
  let f = FORMATTERS.get(cur);
  if (!f) {
    f = (v: number) => money(v, cur);
    FORMATTERS.set(cur, f);
  }
  return f;
}

/**
 * The lawyer's own fees only: paid, pending, per matter, payout dates. No
 * margins, no platform costs. Payouts page in from the server; totals and the
 * per-matter rollup come with the first page.
 */
export default function FinanceView() {
  const list = useStreamedList<FinancePayment>(paymentsSource, {
    key: "lawyer-payments",
    pageSize: 25,
    sort: { key: "date", dir: "desc" },
    keyOf: (p) => p.id,
  });
  const meta = list.meta as FinanceMeta;

  const matterCols = useMemo<Column<MatterRow>[]>(() => {
    const cur = meta.currency || "USD";
    return [
      { key: "title", header: "Matter", render: (r) => <span className={s.strong}>{r.title}</span>, sortValue: (r) => r.title, width: "wide" },
      { key: "client", header: "Member", render: (r) => r.clientName, sortValue: (r) => r.clientName, hideOnMobile: true },
      { key: "paid", header: "Paid", render: (r) => money(r.paid, cur), sortValue: (r) => r.paid, align: "end" },
      { key: "pending", header: "Pending", render: (r) => money(r.pending, cur), sortValue: (r) => r.pending, align: "end" },
      { key: "next", header: "Next payout", render: (r) => (r.nextPayoutAt ? fmtDate(r.nextPayoutAt) : "None scheduled"), sortValue: (r) => r.nextPayoutAt ?? "9999", hideOnMobile: true },
    ];
  }, [meta.currency]);

  const payCols = useMemo<Column<FinancePayment>[]>(() => {
    const cur = meta.currency || "USD";
    return [
      { key: "date", header: "Payout date", render: (p) => fmtDate(p.date), sortable: true },
      { key: "work", header: "Work", render: (p) => p.note ?? p.quoteTitle ?? "Legal fee", width: "wide" },
      { key: "client", header: "Member", render: (p) => p.clientName, hideOnMobile: true },
      { key: "status", header: "Status", render: (p) => <StatusPill size="sm" tone={p.paid ? "success" : "warning"} label={p.paid ? "Paid" : "Pending"} /> },
      { key: "amount", header: "Your fee", render: (p) => money(p.amount, cur), sortable: true, align: "end" },
    ];
  }, [meta.currency]);

  const { showSkeleton, skeletonVisible } = useSkeleton(list.initialLoading && !list.error);
  if (list.initialLoading && list.error) {
    return (
      <StaggerItem>
        <ErrorNotice audience="lawyer" variant="block" title="Fees did not load" onRetry={list.refresh}>{list.error}</ErrorNotice>
      </StaggerItem>
    );
  }
  if (showSkeleton || list.initialLoading || !meta.totals) {
    return (
      <SkeletonRegion label="Loading your fees" visible={skeletonVisible}>
        <LawyerFinanceSkeleton />
      </SkeletonRegion>
    );
  }

  const cur = meta.currency || "USD";
  const byMatter = meta.byMatter ?? [];
  const nextPayoutAt = byMatter.map((m) => m.nextPayoutAt).filter((d): d is string => !!d).sort()[0] ?? null;
  const nextPayoutAmount = nextPayoutAt ? byMatter.filter((m) => m.nextPayoutAt === nextPayoutAt).reduce((n, m) => n + m.pending, 0) : 0;
  const counts = meta.counts ?? { paid: 0, pending: 0 };
  const none = counts.paid + counts.pending === 0;

  return (
    <Stagger>
    <div className={s.page}>
      <div className={s.tiles} data-tour="lawyer-finance-totals">
        <StaggerItem index={0} className={s.tileCell}>
          <StatTile size="lg" label="Paid to you" value={<CountUp value={meta.totals.paid} formatter={moneyFmt(cur)} />} hint={`${counts.paid} payouts`} />
        </StaggerItem>
        <StaggerItem index={1} className={s.tileCell}>
          <StatTile label="Pending" value={<CountUp value={meta.totals.pending} formatter={moneyFmt(cur)} />} hint={`${counts.pending} not yet paid`} />
        </StaggerItem>
        <StaggerItem index={2} className={s.tileCell}>
          <StatTile label="Next payout" value={nextPayoutAt ? fmtDate(nextPayoutAt) : "None scheduled"} hint={nextPayoutAt ? money(nextPayoutAmount, cur) : undefined} />
        </StaggerItem>
      </div>

      {none ? (
        <StaggerItem index={3}>
          <EmptyState title="No fees recorded yet" body="Fees appear here once a member accepts a quote you scoped." />
        </StaggerItem>
      ) : (
        <>
          <StaggerItem as="section" index={3} aria-labelledby="fin-matters">
            <h2 id="fin-matters" className={s.h}>By matter</h2>
            <DataTable columns={matterCols} rows={byMatter} rowKey={(r) => r.key} caption="Your fees by matter" defaultSort={{ key: "pending", dir: "desc" }} />
          </StaggerItem>
          <StaggerItem as="section" index={4} aria-labelledby="fin-payouts">
            <h2 id="fin-payouts" className={s.h}>Payouts</h2>
            <ListToolbar list={list} noun="payouts" searchLabel="Search payouts" placeholder="Member, matter or note">
              <Select label="Status" value={list.filters.paid ?? ""} onChange={(e) => list.setFilter("paid", e.target.value)}>
                <option value="">Paid and pending</option>
                <option value="1">Paid</option>
                <option value="0">Pending</option>
              </Select>
            </ListToolbar>
            <DataTable
              columns={payCols}
              rows={list.items}
              rowKey={(p) => p.id}
              caption="Your payouts"
              loadingMore={list.loadingMore}
              stale={list.stale}
              sort={list.sort}
              onSortChange={list.setSort}
              empty="No payout matches these filters."
            />
            <ListFooter list={list} audience="lawyer" />
          </StaggerItem>
        </>
      )}
      <p className={s.muted}>Amounts are your fees as agreed with ILP. Member pricing is not shown here.</p>
    </div>
    </Stagger>
  );
}
