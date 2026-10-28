"use client";

import { useMemo } from "react";
import { LIST_SCHEMAS } from "@/lib/listSchemas";
import { LOCAL_SCHEMAS } from "@/lib/localListSchemas";
import { useSchemaList } from "@/lib/useSchemaList";
import { DataTable, FilterBar, ListFooter, SkeletonRegion, Stagger, StaggerItem, StatTile, StatusPill, useSkeleton, type Column, ErrorNotice, EmptyState } from "@/components/ui";
import CountUp from "@/components/motion/CountUp";
import { fmtDate, money, paymentsSource, type FinanceData, type FinanceMeta, type FinancePayment } from "./lawyerApi";
import { LawyerFinanceSkeleton } from "./LawyerSkeletons";
import { useLawyer } from "./LawyerContext";
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
  const lawyer = useLawyer();
  const sl = useSchemaList<FinancePayment>({
    schema: LIST_SCHEMAS.lawyerFinance,
    key: "lawyer-payments",
    source: paymentsSource,
    pageSize: 25,
    defaultSort: { key: "date", dir: "desc" },
    keyOf: (p) => p.id,
    viewer: lawyer.email,
  });
  const list = sl.list;
  const meta = list.meta as FinanceMeta;
  // FILTERS: the per-matter rollup comes with the first page; it is searched, sorted and paged here.
  const byMatterRows = useMemo(() => (list.initialLoading ? null : meta.byMatter ?? []), [list.initialLoading, meta.byMatter]);
  const ml = useSchemaList<MatterRow>({
    schema: LOCAL_SCHEMAS.lawyerFeesByMatter,
    key: "lawyer-fees-by-matter",
    rows: byMatterRows,
    pageSize: 10,
    defaultSort: { key: "pending", dir: "desc" },
    keyOf: (r) => r.key,
    viewer: lawyer.email,
  });

  const matterCols = useMemo<Column<MatterRow>[]>(() => {
    const cur = meta.currency || "USD";
    return [
      { key: "title", header: "Matter", render: (r) => <span className={s.strong}>{r.title}</span>, sortable: true, width: "wide" },
      { key: "clientName", header: "Member", render: (r) => r.clientName, sortable: true, hideOnMobile: true },
      { key: "paid", header: "Paid", render: (r) => money(r.paid, cur), sortable: true, align: "end" },
      { key: "pending", header: "Pending", render: (r) => money(r.pending, cur), sortable: true, align: "end" },
      { key: "nextPayoutAt", header: "Next payout", render: (r) => (r.nextPayoutAt ? fmtDate(r.nextPayoutAt) : "None scheduled"), sortable: true, hideOnMobile: true },
    ];
  }, [meta.currency]);

  const payCols = useMemo<Column<FinancePayment>[]>(() => {
    const cur = meta.currency || "USD";
    return [
      { key: "date", header: "Payout date", render: (p) => fmtDate(p.date), sortable: true },
      { key: "work", header: "Work", render: (p) => p.note ?? p.quoteTitle ?? "Legal fee", width: "wide" },
      { key: "clientName", header: "Member", render: (p) => p.clientName, hideOnMobile: true },
      { key: "matterTitle", header: "Matter", render: (p) => p.matterTitle ?? "General", hideOnMobile: true },
      { key: "paid", header: "Status", render: (p) => <StatusPill size="sm" tone={p.paid ? "success" : "warning"} label={p.paid ? "Paid" : "Pending"} /> },
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
            {byMatter.length > 5 && <FilterBar list={ml} noun="matters" searchLabel="Search matters" placeholder="Matter or member" views={false} />}
            <DataTable
              columns={matterCols}
              rows={ml.list.items}
              rowKey={(r) => r.key}
              caption="Your fees by matter"
              sort={ml.list.sort}
              onSortChange={ml.list.setSort}
              empty="No matter matches these filters."
            />
            <ListFooter list={ml.list} audience="lawyer" auto={false} endLabel={null} />
          </StaggerItem>
          <StaggerItem as="section" index={4} aria-labelledby="fin-payouts">
            <h2 id="fin-payouts" className={s.h}>Payouts</h2>
            <FilterBar list={sl} noun="payouts" searchLabel="Search payouts" placeholder="Member, matter or note" columns={payCols.map((c) => ({ key: c.key, header: c.header }))} />
            <DataTable
              columns={sl.visibleColumns(payCols)}
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
