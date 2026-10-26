"use client";

import { useCallback, useEffect, useState } from "react";
import { providerFetch } from "@/lib/provider";
import type { LawyerClient } from "./types";
import styles from "./deadlinesTab.module.scss";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface LegalPriority {
  id: string;
  country: string;
  category: string;
  title: string;
  description: string;
  dateFieldLabel: string;
  dateFieldHint?: string;
  reminderOffsetsDays: number[];
}

interface UserDeadline {
  priorityId: string;
  date: string;
  note?: string;
  updatedAt: string;
}

interface DeadlinesPayload {
  jurisdiction: string | null;
  countryCode: string | null;
  priorities: LegalPriority[];
  deadlines: Record<string, UserDeadline>;
}

/**
 * Lawyer-side deadline configuration for a single client. Mirrors the
 * client-status DeadlineConfig but targets the provider endpoints, so the
 * lawyer can record, update, and clear the same deadlines the client sees.
 */
export default function DeadlinesTab({ client }: { client: LawyerClient }) {
  const [payload, setPayload] = useState<DeadlinesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await providerFetch<DeadlinesPayload>(
        `/api/provider/clients/${client.id}/deadlines`,
      );
      setPayload(data);
      const initial: Record<string, string> = {};
      for (const [pid, d] of Object.entries(data.deadlines)) {
        initial[pid] = d.date;
      }
      setDrafts(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deadlines.");
    } finally {
      setLoading(false);
    }
  }, [client.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(priorityId: string) {
    const date = (drafts[priorityId] ?? "").trim();
    if (!DATE_RE.test(date)) {
      setError("Enter a valid date (YYYY-MM-DD).");
      return;
    }
    setBusyId(priorityId);
    setError(null);
    try {
      await providerFetch(
        `/api/provider/clients/${client.id}/deadlines/${priorityId}`,
        { method: "PUT", body: JSON.stringify({ date }) },
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save deadline.");
    } finally {
      setBusyId(null);
    }
  }

  async function clear(priorityId: string) {
    setBusyId(priorityId);
    setError(null);
    try {
      await providerFetch(
        `/api/provider/clients/${client.id}/deadlines/${priorityId}`,
        { method: "DELETE" },
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear deadline.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className={styles.empty}>Loading deadlines…</p>;

  if (!payload) {
    return <p className={styles.error}>{error ?? "Could not load deadlines."}</p>;
  }

  if (!payload.countryCode || payload.priorities.length === 0) {
    return (
      <div className={styles.wrap}>
        <p className={styles.empty}>
          {payload.jurisdiction
            ? `No deadlines are tracked for ${payload.jurisdiction} yet. Set the client's jurisdiction to a supported country to see its legal priorities.`
            : "Set the client's jurisdiction to a supported country to see its legal deadlines."}
        </p>
      </div>
    );
  }

  const byCategory = new Map<string, LegalPriority[]>();
  for (const p of payload.priorities) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  return (
    <div className={styles.wrap}>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {Array.from(byCategory.entries()).map(([category, priorities]) => (
        <section key={category} className={styles.group}>
          <h3 className={styles.groupTitle}>{category}</h3>
          <ul className={styles.list}>
            {priorities.map((p) => {
              const saved = payload.deadlines[p.id];
              const draft = drafts[p.id] ?? "";
              const busy = busyId === p.id;
              return (
                <li key={p.id} className={styles.row}>
                  <div className={styles.rowHead}>
                    <span className={styles.rowTitle}>{p.title}</span>
                    {saved && (
                      <span className={styles.savedBadge}>{saved.date}</span>
                    )}
                  </div>
                  <p className={styles.rowDesc}>{p.description}</p>
                  <div className={styles.rowControls}>
                    <label className={styles.dateLabel} htmlFor={`dl-${p.id}`}>
                      {p.dateFieldLabel}
                    </label>
                    <input
                      id={`dl-${p.id}`}
                      type="date"
                      className={styles.dateInput}
                      value={draft}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className={styles.save}
                      disabled={busy}
                      onClick={() => save(p.id)}
                    >
                      {saved ? "Update" : "Save"}
                    </button>
                    {saved && (
                      <button
                        type="button"
                        className={styles.clear}
                        disabled={busy}
                        onClick={() => clear(p.id)}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}