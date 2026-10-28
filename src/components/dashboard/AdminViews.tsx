"use client";

import { useEffect, useMemo, useState } from "react";
import { dashboardFetch, staffApi } from "@/lib/api";
import { apiListSource } from "@/lib/listSource";
import { LIST_SCHEMAS } from "@/lib/listSchemas";
import { LOCAL_SCHEMAS } from "@/lib/localListSchemas";
import { useSchemaList } from "@/lib/useSchemaList";
import { AdminsOnlyNotice, isRoleDenied, useStaff } from "./staff/StaffSession";
import {
  RankedBarChart,
  DonutChart,
  TrendChart,
  GroupedBarChart,
  PALETTE,
} from "@/components/dashboard/charts";
import styles from "./adminViews.module.scss";
import { DataTable, EmptyState, ErrorNotice, FilterBar, ListFooter, Notice, Select, SkeletonList, SkeletonRegion, StatusPill, useSkeleton, type Column } from "@/components/ui";
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
  companyName?: string | null;
  active?: boolean;
  [key: string]: unknown;
}

/**
 * R5.5 admin views (providers, vendors, finance metrics, sales report,
 * assignment). Each is mounted on its own /dashboard route by W6; they fetch
 * only when their route or tab is first opened.
 */
const providersSource = apiListSource<Provider>(staffApi, "/api/dashboard/providers");
const vendorsSource = apiListSource<Vendor>(staffApi, "/api/vendors");

const words = (v: unknown) => (Array.isArray(v) ? v.map(String).join(", ").replace(/_/g, " ") : "");
/** Area and country values are stored as ids ("real_estate", "CR"); show words. */
const prettyOptions = (o: Array<{ value: string; label: string; count?: number }> | undefined) => (o ?? []).map((x) => ({ ...x, label: x.label.replace(/_/g, " ") }));

export function ProvidersList() {
  const { email } = useStaff();
  const sl = useSchemaList<Provider>({
    schema: LIST_SCHEMAS.providers,
    key: "staff-providers",
    source: providersSource,
    pageSize: 20,
    defaultSort: { key: "name", dir: "asc" },
    keyOf: (p) => p.id,
    viewer: email,
  });
  const list = sl.list;
  const columns = useMemo<Column<Provider>[]>(() => [
    { key: "name", header: "Lawyer", render: (p) => <span className={styles.itemTitle}>{p.name ?? p.id}</span>, sortable: true, width: "wide" },
    { key: "email", header: "Email", render: (p) => p.email ?? "No email yet" },
    { key: "firmName", header: "Firm", render: (p) => String(p.firmName ?? ""), hideOnMobile: true },
    { key: "legalAreas", header: "Areas", render: (p) => words(p.legalAreas) || "None set", hideOnMobile: true },
    { key: "jurisdictions", header: "Countries", render: (p) => words(p.jurisdictions) || "None set", hideOnMobile: true },
    { key: "active", header: "Status", render: (p) => <StatusPill size="sm" tone={p.active === false ? "neutral" : "success"} label={p.active === false ? "Inactive" : "Active"} /> },
    { key: "createdAt", header: "Added", render: (p) => String(p.createdAt ?? "").slice(0, 10), sortable: true, hideOnMobile: true },
  ], []);
  const options = useMemo(() => ({ legalAreas: prettyOptions(sl.schema.fields.find((f) => f.key === "legalAreas")?.options) }), [sl.schema]);
  const sk = useSkeleton(list.initialLoading);
  if (list.initialLoading && list.error) return <ErrorNotice audience="staff" title="This section did not load" onRetry={list.refresh}>{list.error}</ErrorNotice>;
  if (sk.showSkeleton || list.initialLoading) {
    return (
      <SkeletonRegion label="Loading lawyers" visible={sk.skeletonVisible}>
        <AdminListSkeleton />
      </SkeletonRegion>
    );
  }
  if (list.items.length === 0 && !list.activeQuery && sl.activeCount === 0 && list.status === "done") {
    return <EmptyState compact title="No lawyers yet" body="Lawyers appear here after they apply from the lawyers page and an admin approves them in Applications." />;
  }

  return (
    <div className={styles.listStack}>
      <FilterBar list={sl} noun="lawyers" searchLabel="Search lawyers" placeholder="Name, email, area or country" options={options} columns={columns.map((c) => ({ key: c.key, header: c.header }))} />
      <DataTable
        caption="Lawyer directory"
        columns={sl.visibleColumns(columns)}
        rows={list.items}
        rowKey={(p) => p.id}
        loadingMore={list.loadingMore}
        stale={list.stale}
        sort={list.sort}
        onSortChange={list.setSort}
        empty="No lawyer matches these filters."
      />
      <ListFooter list={list} audience="staff" />
    </div>
  );
}

