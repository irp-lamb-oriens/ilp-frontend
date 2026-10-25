"use client";

import { useCallback, useEffect, useState } from "react";
import {
  statusFetch,
  type LegalPriority,
  type StatusDeadlinesPayload,
} from "@/lib/status";
import EmptyState from "@/components/status/EmptyState";
import { GhostField, GhostBadge } from "@/components/status/Ghost";
import s from "./deadlineConfig.module.scss";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Project-scoped deadline configuration. Reads the project's jurisdiction,
 * shows the matching country priorities grouped by category, and lets the
 * principal record / update / clear a date per priority. Persists to the
 * client doc via the client-status endpoints.
 */
export default function DeadlineConfig({ projectId }: { projectId: string }) {
  const [payload, setPayload] = useState<StatusDeadlinesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await statusFetch<StatusDeadlinesPayload>(
        `/api/client-status/project/${projectId}/deadlines`,
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
  }, [projectId]);

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
      await statusFetch(
        `/api/client-status/project/${projectId}/deadlines/${priorityId}`,
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
      await statusFetch(
        `/api/client-status/project/${projectId}/deadlines/${priorityId}`,
        { method: "DELETE" },
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear deadline.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className={s.empty}>Loading deadlines…</p>;

  if (!payload) {
    return <p className={s.error}>{error ?? "Could not load deadlines."}</p>;
  }

  if (!payload.countryCode || payload.priorities.length === 0) {
    return (
      <EmptyState
        title="Deadlines for your matter"
        explain={
          payload.jurisdiction
            ? `We do not track deadlines for ${payload.jurisdiction} yet. Once your matter's jurisdiction is recognized, its legal priorities appear here.`
            : "Once your matter's jurisdiction is set, its legal deadlines appear here."
        }
        steps={[
          "Your legal team records the jurisdiction on your matter.",
          "Each expected deadline appears as its own row.",
          "Record a date per priority and we remind you ahead of it.",
        ]}
      >
        <div className={s.ghostRowPreview}>
          <div className={s.ghostRowHead}>
            <GhostBadge>Priority</GhostBadge>
            <GhostBadge>YYYY-MM-DD</GhostBadge>
          </div>
          <GhostField label="Deadline date" width="40%" />
        </div>
      </EmptyState>
    );
  }

  const byCategory = new Map<string, LegalPriority[]>();
  for (const p of payload.priorities) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  return (
    <div className={s.wrap}>
      {error && <p className={s.error} role="alert">{error}</p>}

      {Array.from(byCategory.entries()).map(([category, priorities]) => (
        <section key={category} className={s.group}>
          <h3 className={s.groupTitle}>{category}</h3>
          <ul className={s.list}>
            {priorities.map((p) => {
              const saved = payload.deadlines[p.id];
              const draft = drafts[p.id] ?? "";
              const busy = busyId === p.id;
              return (
                <li key={p.id} className={s.row}>
                  <div className={s.rowHead}>
                    <span className={s.rowTitle}>{p.title}</span>
                    {saved && (
                      <span className={s.savedBadge}>
                        {saved.date}
                      </span>
                    )}
                  </div>
                  <p className={s.rowDesc}>{p.description}</p>
                  <div className={s.rowControls}>
                    <label className={s.dateLabel} htmlFor={`dl-${p.id}`}>
                      {p.dateFieldLabel}
                    </label>
                    <input
                      id={`dl-${p.id}`}
                      type="date"
                      className={s.dateInput}
                      value={draft}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className={s.save}
                      disabled={busy}
                      onClick={() => save(p.id)}
                    >
                      {saved ? "Update" : "Save"}
                    </button>
                    {saved && (
                      <button
                        type="button"
                        className={s.clear}
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