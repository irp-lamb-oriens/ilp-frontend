"use client";

import { useCallback, useEffect, useState } from "react";
import { providerFetch } from "@/lib/provider";
import { SkeletonRegion, useSkeleton, ErrorNotice } from "@/components/ui";
import { DeadlinesSkeleton } from "./LawyerSkeletons";
import styles from "./DeadlineEditor.module.scss";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface LegalPriority {
  id: string;
  country: string;
  category: string;
  title: string;
  description: string;
  dateFieldLabel: string;
  dateFieldHint?: string;
  reminderOffsetsDays: number[];
}

export interface UserDeadline {
  priorityId: string;
  date: string;
  note?: string;
  updatedAt: string;
}

export interface DeadlinesPayload {
  jurisdiction: string | null;
  countryCode: string | null;
  priorities: LegalPriority[];
  deadlines: Record<string, UserDeadline>;
}

/**
 * Role adapter: where the editor loads and saves. One editor serves the
 * lawyer inspector and (once W4 adopts it) the client portal.
 */
export interface DeadlineAdapter {
  load(): Promise<DeadlinesPayload>;
  save(priorityId: string, date: string): Promise<void>;
  remove(priorityId: string): Promise<void>;
}

/** Lawyer adapter: /api/provider/clients/:id/deadlines. */
export function providerDeadlineAdapter(clientId: string): DeadlineAdapter {
  const base = `/api/provider/clients/${encodeURIComponent(clientId)}/deadlines`;
  return {
    load: () => providerFetch<DeadlinesPayload>(base),
    save: async (id, date) => {
      await providerFetch(`${base}/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ date }) });
    },
    remove: async (id) => {
      await providerFetch(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}

/** Shared deadline editor: the country catalog's legal priorities with a date per priority. */
export default function DeadlineEditor({ adapter, emptyHint }: { adapter: DeadlineAdapter; emptyHint?: string }) {
  const [payload, setPayload] = useState<DeadlinesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adapter.load();
      setPayload(data);
      setDrafts(Object.fromEntries(Object.entries(data.deadlines).map(([k, d]) => [k, d.date])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The deadlines did not load.");
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  useEffect(() => {
    load();
  }, [load]);
  const sk = useSkeleton(loading && !payload);

  async function act(priorityId: string, fn: () => Promise<void>) {
    setBusyId(priorityId);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the deadline.");
    } finally {
      setBusyId(null);
    }
  }

  function save(priorityId: string) {
    const date = (drafts[priorityId] ?? "").trim();
    if (!DATE_RE.test(date)) {
      setError("Enter a valid date.");
      return;
    }
    act(priorityId, () => adapter.save(priorityId, date));
  }

  if (sk.showSkeleton) {
    return (
      <SkeletonRegion label="Loading deadlines" visible={sk.skeletonVisible}>
        <DeadlinesSkeleton />
      </SkeletonRegion>
    );
  }
  if (!payload) return <ErrorNotice audience="lawyer" title="Deadlines did not load">{error ?? "Could not load deadlines."}</ErrorNotice>;

  if (!payload.countryCode || payload.priorities.length === 0) {
    return (
      <div className={styles.wrap}>
        <p className={styles.empty}>
          {payload.jurisdiction
            ? `No deadlines are tracked for ${payload.jurisdiction} yet.`
            : emptyHint ?? "Set the jurisdiction to a supported country to see its legal deadlines."}
        </p>
      </div>
    );
  }

  const byCategory = new Map<string, LegalPriority[]>();
  for (const p of payload.priorities) byCategory.set(p.category, [...(byCategory.get(p.category) ?? []), p]);

  return (
    <div className={styles.wrap}>
      {error && <ErrorNotice audience="lawyer">{error}</ErrorNotice>}
      {Array.from(byCategory.entries()).map(([category, priorities]) => (
        <section key={category} className={styles.group}>
          <h3 className={styles.groupTitle}>{category}</h3>
          <ul className={styles.list}>
            {priorities.map((p) => {
              const saved = payload.deadlines[p.id];
              const busy = busyId === p.id;
              return (
                <li key={p.id} className={styles.row}>
                  <div className={styles.rowHead}>
                    <span className={styles.rowTitle}>{p.title}</span>
                    {saved && <span className={styles.savedBadge}>{saved.date}</span>}
                  </div>
                  <p className={styles.rowDesc}>{p.description}</p>
                  <div className={styles.rowControls}>
                    <label className={styles.dateLabel} htmlFor={`dl-${p.id}`}>{p.dateFieldLabel}</label>
                    <input
                      id={`dl-${p.id}`}
                      type="date"
                      className={styles.dateInput}
                      value={drafts[p.id] ?? ""}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <button type="button" className={styles.save} disabled={busy} onClick={() => save(p.id)}>
                      {saved ? "Update" : "Save"}
                    </button>
                    {saved && (
                      <button type="button" className={styles.clear} disabled={busy} onClick={() => act(p.id, () => adapter.remove(p.id))}>
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