export function VendorsList() {
  const { email } = useStaff();
  const sl = useSchemaList<Vendor>({
    schema: LIST_SCHEMAS.vendors,
    key: "staff-vendors",
    source: vendorsSource,
    pageSize: 20,
    defaultSort: { key: "companyName", dir: "asc" },
    keyOf: (v) => v.id,
    viewer: email,
  });
  const list = sl.list;
  const columns = useMemo<Column<Vendor>[]>(() => [
    { key: "companyName", header: "Company", render: (v) => <span className={styles.itemTitle}>{v.companyName ?? v.name ?? v.id}</span>, sortable: true, width: "wide" },
    { key: "contactName", header: "Contact", render: (v) => String(v.contactName ?? ""), hideOnMobile: true },
    { key: "email", header: "Email", render: (v) => String(v.email ?? ""), hideOnMobile: true },
    { key: "legalAreas", header: "Areas", render: (v) => words(v.legalAreas) || "None set", hideOnMobile: true },
    { key: "jurisdictions", header: "Countries", render: (v) => words(v.jurisdictions) || "None set", hideOnMobile: true },
    { key: "active", header: "Status", render: (v) => <StatusPill size="sm" tone={v.active === false ? "neutral" : "success"} label={v.active === false ? "Inactive" : "Active"} /> },
  ], []);
  const options = useMemo(() => ({ legalAreas: prettyOptions(sl.schema.fields.find((f) => f.key === "legalAreas")?.options) }), [sl.schema]);
  const sk = useSkeleton(list.initialLoading);
  if (list.initialLoading && list.error) return <ErrorNotice audience="staff" title="This section did not load" onRetry={list.refresh}>{list.error}</ErrorNotice>;
  if (sk.showSkeleton || list.initialLoading) {
    return (
      <SkeletonRegion label="Loading vendors" visible={sk.skeletonVisible}>
        <AdminListSkeleton sub={false} trail />
      </SkeletonRegion>
    );
  }
  if (list.items.length === 0 && !list.activeQuery && sl.activeCount === 0 && list.status === "done") {
    return <EmptyState compact title="No vendors yet" body="Outside suppliers show here once they are added. Ask an admin if one you work with is missing." />;
  }

  return (
    <div className={styles.listStack}>
      <FilterBar list={sl} noun="vendors" searchLabel="Search vendors" placeholder="Company, contact or area" options={options} columns={columns.map((c) => ({ key: c.key, header: c.header }))} />
      <DataTable
        caption="Vendors"
        columns={sl.visibleColumns(columns)}
        rows={list.items}
        rowKey={(v) => v.id}
        loadingMore={list.loadingMore}
        stale={list.stale}
        sort={list.sort}
        onSortChange={list.setSort}
        empty="No vendor matches these filters."
      />
      <ListFooter list={list} audience="staff" />
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
        else setError(e instanceof Error ? e.message : "The finance figures did not load.");
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
          <h3 className={styles.financeTitle}>Revenue, cost and margin</h3>
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
          <h3 className={styles.financeTitle}>Revenue by lawyer</h3>
          <RankedBarChart data={providerData} color={PALETTE.navy} valueFormatter={money} emptyMessage="No lawyer revenue yet." />
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

/** One row of the sales report (server API/finance/salesReport.ts ProjectCompletion). */
interface SalesProject {
  kind: "quote" | "client" | "invoice";
  id: string;
  label: string;
  completedAt: string | null;
  source: string;
  contractValue: number;
  collected: number;
  outstanding: number;
  margin: number;
}

const SALES_KIND: Record<string, string> = { quote: "Quote", client: "Client", invoice: "Invoice" };
const amount = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export function SalesView() {
  const { email } = useStaff();
  const [rows, setRows] = useState<SalesProject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    dashboardFetch<{ projects?: SalesProject[]; rows?: SalesProject[] }>("/api/dashboard/sales-report")
      .then((r) => setRows(r.projects ?? r.rows ?? []))
      .catch((e) => {
        if (isRoleDenied(e)) setDenied(true);
        else setError(e instanceof Error ? e.message : "The sales report did not load.");
      });
  }, []);

  // FILTERS: the report's project rows, searched, filtered, sorted and paged in the browser.
  const sl = useSchemaList<SalesProject>({
    schema: LOCAL_SCHEMAS.salesProjects,
    key: "staff-sales-projects",
    rows,
    pageSize: 20,
    defaultSort: { key: "completedAt", dir: "desc" },
    keyOf: (r) => `${r.kind}:${r.id}`,
    viewer: email,
    local: { read: (r, f) => (f.key === "complete" ? !!r.completedAt : undefined) },
  });
  const list = sl.list;
  const columns = useMemo<Column<SalesProject>[]>(() => [
    { key: "label", header: "Project", render: (r) => r.label, sortable: true, width: "wide" },
    { key: "kind", header: "Source record", render: (r) => SALES_KIND[r.kind] ?? r.kind, hideOnMobile: true },
    { key: "completedAt", header: "Completed", render: (r) => (r.completedAt ? r.completedAt.slice(0, 10) : <StatusPill size="sm" tone="warning" label="Not complete" />), sortable: true },
    { key: "source", header: "Completion signal", render: (r) => r.source, hideOnMobile: true },
    { key: "contractValue", header: "Contract value", render: (r) => amount(r.contractValue), sortable: true, align: "end" },
    { key: "collected", header: "Collected", render: (r) => amount(r.collected), sortable: true, align: "end", hideOnMobile: true },
    { key: "outstanding", header: "Outstanding", render: (r) => amount(r.outstanding), sortable: true, align: "end" },
    { key: "margin", header: "Margin", render: (r) => amount(r.margin), sortable: true, align: "end", hideOnMobile: true },
  ], []);

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
  if (rows.length === 0) return <EmptyState compact title="No sales yet" body="Sales show here once members accept quotes for legal work." />;

  return (
    <div className={styles.listStack}>
      <FilterBar list={sl} noun="projects" searchLabel="Search sales" placeholder="Project or completion signal" columns={columns.map((c) => ({ key: c.key, header: c.header }))} />
      <DataTable
        caption="Sales by project"
        columns={sl.visibleColumns(columns)}
        rows={list.items}
        rowKey={(r) => `${r.kind}:${r.id}`}
        stale={list.stale}
        sort={list.sort}
        onSortChange={list.setSort}
        empty="No project matches these filters."
      />
      <ListFooter list={list} audience="staff" />
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

const assignmentSource = apiListSource<AssignmentClient>(staffApi, "/api/dashboard/assignment/queue");

export function AssignmentView() {
  const { email } = useStaff();
  const sl = useSchemaList<AssignmentClient>({
    schema: LIST_SCHEMAS.assignmentQueue,
    key: "staff-assignment",
    source: assignmentSource,
    pageSize: 20,
    defaultSort: { key: "lastUpdated", dir: "desc" },
    keyOf: (c) => c.id,
    viewer: email,
  });
  const list = sl.list;
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const providers = (list.meta.providers as AssignmentProvider[] | undefined) ?? [];
  const unassignedCount = Number(list.meta.unassignedCount ?? list.items.length);

  async function assign(clientId: string, providerId: string) {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await dashboardFetch(`/api/dashboard/clients/${clientId}/assign`, {
        method: "POST",
        body: JSON.stringify({ providerId }),
      });
      const who = providers.find((p) => p.id === providerId);
      setNotice(`Assigned ${clientId} to ${who?.name ?? who?.email ?? providerId}.`);
      list.update((items) => items.filter((c) => c.id !== clientId));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Assignment failed.");
    } finally {
      setBusy(false);
    }
  }

  async function autoAssign() {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const res = await dashboardFetch<{ assigned: number }>(
        "/api/dashboard/assignment/auto",
        { method: "POST", body: JSON.stringify({}) },
      );
      setNotice(`Auto-assigned ${res.assigned} clients by score.`);
      list.refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Auto-assignment failed.");
    } finally {
      setBusy(false);
    }
  }

  const sk = useSkeleton(list.initialLoading);
  if (list.initialLoading && list.error) return <ErrorNotice audience="staff" title="This section did not load" onRetry={list.refresh}>{list.error}</ErrorNotice>;
  if (sk.showSkeleton || list.initialLoading) {
    return (
      <SkeletonRegion label="Loading the assignment queue" visible={sk.skeletonVisible}>
        <AssignmentSkeleton />
      </SkeletonRegion>
    );
  }

  return (
    <div className={styles.listStack}>
      <div className={styles.assignmentBar}>
        <span className={styles.muted}>{unassignedCount === 1 ? "1 member without a lawyer" : `${unassignedCount} members without a lawyer`}</span>
        <button
          type="button"
          className={styles.assignBtn}
          onClick={autoAssign}
          disabled={busy || unassignedCount === 0}
        >
          {busy ? "Assigning…" : "Auto-assign by score"}
        </button>
      </div>

      {notice && <Notice tone="success" variant="inline" title={notice} />}
      {actionError && <ErrorNotice audience="staff">{actionError}</ErrorNotice>}

      <h3 className={styles.financeTitle}>Lawyers by match score</h3>
      {providers.map((p) => (
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

      <h3 className={styles.financeTitle}>Members without a lawyer</h3>
      <FilterBar list={sl} noun="members" searchLabel="Search members" placeholder="Name, email or legal area" sortOptions="schema" />
      {list.items.length === 0 && list.status === "done" && (list.activeQuery || sl.activeCount > 0) && <p className={styles.muted}>No member matches these filters.</p>}
      {list.items.length === 0 && list.status === "done" && !list.activeQuery && sl.activeCount === 0 && (
        <EmptyState compact title="Every member has a lawyer" body="Members who join without one are listed here, oldest first." />
      )}
      <div aria-busy={list.stale || undefined} className={list.stale ? styles.stale : undefined}>
        {list.items.map((c) => (
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
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.email ?? p.id} ({p.score.toFixed(1)})
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>
      <ListFooter list={list} audience="staff" skeleton={<SkeletonList rows={2} variant="plain" />} />
    </div>
  );
}
