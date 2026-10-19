"use client";

import { useEffect, useState } from "react";
import { dashboardFetch } from "@/lib/api";
import {
  RankedBarChart,
  DonutChart,
  TrendChart,
  GroupedBarChart,
  PALETTE,
} from "@/components/dashboard/charts";
import styles from "./adminViews.module.scss";

type ViewKey = "providers" | "vendors" | "finance" | "sales" | "emails";

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
 * R5.5 — admin views consuming the Phase 5 routers (providers, vendors,
 * finance metrics/ledger, sales report) plus the email queue tab (R5.2). These
 * were mounted on the backend but had zero frontend consumers.
 */
export default function AdminViews() {
  const [view, setView] = useState<ViewKey>("providers");

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {([["providers", "Providers"], ["vendors", "Vendors"], ["finance", "Finance"], ["sales", "Sales report"], ["emails", "Emails"]] as [ViewKey, string][]).map(
          ([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              style={{
                padding: "0.4rem 0.9rem",
                border: "1px solid rgba(18,59,93,0.14)",
                borderRadius: 999,
                background: view === key ? "#5cccf7" : "transparent",
                color: view === key ? "#123b5d" : "#4a5a66",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(18,59,93,0.14)", borderRadius: 14, padding: "1rem", minHeight: 200 }}>
        {view === "providers" && <ProvidersList />}
        {view === "vendors" && <VendorsList />}
        {view === "finance" && <FinanceView />}
        {view === "sales" && <SalesView />}
        {view === "emails" && <EmailsList />}
      </div>
    </section>
  );
}

function ProvidersList() {
  const [rows, setRows] = useState<Provider[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardFetch<{ providers: Provider[] }>("/api/dashboard/providers")
      .then((r) => setRows(r.providers ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load providers."));
  }, []);

  if (error) return <p style={{ color: "#c0392b" }}>{error}</p>;
  if (rows === null) return <p style={{ color: "#7a8a96" }}>Loading providers…</p>;
  if (rows.length === 0) return <p style={{ color: "#7a8a96" }}>No providers yet.</p>;

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {rows.map((p) => (
        <div key={p.id} style={{ border: "1px solid rgba(18,59,93,0.14)", borderRadius: 10, padding: "0.6rem" }}>
          <div style={{ fontWeight: 600, color: "#202a33" }}>{p.name ?? p.id}</div>
          <div style={{ color: "#7a8a96", fontSize: "0.85rem" }}>
            {[p.email, (p.legalAreas ?? []).join(", "), (p.jurisdictions ?? []).join(", ")].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

function VendorsList() {
  const [rows, setRows] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardFetch<{ vendors: Vendor[] }>("/api/vendors")
      .then((r) => setRows(r.vendors ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load vendors."));
  }, []);

  if (error) return <p style={{ color: "#c0392b" }}>{error}</p>;
  if (rows === null) return <p style={{ color: "#7a8a96" }}>Loading vendors…</p>;
  if (rows.length === 0) return <p style={{ color: "#7a8a96" }}>No vendors yet.</p>;

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {rows.map((v) => (
        <div key={v.id} style={{ border: "1px solid rgba(18,59,93,0.14)", borderRadius: 10, padding: "0.6rem", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, color: "#202a33" }}>{v.name ?? v.id}</span>
          <span style={{ color: v.active === false ? "#c0392b" : "#1f7a5c", fontSize: "0.8rem" }}>
            {v.active === false ? "Inactive" : "Active"}
          </span>
        </div>
      ))}
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

function FinanceView() {
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardFetch<FinanceMetrics>("/api/dashboard/finance/metrics")
      .then(setMetrics)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load finance metrics."));
  }, []);

  if (error) return <p style={{ color: "#c0392b" }}>{error}</p>;
  if (metrics === null) return <p style={{ color: "#7a8a96" }}>Loading finance…</p>;

  const totals = metrics.totals;

  // Revenue vs cost vs margin across the four pipeline buckets.
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
            colors={[PALETTE.accent, PALETTE.error, PALETTE.success]}
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
          <RankedBarChart data={serviceData} color={PALETTE.success} valueFormatter={money} emptyMessage="No service data yet." />
        </div>
      </div>

      <div className={styles.financeGrid}>
        <div className={styles.financeCard}>
          <h3 className={styles.financeTitle}>Revenue by provider</h3>
          <RankedBarChart data={providerData} color={PALETTE.warning} valueFormatter={money} emptyMessage="No provider data yet." />
        </div>
        <div className={styles.financeCard}>
          <h3 className={styles.financeTitle}>Revenue by stage</h3>
          <RankedBarChart data={stageData} color={PALETTE.steel} valueFormatter={money} emptyMessage="No stage data yet." />
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

function SalesView() {
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardFetch<{ rows?: Array<Record<string, unknown>>; sales?: Array<Record<string, unknown>> }>("/api/dashboard/sales-report")
      .then((r) => setRows(r.rows ?? r.sales ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load sales report."));
  }, []);

  if (error) return <p style={{ color: "#c0392b" }}>{error}</p>;
  if (rows === null) return <p style={{ color: "#7a8a96" }}>Loading sales…</p>;
  if (rows.length === 0) return <p style={{ color: "#7a8a96" }}>No sales data.</p>;

  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).slice(0, 8);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k} style={{ textAlign: "left", padding: "0.4rem", color: "#123b5d", borderBottom: "1px solid rgba(18,59,93,0.14)" }}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td key={k} style={{ padding: "0.4rem", color: "#4a5a66", borderBottom: "1px solid #f0f4f7" }}>
                  {r[k] == null ? "—" : String(r[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmailsList() {
  return (
    <p style={{ color: "#7a8a96" }}>
      Email queue management lives in the Emails tab of the client detail panel.
    </p>
  );
}