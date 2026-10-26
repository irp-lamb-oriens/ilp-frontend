"use client";

import { useEffect, useState } from "react";
import { statusFetch, type ClientField } from "@/lib/status";
import DeadlineConfig from "@/components/status/DeadlineConfig";
import EmptyState from "@/components/status/EmptyState";
import { GhostField } from "@/components/status/Ghost";
import FieldShell from "@/components/status/fields/FieldShell";
import JurisdictionInput from "@/components/status/fields/JurisdictionInput";
import LegalAreaInput from "@/components/status/fields/LegalAreaInput";
import LegalMatterInput from "@/components/status/fields/LegalMatterInput";
import { areaLabel, matterLabel } from "@/components/status/fields/legalTree";
import s from "./matterDetails.module.scss";

/**
 * Merged "Your details" surface. The three client-editable matter fields
 * (jurisdiction, legal area, legal matter) each get a dedicated custom input
 * plus a dynamic implication line explaining what changing the value does;
 * the deadline configuration sits directly below. The principal edits and
 * saves each field; staff viewers see the same values read-only. Persists
 * through the client-status details endpoint.
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
  const [savedFields, setSavedFields] = useState<Record<string, string>>({});
  const [localJurisdiction, setLocalJurisdiction] = useState<string>(jurisdiction ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Seed drafts and saved values once from the initial payload. Subsequent
  // saves update local state directly so in-progress edits in other fields are
  // never clobbered.
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const f of clientFields) {
      initial[f.id] = f.value == null ? "" : String(f.value);
    }
    setFields(initial);
    setSavedFields(initial);
    setLocalJurisdiction(jurisdiction ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editable = clientFields.filter((f) => f.editable);
  const byId = (id: string) => editable.find((f) => f.id === id);

  const jurisdictionField = byId("jurisdiction");
  const legalAreaField = byId("legalArea");
  const legalMatterField = byId("legalMatter");

  async function save(fieldId: string, value: string) {
    setBusyId(fieldId);
    setError(null);
    setNotice(null);
    try {
      await statusFetch(`/api/client-status/project/${projectId}/details`, {
        method: "PATCH",
        body: JSON.stringify({ [fieldId]: value }),
      });
      setFields((prev) => ({ ...prev, [fieldId]: value }));
      setSavedFields((prev) => ({ ...prev, [fieldId]: value }));
      if (fieldId === "jurisdiction") {
        setLocalJurisdiction(value);
      }
      onFieldSaved(fieldId, value);
      setNotice("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setBusyId(null);
    }
  }

  function setField(fieldId: string, value: string) {
    setFields((prev) => ({ ...prev, [fieldId]: value }));
  }

  // ── Dynamic implications ───────────────────────────────────────────────────

  function jurisdictionImplication(): string {
    const saved = savedFields.jurisdiction ?? "";
    const draft = fields.jurisdiction ?? "";
    if (draft === saved) {
      return saved
        ? `Your deadlines below are resolved for ${saved}.`
        : "Select a country to see its legal deadlines below.";
    }
    if (!saved) {
      return `Saving will show ${draft}'s legal deadlines below.`;
    }
    return `Saving will switch the deadlines below from ${saved} to ${draft}. Deadlines recorded for ${saved} stop sending reminders; ${draft}'s priorities appear instead.`;
  }

  function legalAreaImplication(): string {
    const saved = savedFields.legalArea ?? "";
    const draft = fields.legalArea ?? "";
    if (draft === saved) {
      return saved
        ? `Your matter options below follow ${areaLabel(saved)}.`
        : "Choose an area to unlock its matter options.";
    }
    if (!saved) {
      return `Saving will unlock ${areaLabel(draft)}'s matter options.`;
    }
    return `Saving will change the area from ${areaLabel(saved)} to ${areaLabel(draft)}. If your current matter is not part of ${areaLabel(draft)}, you will need to pick a new one.`;
  }

  function legalMatterImplication(): string {
    const saved = savedFields.legalMatter ?? "";
    const draft = fields.legalMatter ?? "";
    if (draft === saved) {
      return saved
        ? `Your matter is recorded as ${matterLabel(saved)}.`
        : "Pick a matter under your legal area.";
    }
    if (!saved) {
      return `Saving will record ${matterLabel(draft)} as your matter.`;
    }
    return `Saving will change your matter from ${matterLabel(saved)} to ${matterLabel(draft)}.`;
  }

  if (editable.length === 0) {
    return (
      <div className={s.wrap}>
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
      </div>
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

        {viewerIsPrincipal ? (
          <div className={s.fieldStack}>
            {jurisdictionField && (
              <FieldShell
                label={jurisdictionField.label}
                hint="Drives which legal deadlines appear below"
                implication={jurisdictionImplication()}
                busy={busyId === "jurisdiction"}
                onSave={() => save("jurisdiction", fields.jurisdiction ?? "")}
              >
                <JurisdictionInput
                  value={fields.jurisdiction ?? ""}
                  onChange={(v) => setField("jurisdiction", v)}
                />
              </FieldShell>
            )}

            {legalAreaField && (
              <FieldShell
                label={legalAreaField.label}
                implication={legalAreaImplication()}
                busy={busyId === "legalArea"}
                onSave={() => save("legalArea", fields.legalArea ?? "")}
              >
                <LegalAreaInput
                  value={fields.legalArea ?? ""}
                  onChange={(v) => setField("legalArea", v)}
                />
              </FieldShell>
            )}

            {legalMatterField && (
              <FieldShell
                label={legalMatterField.label}
                hint="Options depend on your legal area"
                implication={legalMatterImplication()}
                busy={busyId === "legalMatter"}
                onSave={() => save("legalMatter", fields.legalMatter ?? "")}
              >
                <LegalMatterInput
                  areaId={fields.legalArea ?? ""}
                  value={fields.legalMatter ?? ""}
                  onChange={(v) => setField("legalMatter", v)}
                />
              </FieldShell>
            )}
          </div>
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