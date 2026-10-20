"use client";

import { useState } from "react";
import { providerFetch } from "@/lib/provider";
import type { LawyerClient } from "./types";
import styles from "./insightsTab.module.scss";

const CORE_KEYS: Array<{ key: string; label: string }> = [
  { key: "legalArea", label: "Legal area" },
  { key: "legalMatter", label: "Legal matter" },
  { key: "jurisdiction", label: "Jurisdiction" },
];

const ADVANCED_KEYS: Array<{ key: string; label: string }> = [
  { key: "name", label: "Name" },
  { key: "surname", label: "Surname" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
];

function confidenceOf(insights: Record<string, unknown>): number {
  const c = Number(insights.confidence);
  return Number.isFinite(c) ? Math.max(0, Math.min(100, Math.round(c))) : 0;
}

export default function InsightsTab({
  client,
  onRefreshed,
}: {
  client: LawyerClient;
  onRefreshed: (client: LawyerClient) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const insights = client.transcriptInsights;
  const hasInsights = !!insights && Object.keys(insights).length > 0;
  const hasTranscript = !!client.transcript;
  const confidence = hasInsights && insights ? confidenceOf(insights) : 0;
  const reasoning = hasInsights && insights ? String(insights.reasoning ?? "") : "";

  async function extract(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await providerFetch<{ success: boolean; insights: Record<string, unknown> }>(
        `/api/provider/clients/${client.id}/insights`,
        { method: "POST", body: JSON.stringify(body) },
      );
      onRefreshed({ ...client, transcriptInsights: res.insights ?? null });
      setManualText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setBusy(false);
    }
  }

  function renderField(key: string, label: string) {
    if (!insights) return null;
    const v = insights[key];
    if (v === undefined || v === null || v === "") return null;
    const display = Array.isArray(v) ? v.join(", ") : String(v);
    return (
      <div key={key} className={styles.row}>
        <span className={styles.key}>{label}</span>
        <span className={styles.value}>{display}</span>
      </div>
    );
  }

  return (
    <div className={styles.insights}>
      {hasInsights && insights ? (
        <>
          <div className={styles.hero}>
            <div className={styles.heroTop}>
              <span className={styles.heroBadge}>AI</span>
              <span className={styles.heroTitle}>Extracted from transcript</span>
            </div>

            {confidence > 0 && (
              <div className={styles.confidence}>
                <div className={styles.confidenceHead}>
                  <span className={styles.confidenceLabel}>Confidence</span>
                  <span className={styles.confidenceValue}>{confidence}%</span>
                </div>
                <div
                  className={styles.confidenceTrack}
                  role="progressbar"
                  aria-valuenow={confidence}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={styles.confidenceFill}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>
            )}

            {reasoning && <p className={styles.reasoning}>{reasoning}</p>}

            <div className={styles.grid}>
              {CORE_KEYS.map(({ key, label }) => renderField(key, label))}
            </div>
          </div>

          <button
            type="button"
            className={styles.advancedToggle}
            onClick={() => setShowAdvanced((s) => !s)}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? "Hide advanced fields" : "Show advanced fields"}
          </button>

          {showAdvanced && (
            <div className={styles.grid}>
              {ADVANCED_KEYS.map(({ key, label }) => renderField(key, label))}
            </div>
          )}

          <span className={styles.caption}>Source: AI extraction</span>
        </>
      ) : hasTranscript ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>⚙️</span>
          <p className={styles.emptyTitle}>Transcript ready, insights pending</p>
          <p className={styles.emptyDesc}>
            Run the extractor to classify the legal intake for this client.
          </p>
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📝</span>
          <p className={styles.emptyTitle}>No transcript on file</p>
          <p className={styles.emptyDesc}>
            Paste a transcript below to extract legal-intake fields.
          </p>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        {hasTranscript && (
          <button
            type="button"
            className={styles.extractBtn}
            disabled={busy}
            onClick={() => extract({})}
          >
            {busy ? "Extracting…" : "Re-extract from transcript"}
          </button>
        )}

        <textarea
          className={styles.textarea}
          placeholder="Paste a transcript snippet…"
          rows={4}
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
        />
        <button
          type="button"
          className={styles.extractBtn}
          disabled={busy || !manualText.trim()}
          onClick={() => extract({ manualText: manualText.trim() })}
        >
          {busy ? "Extracting…" : "Extract from paste"}
        </button>
      </div>
    </div>
  );
}