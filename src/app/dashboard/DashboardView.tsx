"use client";

import { useEffect, useState } from "react";
import {
  dashboardFetch,
  getDashboardToken,
  setDashboardToken,
  clearDashboardToken,
  ApiError,
} from "@/lib/api";
import ClientsPanel from "@/components/dashboard/ClientsPanel";
import ImportExportModal from "@/components/dashboard/ImportExportModal";
import AdminViews from "@/components/dashboard/AdminViews";
import AnimatedTabs, { type TabItem } from "@/components/AnimatedTabs";
import AuthShell from "@/components/auth/AuthShell";
import AuthField from "@/components/auth/AuthField";
import { Reveal } from "@/components/motion/Motion";
import CountUp from "@/components/motion/CountUp";
import TiltCard from "@/components/motion/TiltCard";
import { SimpleBarChart, PALETTE } from "@/components/dashboard/charts";
import styles from "./dashboard.module.scss";

interface FunnelMetrics {
  qualifiedProfiles: number;
  templateDownloads: number;
  alertsDispatched: number;
  alertResponses: number;
  needsHelpRate: number;
  bookedConsultations: number;
  confirmedConsultations: number;
}

interface DashboardMetrics {
  pipeline: {
    stageCounts: Record<string, number>;
    stageLabels: Array<{ id: string; label: string }>;
    total: number;
  };
  emailQueue: { pending: number; sent: number; dead: number; total: number };
  llmCosts: { totalCostUSD: number; totalCalls: number };
  monthlyLeads: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  jurisdictionBreakdown: Record<string, number>;
  stageRatings: {
    perStage: Array<{ stage: string; label: string; average: number; count: number }>;
    globalAverage: number;
    totalRatings: number;
  };
  activity: {
    calls: { total: number; perClient: Array<{ clientName: string; total: number }> };
    quotes: { total: number; accepted: number };
  };
}

type Stage = "loading" | "login" | "verify" | "ready";

type TileValue =
  | { kind: "number"; value: number; formatter?: (v: number) => string }
  | { kind: "text"; value: string };

interface Tile {
  label: string;
  value: TileValue;
}

