"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

export default function DashboardView() {
  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [dashMetrics, setDashMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (!getDashboardToken()) {
      setStage("login");
      return;
    }
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMetrics() {
    // Fetch the two endpoints independently so a failure in one (e.g. the
    // funnel's template_downloads collection) never blocks the other. The
    // pipeline + stage-satisfaction charts depend on /api/dashboard/metrics,
    // so that fetch must resolve on its own.
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
    try {
      await dashboardFetch("/api/dashboard/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setNotice("Verification code sent to your email.");
      setStage("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await dashboardFetch<{ token: string; email: string }>(
        "/api/dashboard/auth/verify-otp",
        { method: "POST", body: JSON.stringify({ email, code }) },
      );
      setDashboardToken(res.token);
      await loadMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
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
      <main className={styles.auth}>
        <div className={styles.authCard}>
          <div className={styles.brand}>
            <Image
              src="/logo.png"
              alt="International Legal Partner"
              width={48}
              height={48}
              className={styles.logo}
              priority
            />
            <div className={styles.brandText}>
              <h1 className={styles.title}>ILP dashboard</h1>
              <p className={styles.brandSub}>International Legal Partner</p>
            </div>
          </div>
          <form
            className={styles.login}
            onSubmit={stage === "login" ? requestOtp : verifyOtp}
          >
            <p className={styles.sub}>
              {stage === "login"
                ? "Enter your ILP team email to receive a login code."
                : `Enter the 6-digit code sent to ${email}.`}
            </p>

          {stage === "login" ? (
            <label className={styles.field}>
              <span>Team email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@internationallegalpartner.com"
                required
                autoFocus
              />
            </label>
          ) : (
            <label className={styles.field}>
              <span>Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </label>
          )}

          {notice && <p className={styles.notice}>{notice}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primary}>
            {stage === "login" ? "Send code" : "Verify"}
          </button>

          {stage === "verify" && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setStage("login");
                setCode("");
                setError(null);
                setNotice(null);
              }}
            >
              Use a different email
            </button>
          )}
          </form>
        </div>
        <footer className={styles.footer}>
          <p>
            © {new Date().getFullYear()} International Legal Partner. All rights
            reserved.
          </p>
        </footer>
      </main>
    );
  }

  const tiles = metrics
    ? [
        { label: "Qualified profiles", value: metrics.qualifiedProfiles },
        { label: "Template downloads", value: metrics.templateDownloads },
        { label: "Alerts dispatched", value: metrics.alertsDispatched },
        { label: "Alert responses", value: metrics.alertResponses },
        { label: "Needs help rate", value: `${metrics.needsHelpRate.toFixed(1)}%` },
        { label: "Booked consultations", value: metrics.bookedConsultations },
        { label: "Confirmed consultations", value: metrics.confirmedConsultations },
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
            <div key={tile.label} className={styles.tile}>
              <span className={styles.value}>{tile.value}</span>
              <span className={styles.label}>{tile.label}</span>
            </div>
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
            <div className={styles.tile}>
              <span className={styles.value}>{dashMetrics.activity.calls.total}</span>
              <span className={styles.label}>Completed calls</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.value}>{dashMetrics.activity.quotes.total}</span>
              <span className={styles.label}>Quotes</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.value}>{dashMetrics.activity.quotes.accepted}</span>
              <span className={styles.label}>Quotes accepted</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.value}>{dashMetrics.llmCosts.totalCalls}</span>
              <span className={styles.label}>LLM calls</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.value}>
                ${dashMetrics.llmCosts.totalCostUSD.toFixed(2)}
              </span>
              <span className={styles.label}>LLM cost</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.value}>{dashMetrics.emailQueue.pending}</span>
              <span className={styles.label}>Emails pending</span>
            </div>
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
    <main className={styles.main}>
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

      <ClientsPanel />

      <AdminViews />

      {showImport && <ImportExportModal onClose={() => setShowImport(false)} />}

      {analyticsTabs.length > 0 && (
        <section className={styles.section}>
          <AnimatedTabs tabs={analyticsTabs} defaultTab="overview" />
        </section>
      )}
    </main>
  );
}
