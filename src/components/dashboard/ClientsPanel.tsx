"use client";

import { useCallback, useEffect, useState } from "react";
import { dashboardFetch } from "@/lib/api";
import { usePaginatedSearch } from "@/lib/usePaginatedSearch";
import { SearchInput, Pagination } from "./ListControls";
import { Skeleton, SkeletonRegion, Tabs, useSkeleton, type TabItem, ErrorNotice } from "@/components/ui";
import ClientActions from "./ClientActions";
import CrmLilyTab from "./CrmLilyTab";
import EmailsTab from "./EmailsTab";
import styles from "./clientsPanel.module.scss";

export interface ClientSummary {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
  legalArea: string | null;
  legalMatter: string | null;
  jurisdiction: string | null;
  stage: string;
  stageEnteredAt: string | null;
  pendingCount: number;
  quotes: unknown[];
  charges: unknown[];
  notes: unknown[];
  activityLog: unknown[];
  pendingActions: unknown[];
  statusChatThread: unknown[];
  source: string | null;
  createdAt: string | null;
  lastUpdated: string | null;
}

/**
 * Staff CRM client list + detail panel. Fetches /api/dashboard/clients and
 * renders a selectable list plus a tabbed detail view (overview / notes /
 * activity / actions / lily / emails).
 */
export default function ClientsPanel() {
  const [clients, setClients] = useState<ClientSummary[] | null>(null);
  const [selected, setSelected] = useState<ClientSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await dashboardFetch<{ clients: ClientSummary[] }>("/api/dashboard/clients");
      setClients(res.clients ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The member list did not load.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stageLabel = (id: string) => id.replace(/_/g, " ");

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    total,
    totalPages,
  } = usePaginatedSearch<ClientSummary>(clients ?? [], {
    searchKeys: ["name", "surname", "email", "stage", "jurisdiction", "legalArea"],
    pageSize: 20,
  });

  const sk = useSkeleton(clients === null && !error);
  if (error) return <ErrorNotice audience="staff">{error}</ErrorNotice>;
  if (sk.showSkeleton || clients === null) {
    return (
      <SkeletonRegion label="Loading clients" visible={sk.skeletonVisible}>
        <ClientsPanelSkeleton />
      </SkeletonRegion>
    );
  }

  const c = selected;
  const notes = Array.isArray(c?.notes) ? (c.notes as Array<Record<string, unknown>>) : [];
  const activity = Array.isArray(c?.activityLog) ? (c.activityLog as Array<Record<string, unknown>>) : [];

  const detailTabs: TabItem[] = c
    ? [
        {
          id: "overview",
          label: "Overview",
          content: (
            <div className={styles.overview}>
              <Row label="Email" value={c.email} />
              <Row label="Phone" value={c.phone ?? "Not set"} />
              <Row label="Legal area" value={c.legalArea ?? "Not set"} />
              <Row label="Legal matter" value={c.legalMatter ?? "Not set"} />
              <Row label="Jurisdiction" value={c.jurisdiction ?? "Not set"} />
              <Row label="Source" value={c.source ?? "Not set"} />
              <Row label="Quotes" value={String(c.quotes?.length ?? 0)} />
              <Row label="Charges" value={String(c.charges?.length ?? 0)} />
              <Row label="Pending actions" value={String(c.pendingCount)} />
            </div>
          ),
        },
        {
          id: "notes",
          label: "Notes",
          content: (
            <div className={styles.list}>
              {notes.length === 0 && <p className={styles.empty}>No notes yet.</p>}
              {notes.map((n, i) => (
                <div key={i} className={styles.listCard}>
                  <div className={styles.listCardBody}>{String(n.text ?? "")}</div>
                  <div className={styles.listCardMeta}>
                    {String(n.author ?? "Unknown author")} · {String(n.createdAt ?? "")}
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: "activity",
          label: "Activity",
          content: (
            <div className={styles.list}>
              {activity.length === 0 && <p className={styles.empty}>No activity recorded yet.</p>}
              {activity.map((a, i) => (
                <div key={i} className={styles.activityRow}>
                  <span className={styles.activityTime}>{String(a.timestamp ?? "").slice(0, 19)}</span>
                  <span className={styles.activityText}>{String(a.type ?? a.actor ?? "")}</span>
                </div>
              ))}
            </div>
          ),
        },
        { id: "actions", label: "Actions", content: <ClientActions clientId={c.id} stage={c.stage} /> },
        { id: "lily", label: "Lily", content: <CrmLilyTab clientId={c.id} /> },
        { id: "emails", label: "Emails", content: <EmailsTab /> },
      ]
    : [];

  return (
    <section className={styles.section}>
      <div className={styles.listPane}>
        <h2 className={styles.listTitle}>Clients ({total})</h2>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search clients…"
          resultCount={total}
        />
        {pageItems.map((cl) => (
          <button
            key={cl.id}
            type="button"
            onClick={() => setSelected(cl)}
            className={`${styles.clientItem} ${
              selected?.id === cl.id ? styles.clientItemSelected : ""
            }`}
          >
            <div className={styles.clientName}>
              {[cl.name, cl.surname].filter(Boolean).join(" ") || cl.email}
            </div>
            <div className={styles.clientMeta}>
              {stageLabel(cl.stage)}
              {cl.pendingCount > 0 ? ` · ${cl.pendingCount} pending` : ""}
            </div>
          </button>
        ))}
        {pageItems.length === 0 && <p className={styles.empty}>No clients yet.</p>}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <div className={styles.detailPane}>
        {!c ? (
          <p className={styles.empty}>Pick a client from the list to see their details.</p>
        ) : (
          <>
            <div className={styles.detailHead}>
              <h2>{[c.name, c.surname].filter(Boolean).join(" ") || c.email}</h2>
              <span className={styles.stageBadge}>{stageLabel(c.stage)}</span>
            </div>

            <Tabs key={c.id} tabs={detailTabs} label="Client details" />
          </>
        )}
      </div>
    </section>
  );
}

/** Client list pane (title, search, rows) beside the empty detail pane. */
function ClientsPanelSkeleton() {
  return (
    <div className={styles.section} aria-hidden="true">
      <div className={styles.listPane}>
        <Skeleton shape="line" size="md" width="40" />
        <Skeleton shape="block" size="sm" />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={styles.clientItem}>
            <Skeleton shape="line" size="md" width={i % 2 ? "60" : "75"} />
            <Skeleton shape="line" size="xs" width="40" />
          </div>
        ))}
      </div>
      <div className={styles.detailPane}>
        <Skeleton shape="line" size="sm" width="40" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}