export default function DashboardView() {
  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [dashMetrics, setDashMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    if (!getDashboardToken()) {
      setStage("login");
      return;
    }
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMetrics() {
    const [funnelResult, dashResult] = await Promise.allSettled([
      dashboardFetch<FunnelMetrics>("/api/analytics/funnel"),
      dashboardFetch<DashboardMetrics>("/api/dashboard/metrics"),
    ]);

    if (funnelResult.status === "fulfilled") {
      setMetrics(funnelResult.value);
    } else if (funnelResult.reason instanceof ApiError && funnelResult.reason.status === 401) {
      clearDashboardToken();
      setStage("login");
      setError("Session expired. Please log in again.");
      return;
    }

    if (dashResult.status === "fulfilled") {
      setDashMetrics(dashResult.value);
    } else if (dashResult.reason instanceof ApiError && dashResult.reason.status === 401) {
      clearDashboardToken();
      setStage("login");
      setError("Session expired. Please log in again.");
      return;
    }

    setStage("ready");
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setAuthBusy(true);
    try {
      await dashboardFetch("/api/dashboard/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setNotice("Verification code sent to your email.");
      setStage("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAuthBusy(true);
    try {
      const res = await dashboardFetch<{ token: string; email: string }>(
        "/api/dashboard/auth/verify-otp",
        { method: "POST", body: JSON.stringify({ email, code }) },
      );
      setDashboardToken(res.token);
      await loadMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setAuthBusy(false);
    }
  }

  function logout() {
    clearDashboardToken();
    setMetrics(null);
    setDashMetrics(null);
    setCode("");
    setStage("login");
  }

  if (stage === "loading") {
    return (
      <main className={styles.main}>
        <p>Loading...</p>
      </main>
    );
  }

  if (stage === "login" || stage === "verify") {
    return (
      <AuthShell
        title="ILP dashboard"
        brand={{
          src: "/logo.png",
          name: "International Legal Partner",
          sub: "International Legal Partner",
        }}
        sub={
          stage === "login"
            ? "Enter your ILP team email to receive a login code."
            : `Enter the 6-digit code sent to ${email}.`
        }
        notice={notice}
        error={error}
        busy={authBusy}
        primaryLabel={stage === "login" ? "Send code" : "Verify"}
        onSubmit={stage === "login" ? requestOtp : verifyOtp}
        secondaryVisible={stage === "verify"}
        secondaryLabel="Use a different email"
        onSecondary={() => {
          setStage("login");
          setCode("");
          setError(null);
          setNotice(null);
        }}
      >
        {stage === "login" ? (
          <AuthField
            label="Team email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@internationallegalpartner.com"
            required
            autoFocus
          />
        ) : (
          <AuthField
            label="Verification code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            required
            autoFocus
          />
        )}
      </AuthShell>
    );
  }

  const tiles: Tile[] = metrics
    ? [
        { label: "Qualified profiles", value: { kind: "number", value: metrics.qualifiedProfiles } },
        { label: "Template downloads", value: { kind: "number", value: metrics.templateDownloads } },
        { label: "Alerts dispatched", value: { kind: "number", value: metrics.alertsDispatched } },
        { label: "Alert responses", value: { kind: "number", value: metrics.alertResponses } },
        {
          label: "Needs help rate",
          value: {
            kind: "number",
            value: metrics.needsHelpRate,
            formatter: (v) => `${v.toFixed(1)}%`,
          },
        },
        { label: "Booked consultations", value: { kind: "number", value: metrics.bookedConsultations } },
        { label: "Confirmed consultations", value: { kind: "number", value: metrics.confirmedConsultations } },
      ]
    : [];

  const analyticsTabs: TabItem[] = [];

  if (tiles.length > 0) {
    analyticsTabs.push({
      id: "overview",
      label: "Overview",
      content: (
        <section className={styles.grid}>
          {tiles.map((tile) => (
            <TiltCard key={tile.label} className={styles.tile}>
              {tile.value.kind === "number" ? (
                <CountUp
                  className={styles.value}
                  value={tile.value.value}
                  formatter={tile.value.formatter ?? ((v) => String(Math.round(v)))}
                />
              ) : (
                <span className={styles.value}>{tile.value.value}</span>
              )}
              <span className={styles.label}>{tile.label}</span>
            </TiltCard>
          ))}
        </section>
      ),
    });
  }

  if (dashMetrics) {
    analyticsTabs.push(
      {
        id: "pipeline",
        label: "Pipeline",
        content: (
          <SimpleBarChart
            data={dashMetrics.pipeline.stageLabels.map((s) => ({
              label: s.label,
              value: dashMetrics.pipeline.stageCounts[s.id] ?? 0,
            }))}
            color={PALETTE.accent}
            emptyMessage="No clients in the pipeline yet."
          />
        ),
      },
      {
        id: "satisfaction",
        label: "Satisfaction",
        content: (
          <SimpleBarChart
            data={dashMetrics.stageRatings.perStage.map((r) => ({
              label: r.label,
              value: r.count > 0 ? r.average : 0,
            }))}
            color={PALETTE.success}
            emptyMessage="No stage ratings yet."
            valueFormatter={(v) => `${v.toFixed(1)}★`}
          />
        ),
      },
      {
        id: "activity",
        label: "Activity",
        content: (
          <div className={styles.grid}>
            {(
              [
                { label: "Completed calls", value: { kind: "number", value: dashMetrics.activity.calls.total } },
                { label: "Quotes", value: { kind: "number", value: dashMetrics.activity.quotes.total } },
                { label: "Quotes accepted", value: { kind: "number", value: dashMetrics.activity.quotes.accepted } },
                { label: "LLM calls", value: { kind: "number", value: dashMetrics.llmCosts.totalCalls } },
                {
                  label: "LLM cost",
                  value: {
                    kind: "number",
                    value: dashMetrics.llmCosts.totalCostUSD,
                    formatter: (v) => `$${v.toFixed(2)}`,
                  },
                },
                { label: "Emails pending", value: { kind: "number", value: dashMetrics.emailQueue.pending } },
              ] as Tile[]
            ).map((tile) => (
              <div key={tile.label} className={styles.tile}>
                <CountUp
                  className={styles.value}
                  value={tile.value.value as number}
                  formatter={(tile.value as { formatter?: (v: number) => string }).formatter ?? ((v) => String(Math.round(v)))}
                />
                <span className={styles.label}>{tile.label}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "sources",
        label: "Sources",
        content: (
          <div className={styles.grid}>
            {Object.entries(dashMetrics.sourceBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => (
                <div key={source} className={styles.tile}>
                  <span className={styles.value}>{count}</span>
                  <span className={styles.label}>{source}</span>
                </div>
              ))}
          </div>
        ),
      },
      {
        id: "jurisdictions",
        label: "Jurisdictions",
        content: (
          <div className={styles.grid}>
            {Object.entries(dashMetrics.jurisdictionBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([jurisdiction, count]) => (
                <div key={jurisdiction} className={styles.tile}>
                  <span className={styles.value}>{count}</span>
                  <span className={styles.label}>{jurisdiction}</span>
                </div>
              ))}
          </div>
        ),
      },
    );
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>ILP dashboard</h1>
        <div className={styles.actorRow}>
          <p className={styles.actor}>{email}</p>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setShowImport((v) => !v)}
          >
            Import clients
          </button>
          <button type="button" className={styles.secondary} onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className={styles.scrollArea}>
        <Reveal>
          {analyticsTabs.length > 0 && (
            <section className={styles.section}>
              <AnimatedTabs tabs={analyticsTabs} defaultTab="overview" />
            </section>
          )}
        </Reveal>

        <Reveal>
          <section className={styles.section}>
            <ClientsPanel />
          </section>
        </Reveal>

        <Reveal>
          <section className={styles.section}>
            <AdminViews />
          </section>
        </Reveal>
      </div>

      {showImport && <ImportExportModal onClose={() => setShowImport(false)} />}
    </main>
  );
}