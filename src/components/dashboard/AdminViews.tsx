"use client";

import { useEffect, useState } from "react";
import { dashboardFetch } from "@/lib/api";
import { AdminsOnlyNotice, isRoleDenied } from "./staff/StaffSession";
import { usePaginatedSearch } from "@/lib/usePaginatedSearch";
import { SearchInput, Pagination } from "./ListControls";
import {
  RankedBarChart,
  DonutChart,
  TrendChart,
  GroupedBarChart,
  PALETTE,
} from "@/components/dashboard/charts";
import styles from "./adminViews.module.scss";
import { ErrorNotice, Notice, Select, SkeletonRegion, useSkeleton } from "@/components/ui";
import { AdminListSkeleton, AssignmentSkeleton, FinanceChartsSkeleton, SalesSkeleton } from "./AdminSkeletons";

interface Provider {
  id: string;
  name?: string | null;
  email?: string | null;
  legalAreas?: string[];
  jurisdictions?: string[];
  [key: string]: unknown;
}

interface Vendor {
  id: string;
  name?: string | null;
  active?: boolean;
  [key: string]: unknown;
}

/**
 * R5.5 admin views (providers, vendors, finance metrics, sales report,
 * assignment). Each is mounted on its own /dashboard route by W6; they fetch
 * only when their route or tab is first opened.
 */
