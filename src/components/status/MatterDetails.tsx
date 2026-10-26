"use client";

import { useEffect, useState } from "react";
import { statusFetch, type ClientField } from "@/lib/status";
import DeadlineConfig from "@/components/status/DeadlineConfig";
import EmptyState from "@/components/status/EmptyState";
import { GhostField } from "@/components/status/Ghost";
import s from "./matterDetails.module.scss";

const SUPPORTED_COUNTRIES = [
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panama" },
  { code: "MX", name: "Mexico" },
  { code: "CO", name: "Colombia" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
];

/**
 * Merged "Your details" surface: the client-editable matter fields (legal
 * area, matter type, jurisdiction) rendered as custom inputs, with the
 * deadline configuration directly below. The principal edits and saves each
 * field; staff viewers see the same values read-only. Persists through the
 * client-status details endpoint.
 */
export default function MatterDetails({
  projectId,
  clientFields,
  jurisdiction,
  viewerIsPrincipal,
  onFieldSaved,
}: {
  projectId: string;
  clientFields: ClientField[];
  jurisdiction: string | null;
  viewerIsPrincipal: boolean;
  onFieldSaved: (fieldId: string, value: string) => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [localJurisdiction, setLocalJurisdiction] = useState<string>(jurisdiction ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Seed drafts once from the initial payload. Subsequent saves update local
  // state directly so in-progress edits in other fields are never clobbered.
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const f of clientFields) {
      initial[f.id] = f.value == null ? "" : String(f.value);
    }
    setFields(initial);
    setLocalJurisdiction(jurisdiction ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editable = clientFields.filter((f) => f.editable);

  async function save(field: ClientField) {
    const value = (fields[field.id] ?? "").trim();
    setBusyId(field.id);
    setError(null);
    setNotice(null);
    try {
      await statusFetch(`/api/client-status/project/${projectId}/details`, {
        method: "PATCH",
        body: JSON.stringify({ [field.id]: value }),
      });
      setFields((prev) => ({ ...prev, [field.id]: value }));
      if (field.id === "jurisdiction") {
        setLocalJurisdiction(value);
      }
      onFieldSaved(field.id, value);
      setNotice(`${field.label} saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setBusyId(null);
    }
  }

  function renderInput(field: ClientField) {
    const value = fields[field.id] ?? "";
    const busy = busyId === field.id;

    if (field.id === "jurisdiction") {
      return (
        <select
          id={`field-${field.id}`}
          className={s.input}
          value={value}
          onChange={(e) => setFields((p) => ({ ...p, [field.id]: e.target.value }))}
          disabled={busy}
        >
          <option value="">Select a country…</option>
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      );
    }

    if (field.valueType === "enum" && field.options?.length) {
      return (
        <select
          id={`field-${field.id}`}
          className={s.input}
          value={value}
          onChange={(e) => setFields((p) => ({ ...p, [field.id]: e.target.value }))}
          disabled={busy}
        >
          <option value="">Select…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }

    if (field.valueType === "text") {
      return (
        <textarea
          id={`field-${field.id}`}
          className={s.input}
          value={value}
          onChange={(e) => setFields((p) => ({ ...p, [field.id]: e.target.value }))}
          disabled={busy}
          placeholder={field.placeholder}
        />
      );
    }

    if (field.valueType === "date") {
      return (
        <input
          id={`field-${field.id}`}
          type="date"
          className={s.input}
          value={value}
          onChange={(e) => setFields((p) => ({ ...p, [field.id]: e.target.value }))}
          disabled={busy}
        />
      );
    }

    if (field.valueType === "number") {
      return (
        <input
          id={`field-${field.id}`}
          type="number"
          className={s.input}
          value={value}
          onChange={(e) => setFields((p) => ({ ...p, [field.id]: e.target.value }))}
          disabled={busy}
        />
      );
    }

    if (field.valueType === "boolean") {
      return (
        <input
          id={`field-${field.id}`}
          type="checkbox"
          className={s.checkbox}
          checked={value === "true" || value === "yes" || value === "1"}
          onChange={(e) =>
            setFields((p) => ({ ...p, [field.id]: e.target.checked ? "true" : "false" }))
          }
          disabled={busy}
        />
      );
    }

    return (
      <input
        id={`field-${field.id}`}
        type={field.valueType === "email" ? "email" : "text"}
        className={s.input}
        value={value}
        onChange={(e) => setFields((p) => ({ ...p, [field.id]: e.target.value }))}
        disabled={busy}
        placeholder={field.placeholder}
      />
    );
  }

  return (
    <div className={s.wrap}>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}

      <section className={s.section}>
        <h3 className={s.sectionTitle}>Your details</h3>

        {editable.length === 0 ? (
          <EmptyState
            title="The details of your matter"
            explain="Fields describing your matter appear here as your legal team records them."
            steps={[
              "Your team captures the legal area and matter type first.",
              "Jurisdiction and documents follow as the case forms.",
              "Fields marked editable can be updated by you directly.",
            ]}
          >
            <GhostField label="Legal area" width="55%" />
            <GhostField label="Matter type" width="65%" />
            <GhostField label="Jurisdiction" width="40%" />
          </EmptyState>
        ) : viewerIsPrincipal ? (
          <ul className={s.list}>
            {editable.map((f) => (
              <li key={f.id} className={s.row}>
                <label className={s.label} htmlFor={`field-${f.id}`}>
                  {f.label}
                </label>
                <div className={s.controls}>
                  {renderInput(f)}
                  <button
                    type="button"
                    className={s.save}
                    disabled={busyId === f.id}
                    onClick={() => save(f)}
                  >
                    {busyId === f.id ? "Saving…" : "Save"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className={s.list}>
            {editable.map((f) => (
              <li key={f.id} className={s.row}>
                <span className={s.label}>{f.label}</span>
                <span className={s.value}>
                  {f.value == null || f.value === "" ? "—" : String(f.value)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.section}>
        <h3 className={s.sectionTitle}>Deadlines</h3>
        <DeadlineConfig key={localJurisdiction || "none"} projectId={projectId} />
      </section>
    </div>
  );
}