"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getUser, type SessionUser } from "@/lib/auth";
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

export default function DashboardView() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = getUser();
    if (!current || current.role !== "staff") {
      setError("Staff access required.");
      return;
    }
    setUser(current);

    apiFetch<FunnelMetrics>("/api/analytics/funnel")
      .then(setMetrics)
      .catch((err) => {
        if (err instanceof ApiError) setError(err.message);
        else setError("Failed to load metrics.");
      });
  }, []);

  if (error) {
    return (
      <main className={styles.main}>
        <p className={styles.error}>{error}</p>
      </main>
    );
  }

  if (!metrics) {
    return (
      <main className={styles.main}>
        <p>Loading metrics...</p>
      </main>
    );
  }

  const tiles = [
    { label: "Qualified profiles", value: metrics.qualifiedProfiles },
    { label: "Template downloads", value: metrics.templateDownloads },
    { label: "Alerts dispatched", value: metrics.alertsDispatched },
    { label: "Alert responses", value: metrics.alertResponses },
    { label: "Needs help rate", value: `${metrics.needsHelpRate.toFixed(1)}%` },
    { label: "Booked consultations", value: metrics.bookedConsultations },
    { label: "Confirmed consultations", value: metrics.confirmedConsultations },
  ];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>ILP dashboard</h1>
        {user && <p className={styles.actor}>{user.email}</p>}
      </header>
      <section className={styles.grid}>
        {tiles.map((tile) => (
          <div key={tile.label} className={styles.tile}>
            <span className={styles.value}>{tile.value}</span>
            <span className={styles.label}>{tile.label}</span>
          </div>
        ))}
      </section>
    </main>
  );
}