export function ProvidersList() {
  const [rows, setRows] = useState<Provider[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardFetch<{ providers: Provider[] }>("/api/dashboard/providers")
      .then((r) => setRows(r.providers ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load providers."));
  }, []);

  const { query, setQuery, page, setPage, pageItems, total, totalPages } =
    usePaginatedSearch<Provider>(rows ?? [], {
      searchKeys: ["name", "email", "legalAreas", "jurisdictions"],
      pageSize: 20,
    });

  const sk = useSkeleton(rows === null && !error);
  if (error) return <ErrorNotice audience="staff" title="This section did not load">{error}</ErrorNotice>;
  if (sk.showSkeleton || rows === null) {
    return (
      <SkeletonRegion label="Loading providers" visible={sk.skeletonVisible}>
        <AdminListSkeleton />
      </SkeletonRegion>
    );
  }
  if (rows.length === 0) return <p className={styles.muted}>No providers yet.</p>;

  return (
    <div className={styles.listStack}>
      <SearchInput value={query} onChange={setQuery} placeholder="Search providers…" resultCount={total} />
      {pageItems.map((p) => (
        <div key={p.id} className={styles.listItem}>
          <div>
            <div className={styles.itemTitle}>{p.name ?? p.id}</div>
            <div className={styles.itemSub}>
              {[p.email, (p.legalAreas ?? []).join(", "), (p.jurisdictions ?? []).join(", ")].filter(Boolean).join(" · ") || "No contact details yet"}
            </div>
          </div>
        </div>
      ))}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export function VendorsList() {
  const [rows, setRows] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardFetch<{ vendors: Vendor[] }>("/api/vendors")
      .then((r) => setRows(r.vendors ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load vendors."));
  }, []);

  const { query, setQuery, page, setPage, pageItems, total, totalPages } =
    usePaginatedSearch<Vendor>(rows ?? [], {
      searchKeys: ["name", "id"],
      pageSize: 20,
    });

  const sk = useSkeleton(rows === null && !error);
  if (error) return <ErrorNotice audience="staff" title="This section did not load">{error}</ErrorNotice>;
  if (sk.showSkeleton || rows === null) {
    return (
      <SkeletonRegion label="Loading vendors" visible={sk.skeletonVisible}>
        <AdminListSkeleton sub={false} trail />
      </SkeletonRegion>
    );
  }
  if (rows.length === 0) return <p className={styles.muted}>No vendors yet.</p>;

  return (
    <div className={styles.listStack}>
      <SearchInput value={query} onChange={setQuery} placeholder="Search vendors…" resultCount={total} />
      {pageItems.map((v) => (
        <div key={v.id} className={styles.listItem}>
          <span className={styles.itemTitle}>{v.name ?? v.id}</span>
          <span className={v.active === false ? styles.itemInactive : styles.itemActive}>
            {v.active === false ? "Inactive" : "Active"}
          </span>
        </div>
      ))}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

interface MoneyStats {
  n: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPct: number | null;
  avgDealSize: number | null;
}

interface FinanceBucket extends MoneyStats {
  key: string;
  label: string;
}

interface FinanceMetrics {
  baseCurrency: string;
  generatedAt: string;
  totals: {
    won: MoneyStats;
    openPipeline: MoneyStats;
    draft: MoneyStats;
    all: MoneyStats;
  };
  winRate: { sentOrBeyond: number; won: number; pct: number | null };
  cycleDays: { n: number; median: number | null };
  byMonth: Array<FinanceBucket & { month: string }>;
  byRoute: FinanceBucket[];
  byService: FinanceBucket[];
  byProvider: FinanceBucket[];
  byStage: FinanceBucket[];
  skipped: {
    currency: number;
    zeroTotal: number;
    exclusiveAlternates: number;
    currencies: Record<string, number>;
  };
  marginUnknown: number;
  quotesRead: number;
  clientsRead: number;
}

const money = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);

export function FinanceView() {
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    dashboardFetch<FinanceMetrics>("/api/dashboard/finance/metrics")
      .then(setMetrics)
      .catch((e) => {
        if (isRoleDenied(e)) setDenied(true);
        else setError(e instanceof Error ? e.message : "Failed to load finance metrics.");
      });
  }, []);

  const sk = useSkeleton(metrics === null && !error && !denied);
  if (denied) return <AdminsOnlyNotice what="Quote finance" />;
  if (error) return <ErrorNotice audience="staff" title="This section did not load">{error}</ErrorNotice>;
  if (sk.showSkeleton || metrics === null) {
    return (
      <SkeletonRegion label="Loading quote finance" visible={sk.skeletonVisible}>
        <FinanceChartsSkeleton />
      </SkeletonRegion>
    );
  }

  const totals = metrics.totals;

  const totalsData = [
    { label: "Won", revenue: totals.won.revenue, cost: totals.won.cost, margin: totals.won.margin },
    { label: "Open", revenue: totals.openPipeline.revenue, cost: totals.openPipeline.cost, margin: totals.openPipeline.margin },
    { label: "Draft", revenue: totals.draft.revenue, cost: totals.draft.cost, margin: totals.draft.margin },
    { label: "All", revenue: totals.all.revenue, cost: totals.all.cost, margin: totals.all.margin },
  ];

  const monthData = metrics.byMonth.map((m) => ({ label: m.month, value: m.revenue }));
  const routeData = metrics.byRoute.map((r) => ({ label: r.label, value: r.revenue }));
  const serviceData = metrics.byService.map((s) => ({ label: s.label, value: s.revenue }));
  const providerData = metrics.byProvider.map((p) => ({ label: p.label, value: p.revenue }));
  const stageData = metrics.byStage.map((s) => ({ label: s.label, value: s.revenue }));

  return (
    <div className={styles.finance}>
      <div className={styles.financeMeta}>
        <span>Base currency: {metrics.baseCurrency}</span>
        <span>{metrics.quotesRead} quotes · {metrics.clientsRead} clients</span>
      </div>

      <div className={styles.financeGrid}>
        <div className={styles.financeCard}>
          <h3 className={styles.financeTitle}>Revenue vs cost vs margin</h3>
          <GroupedBarChart
            data={totalsData}
            series={[
              { key: "revenue", name: "Revenue" },
              { key: "cost", name: "Cost" },
              { key: "margin", name: "Margin" },
            ]}
            colors={[PALETTE.navy, PALETTE.accent, PALETTE.steel]}
            valueFormatter={money}
            emptyMessage="No priced quotes yet."
          />
        </div>

        <div className={styles.financeCard}>
          <h3 className={styles.financeTitle}>Win rate</h3>
          <DonutChart
            value={metrics.winRate.won}
            total={metrics.winRate.sentOrBeyond}
            label="won"
            color={PALETTE.success}
            emptyMessage="No client-facing quotes yet."
          />
          <p className={styles.financeSub}>
            {metrics.winRate.won} of {metrics.winRate.sentOrBeyond} quotes won
            {metrics.cycleDays.median != null
              ? ` · median cycle ${metrics.cycleDays.median} days`
              : ""}
          </p>
        </div>
      </div>

      <div className={styles.financeCard}>
        <h3 className={styles.financeTitle}>Revenue by month</h3>
        <TrendChart
          data={monthData}
          color={PALETTE.accent}
          valueFormatter={money}
          emptyMessage="No won revenue yet."
        />
      </div>

      <div className={styles.financeGrid}>
        <div className={styles.financeCard}>
          <h3 className={styles.financeTitle}>Revenue by route</h3>
          <RankedBarChart data={routeData} color={PALETTE.navy} valueFormatter={money} emptyMessage="No route data yet." />
        </div>
        <div className={styles.financeCard}>
          <h3 className={styles.financeTitle}>Revenue by service</h3>
          <RankedBarChart data={serviceData} color={PALETTE.navy} valueFormatter={money} emptyMessage="No service data yet." />
        </div>
      </div>

      <div className={styles.financeGrid}>
        <div className={styles.financeCard}>
          <h3 className={styles.financeTitle}>Revenue by provider</h3>
          <RankedBarChart data={providerData} color={PALETTE.navy} valueFormatter={money} emptyMessage="No provider data yet." />
        </div>
        <div className={styles.financeCard}>
          <h3 className={styles.financeTitle}>Revenue by stage</h3>
          <RankedBarChart data={stageData} color={PALETTE.navy} valueFormatter={money} emptyMessage="No stage data yet." />
        </div>
      </div>

      {(metrics.skipped.currency > 0 ||
        metrics.skipped.zeroTotal > 0 ||
        metrics.skipped.exclusiveAlternates > 0) && (
        <p className={styles.financeSub}>
          Skipped: {metrics.skipped.currency} wrong-currency, {metrics.skipped.zeroTotal} zero-total, {metrics.skipped.exclusiveAlternates} exclusive alternates.
        </p>
      )}
    </div>
  );
}

export function SalesView() {
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    dashboardFetch<{ rows?: Array<Record<string, unknown>>; sales?: Array<Record<string, unknown>> }>("/api/dashboard/sales-report")
      .then((r) => setRows(r.rows ?? r.sales ?? []))
      .catch((e) => {
        if (isRoleDenied(e)) setDenied(true);
        else setError(e instanceof Error ? e.message : "Failed to load sales report.");
      });
  }, []);

  const keys = Array.from(new Set((rows ?? []).flatMap((r) => Object.keys(r)))).slice(0, 8);

  const { query, setQuery, page, setPage, pageItems, total, totalPages } =
    usePaginatedSearch<Record<string, unknown>>(rows ?? [], {
      searchKeys: keys,
      pageSize: 20,
    });

  const sk = useSkeleton(rows === null && !error && !denied);
  if (denied) return <AdminsOnlyNotice what="The sales report" />;
  if (error) return <ErrorNotice audience="staff" title="This section did not load">{error}</ErrorNotice>;
  if (sk.showSkeleton || rows === null) {
    return (
      <SkeletonRegion label="Loading the sales report" visible={sk.skeletonVisible}>
        <SalesSkeleton />
      </SkeletonRegion>
    );
  }
  if (rows.length === 0) return <p className={styles.muted}>No sales data.</p>;

  return (
    <div className={styles.listStack}>
      <SearchInput value={query} onChange={setQuery} placeholder="Search sales…" resultCount={total} />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {keys.map((k) => (
                <th key={k} className={styles.tableHead}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r, i) => (
              <tr key={i}>
                {keys.map((k) => (
                  <td key={k} className={styles.tableCell}>
                    {r[k] == null ? "None" : String(r[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}


interface AssignmentProvider {
  id: string;
  name: string | null;
  email: string | null;
  score: number;
  legalAreas: string[];
  jurisdictions: string[];
}

interface AssignmentClient {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  legalArea: string | null;
  jurisdiction: string | null;
  stage: string;
}

interface AssignmentQueue {
  unassigned: AssignmentClient[];
  providers: AssignmentProvider[];
  unassignedCount: number;
}

export function AssignmentView() {
  const [queue, setQueue] = useState<AssignmentQueue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => {
    dashboardFetch<AssignmentQueue>("/api/dashboard/assignment/queue")
      .then(setQueue)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load assignment queue."));
  };

  useEffect(load, []);

  async function assign(clientId: string, providerId: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await dashboardFetch(`/api/dashboard/clients/${clientId}/assign`, {
        method: "POST",
        body: JSON.stringify({ providerId }),
      });
      setNotice(`Assigned ${clientId} to ${providerId}.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assignment failed.");
    } finally {
      setBusy(false);
    }
  }

  async function autoAssign() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await dashboardFetch<{ assigned: number }>(
        "/api/dashboard/assignment/auto",
        { method: "POST", body: JSON.stringify({}) },
      );
      setNotice(`Auto-assigned ${res.assigned} clients by score.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auto-assignment failed.");
    } finally {
      setBusy(false);
    }
  }

  const sk = useSkeleton(queue === null && !error);
  if (error) return <ErrorNotice audience="staff" title="This section did not load">{error}</ErrorNotice>;
  if (sk.showSkeleton || queue === null) {
    return (
      <SkeletonRegion label="Loading the assignment queue" visible={sk.skeletonVisible}>
        <AssignmentSkeleton />
      </SkeletonRegion>
    );
  }

  return (
    <div className={styles.listStack}>
      <div className={styles.assignmentBar}>
        <span className={styles.muted}>{queue.unassignedCount} unassigned clients</span>
        <button
          type="button"
          className={styles.assignBtn}
          onClick={autoAssign}
          disabled={busy || queue.unassignedCount === 0}
        >
          {busy ? "Assigning…" : "Auto-assign by score"}
        </button>
      </div>

      {notice && <Notice tone="success" variant="inline" title={notice} />}

      <h3 className={styles.financeTitle}>Lawyers (by score)</h3>
      {queue.providers.map((p) => (
        <div key={p.id} className={styles.listItem}>
          <div>
            <div className={styles.itemTitle}>
              {p.name ?? p.email ?? p.id}
              <span className={styles.scoreBadge}>{p.score.toFixed(1)}</span>
            </div>
            <div className={styles.itemSub}>
              {(p.legalAreas ?? []).join(", ") || "No legal areas set"}
            </div>
          </div>
        </div>
      ))}

      <h3 className={styles.financeTitle}>Unassigned clients</h3>
      {queue.unassigned.length === 0 && (
        <p className={styles.muted}>No unassigned clients.</p>
      )}
      {queue.unassigned.map((c) => (
        <div key={c.id} className={styles.listItem}>
          <div>
            <div className={styles.itemTitle}>
              {[c.name, c.surname].filter(Boolean).join(" ") || c.email}
            </div>
            <div className={styles.itemSub}>
              {c.legalArea ?? "Legal area not set"}
              {c.jurisdiction ? ` · ${c.jurisdiction}` : ""}
            </div>
          </div>
          <Select
            label={`Assign ${[c.name, c.surname].filter(Boolean).join(" ") || c.email} to a lawyer`}
            hideLabel
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) assign(c.id, e.target.value);
            }}
            disabled={busy}
          >
            <option value="" disabled>
              Assign to…
            </option>
            {queue.providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? p.email ?? p.id} ({p.score.toFixed(1)})
              </option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  );
}
