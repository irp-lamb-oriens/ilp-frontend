"use client";

import { useCallback, useEffect, useState } from "react";
import { providerFetch } from "@/lib/provider";
import { API_URL } from "@/lib/api";
import type { LawyerClient, Quote, QuoteStatus } from "./types";
import { QUOTE_STATUS_LABELS } from "./types";
import QuoteEditor from "./QuoteEditor";
import styles from "./quotesTab.module.scss";

function money(v: unknown, currency: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: typeof currency === "string" ? currency : "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_BASE = "https://internationallegalpartner.com/status";

export default function QuotesTab({ client }: { client: LawyerClient }) {
  const clientId = client.id;
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Quote | null | undefined>(undefined); // undefined = closed, null = new
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await providerFetch<{ quotes: Quote[] }>(
        `/api/provider/clients/${clientId}/quotes`,
      );
      setQuotes(res.quotes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quotes.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    setActionMsg(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(q: Quote) {
    await runAction(q.quoteId, async () => {
      const res = await providerFetch<{ quote: Quote }>(
        `/api/provider/clients/${clientId}/quotes/${q.quoteId}/duplicate`,
        { method: "POST" },
      );
      setEditing(res.quote);
    });
  }

  async function handleDelete(q: Quote) {
    if (!window.confirm(`Delete quote "${q.title}"? This cannot be undone.`)) return;
    await runAction(q.quoteId, async () => {
      await providerFetch(`/api/provider/clients/${clientId}/quotes/${q.quoteId}`, {
        method: "DELETE",
      });
    });
  }

  async function handleSubmit(q: Quote) {
    await runAction(q.quoteId, async () => {
      await providerFetch(`/api/provider/clients/${clientId}/quotes/${q.quoteId}/submit-for-approval`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    });
  }

  async function handleApprove(q: Quote) {
    await runAction(q.quoteId, async () => {
      await providerFetch(`/api/provider/clients/${clientId}/quotes/${q.quoteId}/approve`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    });
  }

  async function handleRequestChanges(q: Quote) {
    const comment = window.prompt("Describe the requested changes:");
    if (!comment?.trim()) return;
    await runAction(q.quoteId, async () => {
      await providerFetch(`/api/provider/clients/${clientId}/quotes/${q.quoteId}/request-changes`, {
        method: "POST",
        body: JSON.stringify({ comment: comment.trim() }),
      });
    });
  }

  async function handleSend(q: Quote) {
    await runAction(q.quoteId, async () => {
      await providerFetch(`/api/provider/clients/${clientId}/quotes/${q.quoteId}/send-to-client`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    });
  }

  async function handleContract(q: Quote) {
    setBusyId(q.quoteId);
    setActionMsg(null);
    try {
      const token = getProviderToken();
      const res = await fetch(
        `${API_URL}/api/provider/clients/${clientId}/quotes/${q.quoteId}/contract-pdf`,
        { headers: token ? { "x-provider-token": token } : {} },
      );
      if (!res.ok) {
        let message = `Download failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) message = String(data.error);
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${q.quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setBusyId(null);
    }
  }

  function portalUrl(q: Quote): string {
    const base = `${STATUS_BASE}/${clientId}`;
    return q.clientToken ? `${base}?quoteToken=${q.clientToken}` : base;
  }

  function handleSaved(q: Quote) {
    setEditing(undefined);
    load();
  }

  return (
    <div className={styles.quotes}>
      <div className={styles.toolbar}>
        <h3 className={styles.heading}>Quotes</h3>
        <button
          type="button"
          className={styles.newBtn}
          onClick={() => setEditing(null)}
        >
          New Quote +
        </button>
      </div>

      {actionMsg && <p className={styles.actionMsg}>{actionMsg}</p>}

      {editing !== undefined && (
        <div className={styles.editorWrap}>
          <QuoteEditor
            clientId={clientId}
            quote={editing}
            onSaved={handleSaved}
            onCancelled={() => setEditing(undefined)}
          />
        </div>
      )}

      {loading && <p className={styles.empty}>Loading quotes…</p>}
      {!loading && error && <p className={styles.error}>{error}</p>}
      {!loading && !error && quotes.length === 0 && editing === undefined && (
        <p className={styles.empty}>No quotes yet. Create the first quote for this client.</p>
      )}

      {quotes.map((q) => {
        const status = q.status as QuoteStatus;
        const lineCount = Array.isArray(q.lineItems) ? q.lineItems.length : 0;
        return (
          <div key={q.quoteId} className={styles.quote}>
            <div className={styles.quoteHead}>
              <span className={styles.title}>{q.title || "Untitled"}</span>
              <span className={`${styles.statusBadge} ${styles[`status_${status}`] ?? ""}`}>
                {QUOTE_STATUS_LABELS[status] ?? status}
              </span>
            </div>

            <div className={styles.meta}>
              <span className={styles.total}>{money(q.total, q.currency)}</span>
              <span className={styles.metaItem}>{lineCount} line item{lineCount !== 1 ? "s" : ""}</span>
              <span className={styles.metaItem}>{formatDate(q.createdAt)}</span>
            </div>

            {(status === "sent_to_client" || status === "client_accepted") && (
              <div className={styles.portalRow}>
                <a
                  className={styles.portalLink}
                  href={portalUrl(q)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {STATUS_BASE}/{clientId}
                </a>
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setEditing(q)}
              >
                Edit
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => handleDuplicate(q)}
                disabled={busyId === q.quoteId}
              >
                Duplicate
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.danger}`}
                onClick={() => handleDelete(q)}
                disabled={busyId === q.quoteId}
              >
                Delete
              </button>

              {(status === "draft" || status === "changes_requested") && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.primary}`}
                  onClick={() => handleSubmit(q)}
                  disabled={busyId === q.quoteId}
                >
                  Submit for approval
                </button>
              )}

              {status === "pending_approval" && (
                <>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.primary}`}
                    onClick={() => handleApprove(q)}
                    disabled={busyId === q.quoteId}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleRequestChanges(q)}
                    disabled={busyId === q.quoteId}
                  >
                    Request changes
                  </button>
                </>
              )}

              {status === "approved" && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.primary}`}
                  onClick={() => handleSend(q)}
                  disabled={busyId === q.quoteId}
                >
                  Send to client
                </button>
              )}

              {status === "client_accepted" && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handleContract(q)}
                  disabled={busyId === q.quoteId}
                >
                  Contract PDF
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getProviderToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("ilp_provider_token");
}