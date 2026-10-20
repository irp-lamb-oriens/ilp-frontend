"use client";

import { useState } from "react";
import { providerFetch } from "@/lib/provider";
import type { LawyerClient } from "./types";
import styles from "./overviewTab.module.scss";

interface FieldDef {
  key: string;
  label: string;
  group: "identity" | "matter" | "meta";
  editable: boolean;
}

const FIELDS: FieldDef[] = [
  { key: "name", label: "First name", group: "identity", editable: true },
  { key: "surname", label: "Surname", group: "identity", editable: true },
  { key: "email", label: "Email", group: "identity", editable: false },
  { key: "phone", label: "Phone", group: "identity", editable: true },
  { key: "legalArea", label: "Legal area", group: "matter", editable: true },
  { key: "legalMatter", label: "Legal matter", group: "matter", editable: true },
  { key: "jurisdiction", label: "Jurisdiction", group: "matter", editable: true },
  { key: "source", label: "Source", group: "meta", editable: false },
];

const GROUP_LABELS: Record<FieldDef["group"], string> = {
  identity: "Identity",
  matter: "Legal matter",
  meta: "Details",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

export default function OverviewTab({
  client,
  onRefreshed,
}: {
  client: LawyerClient;
  onRefreshed: (client: LawyerClient) => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankDraft, setRankDraft] = useState<string>(
    client.rankIndex != null ? String(client.rankIndex) : "",
  );

  const docs = Array.isArray(client.documents) ? client.documents : [];
  const docLabel = (d: (typeof docs)[number]): string => {
    if (d && typeof d === "object" && "name" in d) {
      return String(d.name ?? "Untitled document");
    }
    return String(d ?? "");
  };
  const customEntries = Object.entries(client.customFields ?? {});

  function valueOf(key: string): string {
    const v = (client as unknown as Record<string, unknown>)[key];
    return v == null ? "" : String(v);
  }

  function startEdit(key: string) {
    setEditingKey(key);
    setDraft(valueOf(key));
    setError(null);
  }

  async function saveEdit(key: string) {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await providerFetch(`/api/provider/clients/${client.id}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field: key, value: draft.trim() }),
      });
      onRefreshed({ ...client, [key]: draft.trim() } as unknown as LawyerClient);
      setEditingKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save field.");
    } finally {
      setSaving(false);
    }
  }

  async function applyRank() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const parsed = rankDraft.trim() === "" ? null : Number(rankDraft);
    const value =
      parsed != null && Number.isFinite(parsed) ? Math.trunc(parsed) : null;
    try {
      await providerFetch(`/api/provider/clients/${client.id}/field`, {
        method: "PATCH",
        body: JSON.stringify({ field: "rankIndex", value }),
      });
      onRefreshed({ ...client, rankIndex: value } as unknown as LawyerClient);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update priority.");
    } finally {
      setSaving(false);
    }
  }

  const groups: FieldDef["group"][] = ["identity", "matter", "meta"];

  return (
    <div className={styles.overview}>
      <div className={styles.rankBlock}>
        <span className={styles.rankLabel}>Priority</span>
        <div className={styles.rankControls}>
          <input
            className={styles.rankInput}
            type="number"
            inputMode="numeric"
            placeholder="—"
            value={rankDraft}
            onChange={(e) => setRankDraft(e.target.value)}
          />
          <button
            type="button"
            className={styles.rankBtn}
            disabled={saving}
            onClick={applyRank}
          >
            {saving ? "…" : "Set"}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {groups.map((group) => {
        const fields = FIELDS.filter((f) => f.group === group);
        return (
          <div key={group} className={styles.group}>
            <span className={styles.groupLabel}>{GROUP_LABELS[group]}</span>
            {fields.map((f) => {
              const isEditing = editingKey === f.key;
              return (
                <div key={f.key} className={styles.row}>
                  <span className={styles.label}>{f.label}</span>
                  {isEditing ? (
                    <div className={styles.editRow}>
                      <input
                        className={styles.editInput}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className={styles.saveBtn}
                        disabled={saving}
                        onClick={() => saveEdit(f.key)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        disabled={saving}
                        onClick={() => setEditingKey(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className={styles.valueRow}>
                      <span className={styles.value}>
                        {valueOf(f.key) || "—"}
                      </span>
                      {f.editable && (
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => startEdit(f.key)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div className={styles.group}>
        <span className={styles.groupLabel}>Details</span>
        <div className={styles.row}>
          <span className={styles.label}>Created</span>
          <span className={styles.value}>{fmtDate(client.createdAt)}</span>
        </div>
      </div>

      <div className={styles.block}>
        <span className={styles.blockLabel}>Documents</span>
        {docs.length === 0 ? (
          <span className={styles.muted}>—</span>
        ) : (
          <div className={styles.docList}>
            {docs.map((d, i) => (
              <span key={i} className={styles.docChip}>
                {docLabel(d)}
              </span>
            ))}
          </div>
        )}
      </div>

      {customEntries.length > 0 && (
        <div className={styles.block}>
          <span className={styles.blockLabel}>Custom fields</span>
          <div className={styles.customFields}>
            {customEntries.map(([k, v]) => (
              <div key={k} className={styles.customRow}>
                <span className={styles.customKey}>{k}</span>
                <span className={styles.customValue}>{String(v ?? "—")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}