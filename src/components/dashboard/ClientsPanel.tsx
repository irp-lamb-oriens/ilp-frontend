"use client";

import { useCallback, useEffect, useState } from "react";
import { dashboardFetch } from "@/lib/api";
import { usePaginatedSearch } from "@/lib/usePaginatedSearch";
import { SearchInput, Pagination } from "./ListControls";
import AnimatedTabs, { type TabItem } from "@/components/AnimatedTabs";
import ClientActions from "./ClientActions";
import CrmLilyTab from "./CrmLilyTab";
import EmailsTab from "./EmailsTab";

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
 * activity). This is the primary missing dashboard UI (R5.1).
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
      setError(err instanceof Error ? err.message : "Failed to load clients.");
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

  if (error) return <p style={{ color: "#c0392b" }}>{error}</p>;
  if (clients === null) return <p style={{ color: "#4a5a66" }}>Loading clients…</p>;

  const c = selected;
  const notes = Array.isArray(c?.notes) ? (c.notes as Array<Record<string, unknown>>) : [];
  const activity = Array.isArray(c?.activityLog) ? (c.activityLog as Array<Record<string, unknown>>) : [];

  const detailTabs: TabItem[] = c
    ? [
        {
          id: "overview",
          label: "Overview",
          content: (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <Row label="Email" value={c.email} />
              <Row label="Phone" value={c.phone ?? "—"} />
              <Row label="Legal area" value={c.legalArea ?? "—"} />
              <Row label="Legal matter" value={c.legalMatter ?? "—"} />
              <Row label="Jurisdiction" value={c.jurisdiction ?? "—"} />
              <Row label="Source" value={c.source ?? "—"} />
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
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {notes.length === 0 && <p style={{ color: "#7a8a96" }}>No notes.</p>}
              {notes.map((n, i) => (
                <div key={i} style={{ border: "1px solid rgba(18,59,93,0.14)", borderRadius: 10, padding: "0.6rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "#202a33" }}>{String(n.text ?? "")}</div>
                  <div style={{ fontSize: "0.75rem", color: "#7a8a96" }}>
                    {String(n.author ?? "—")} · {String(n.createdAt ?? "")}
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
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {activity.length === 0 && <p style={{ color: "#7a8a96" }}>No activity.</p>}
              {activity.map((a, i) => (
                <div key={i} style={{ fontSize: "0.85rem", display: "flex", gap: "0.75rem" }}>
                  <span style={{ color: "#7a8a96", whiteSpace: "nowrap" }}>{String(a.timestamp ?? "").slice(0, 19)}</span>
                  <span style={{ color: "#202a33" }}>{String(a.type ?? a.actor ?? "")}</span>
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
    <section style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "280px 1fr", gap: "1rem", alignItems: "start" }}>
      <div style={{ background: "#fff", border: "1px solid rgba(18,59,93,0.14)", borderRadius: 14, padding: "0.75rem", maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ fontWeight: 600, color: "#123b5d", marginBottom: "0.5rem" }}>
          Clients ({total})
        </div>
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
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.5rem 0.6rem",
              border: "none",
              borderRadius: 8,
              background: selected?.id === cl.id ? "#eaf7fd" : "transparent",
              cursor: "pointer",
              marginBottom: "0.25rem",
            }}
          >
            <div style={{ fontWeight: 600, color: "#202a33", fontSize: "0.9rem" }}>
              {[cl.name, cl.surname].filter(Boolean).join(" ") || cl.email}
            </div>
            <div style={{ color: "#7a8a96", fontSize: "0.8rem" }}>
              {stageLabel(cl.stage)}
              {cl.pendingCount > 0 ? ` · ${cl.pendingCount} pending` : ""}
            </div>
          </button>
        ))}
        {pageItems.length === 0 && <p style={{ color: "#7a8a96", fontSize: "0.85rem" }}>No clients yet.</p>}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(18,59,93,0.14)", borderRadius: 14, padding: "1rem", minHeight: 400 }}>
        {!c ? (
          <p style={{ color: "#7a8a96" }}>Select a client to see details.</p>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#123b5d" }}>
                {[c.name, c.surname].filter(Boolean).join(" ") || c.email}
              </h2>
              <span style={{ color: "#123b5d", backgroundColor: "#eaf7fd", borderRadius: 999, padding: "0.15rem 0.7rem", fontSize: "0.8rem" }}>
                {stageLabel(c.stage)}
              </span>
            </div>

            <AnimatedTabs tabs={detailTabs} defaultTab="overview" />
          </>
        )}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.9rem" }}>
      <span style={{ color: "#7a8a96", minWidth: 120 }}>{label}</span>
      <span style={{ color: "#202a33" }}>{value}</span>
    </div>
  );
}