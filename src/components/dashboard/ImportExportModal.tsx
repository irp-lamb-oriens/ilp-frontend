"use client";

import { useState } from "react";
import { dashboardFetch, ApiError } from "@/lib/api";

interface DryRunResult {
  total: number;
  valid: number;
  invalid: number;
  newCount: number;
  duplicateCount: number;
  records: Array<{
    index: number;
    docId: string | null;
    email: string;
    valid: boolean;
    exists: boolean;
    missingRequired: string[];
    warnings: string[];
  }>;
  expectedFields: Array<{ id: string; label: string; valueType: string; required: boolean; scope: string }>;
}

/**
 * Client import modal (R5.8). Pastes a JSON array (or { clients: [...] }) and
 * runs the backend dry-run → commit flow against the dashboard bulk-import
 * endpoints.
 */
export default function ImportExportModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [dry, setDry] = useState<DryRunResult | null>(null);
  const [strategy, setStrategy] = useState<"skip" | "merge" | "overwrite">("skip");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  function parse(): unknown[] {
    try {
      const raw = JSON.parse(text);
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray(raw.clients)) return raw.clients;
      if (raw && Array.isArray(raw.records)) return raw.records;
      return [];
    } catch {
      return [];
    }
  }

  async function runDryRun() {
    const records = parse();
    if (records.length === 0) {
      setError("Invalid JSON. Paste an array of client objects.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await dashboardFetch<DryRunResult>("/api/dashboard/import/clients/dry-run", {
        method: "POST",
        body: JSON.stringify({ records }),
      });
      setDry(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dry-run failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    const records = parse();
    if (records.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await dashboardFetch<{ created: number; updated: number; skipped: number }>(
        "/api/dashboard/import/clients/commit",
        { method: "POST", body: JSON.stringify({ records, defaultStrategy: strategy }) },
      );
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(18,42,61,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(18,59,93,0.14)",
          borderRadius: 14,
          padding: "1.25rem",
          maxWidth: 640,
          width: "90%",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#123b5d" }}>Import clients</h2>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", fontSize: "1.3rem", cursor: "pointer" }}>
            ×
          </button>
        </div>

        <p style={{ color: "#4a5a66", fontSize: "0.85rem" }}>
          Paste a JSON array of clients (or an object with a <code>clients</code> array).
          Email is the identity key; the dry-run shows what would happen before you commit.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder='[{"email":"person@example.com","name":"Ana","legalArea":"immigration","jurisdiction":"Costa Rica"}]'
          style={{ width: "100%", padding: "0.75rem", border: "1px solid rgba(18,59,93,0.14)", borderRadius: 10, fontFamily: "monospace", fontSize: "0.8rem" }}
        />

        {error && <p style={{ color: "#c0392b", fontSize: "0.85rem" }}>{error}</p>}

        <div style={{ display: "flex", gap: "0.5rem", marginBlock: "0.75rem" }}>
          <button type="button" onClick={runDryRun} disabled={busy} style={{ padding: "0.5rem 0.9rem", border: "1px solid rgba(18,59,93,0.14)", borderRadius: 999, background: "transparent", cursor: "pointer", fontWeight: 600 }}>
            Dry run
          </button>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as "skip" | "merge" | "overwrite")}
            style={{ padding: "0.5rem", border: "1px solid rgba(18,59,93,0.14)", borderRadius: 999 }}
          >
            <option value="skip">Skip existing</option>
            <option value="merge">Merge</option>
            <option value="overwrite">Overwrite</option>
          </select>
          <button type="button" onClick={runCommit} disabled={busy} style={{ padding: "0.5rem 0.9rem", border: "none", borderRadius: 999, background: "#5cccf7", color: "#123b5d", cursor: "pointer", fontWeight: 600 }}>
            {busy ? "Working…" : "Commit"}
          </button>
        </div>

        {dry && (
          <div style={{ border: "1px solid rgba(18,59,93,0.14)", borderRadius: 10, padding: "0.75rem", marginTop: "0.5rem" }}>
            <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {dry.total} total · {dry.newCount} new · {dry.duplicateCount} existing · {dry.invalid} invalid
            </div>
            {dry.records.slice(0, 20).map((r) => (
              <div key={r.index} style={{ fontSize: "0.8rem", padding: "0.3rem 0", borderBottom: "1px solid #f0f4f7" }}>
                <span style={{ color: r.valid ? (r.exists ? "#b7791f" : "#1f7a5c") : "#c0392b", fontWeight: 600 }}>
                  {r.valid ? (r.exists ? "EXISTS" : "NEW") : "INVALID"}
                </span>
                {" "}{r.email || r.docId || "(no id)"}
                {r.warnings.length > 0 && <span style={{ color: "#7a8a96" }}> · {r.warnings.join("; ")}</span>}
              </div>
            ))}
          </div>
        )}

        {result && (
          <p style={{ color: "#1f7a5c", fontSize: "0.9rem" }}>
            Done — {result.created} created, {result.updated} updated, {result.skipped} skipped.
          </p>
        )}
      </div>
    </div>
  );
}