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
    try {
      const [funnel, dash] = await Promise.all([
        dashboardFetch<FunnelMetrics>("/api/analytics/funnel"),
        dashboardFetch<DashboardMetrics>("/api/dashboard/metrics"),
      ]);
      setMetrics(funnel);
      setDashMetrics(dash);
      setStage("ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearDashboardToken();
        setStage("login");
        setError("Session expired. Please log in again.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load metrics.");
        setStage("login");
      }
    }
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
      <main className={styles.main}>
        <form
          className={styles.login}
          onSubmit={stage === "login" ? requestOtp : verifyOtp}
        >
          <h1 className={styles.title}>ILP dashboard</h1>
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
      </main>
    );
  }

  const tiles = [
    { label: "Qualified profiles", value: metrics!.qualifiedProfiles },
    { label: "Template downloads", value: metrics!.templateDownloads },
    { label: "Alerts dispatched", value: metrics!.alertsDispatched },
    { label: "Alert responses", value: metrics!.alertResponses },
    { label: "Needs help rate", value: `${metrics!.needsHelpRate.toFixed(1)}%` },
    { label: "Booked consultations", value: metrics!.bookedConsultations },
    { label: "Confirmed consultations", value: metrics!.confirmedConsultations },
  ];

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
      <section className={styles.grid}>
        {tiles.map((tile) => (
          <div key={tile.label} className={styles.tile}>
            <span className={styles.value}>{tile.value}</span>
            <span className={styles.label}>{tile.label}</span>
          </div>
        ))}
      </section>

      {dashMetrics && (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Pipeline</h2>
            <div className={styles.grid}>
              {dashMetrics.pipeline.stageLabels.map((s) => (
                <div key={s.id} className={styles.tile}>
                  <span className={styles.value}>
                    {dashMetrics.pipeline.stageCounts[s.id] ?? 0}
                  </span>
                  <span className={styles.label}>{s.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Stage satisfaction</h2>
            <div className={styles.grid}>
              {dashMetrics.stageRatings.perStage.map((r) => (
                <div key={r.stage} className={styles.tile}>
                  <span className={styles.value}>
                    {r.count > 0 ? `${r.average.toFixed(1)}★` : "—"}
                  </span>
                  <span className={styles.label}>
                    {r.label} · {r.count} rating{r.count === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Activity</h2>
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
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Sources</h2>
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
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Jurisdictions</h2>
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
          </section>
        </>
      )}
    </main>
  );
}
