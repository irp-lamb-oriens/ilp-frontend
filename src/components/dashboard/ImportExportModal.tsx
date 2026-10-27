"use client";

import { useState } from "react";
import { Button, Drawer, Select, TextArea, useUnsavedChanges, ErrorNotice } from "@/components/ui";
import s from "./crm.module.scss";
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
  useUnsavedChanges(text.trim() !== "" && !result, "The pasted clients are not imported yet. If you close now, the text will be lost.");

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
    <Drawer
      open
      onClose={onClose}
      size="lg"
      title="Import clients"
      subtitle="Email is the identity key. The dry run shows what would happen before you commit."
    >
      <div className={s.stack}>
        <TextArea
          label={
            <>
              Paste a JSON array of clients (or an object with a <code>clients</code> array).
            </>
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder='[{"email":"person@example.com","name":"Ana","legalArea":"immigration","jurisdiction":"Costa Rica"}]'
        />

        {error && (
          <ErrorNotice audience="staff">{error}</ErrorNotice>
        )}

        <div className={s.row}>
          <Button variant="secondary" size="sm" onClick={runDryRun} disabled={busy}>
            Dry run
          </Button>
          <Select
            label="When a client exists"
            hideLabel
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as "skip" | "merge" | "overwrite")}
          >
            <option value="skip">Skip existing</option>
            <option value="merge">Merge</option>
            <option value="overwrite">Overwrite</option>
          </Select>
          <Button size="sm" onClick={runCommit} busy={busy}>
            Commit
          </Button>
        </div>

        {dry && (
          <div className={s.result}>
            <p className={s.meta}>
              {dry.total} total · {dry.newCount} new · {dry.duplicateCount} existing · {dry.invalid} invalid
            </p>
            {dry.records.slice(0, 20).map((r) => (
              <div key={r.index} className={s.resultRow}>
                <span className={r.valid ? (r.exists ? s.exists : s.new) : s.invalid}>
                  {r.valid ? (r.exists ? "Exists" : "New") : "Invalid"}
                </span>{" "}
                {r.email || r.docId || "(no id)"}
                {r.warnings.length > 0 && <span className={s.itemSub}> · {r.warnings.join("; ")}</span>}
              </div>
            ))}
          </div>
        )}

        {result && (
          <p className={s.ok} role="status">
            Done: {result.created} created, {result.updated} updated, {result.skipped} skipped.
          </p>
        )}
      </div>
    </Drawer>
  );
}
