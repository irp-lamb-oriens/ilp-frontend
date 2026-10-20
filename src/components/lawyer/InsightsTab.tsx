"use client";

import { useState } from "react";
import { providerFetch } from "@/lib/provider";
import type { LawyerClient } from "./types";
import styles from "./insightsTab.module.scss";

const INSIGHT_KEYS: Array<{ key: string; label: string }> = [
  { key: "legalArea", label: "Legal area" },
  { key: "legalMatter", label: "Legal matter" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "name", label: "Name" },
  { key: "surname", label: "Surname" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
];

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

  const insights = client.transcriptInsights;
  const hasInsights = !!insights && Object.keys(insights).length > 0;
  const hasTranscript = !!client.transcript;

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

  return (
    <div className={styles.insights}>
      {hasInsights && insights ? (
        <div className={styles.grid}>
          {INSIGHT_KEYS.map(({ key, label }) => {
            const v = insights[key];
            if (v === undefined || v === null || v === "") return null;
            const display = Array.isArray(v) ? v.join(", ") : String(v);
            return (
              <div key={key} className={styles.row}>
                <span className={styles.key}>{label}</span>
                <span className={styles.value}>{display}</span>
              </div>
            );
          })}
          <span className={styles.caption}>Source: AI extraction</span>
        </div>
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