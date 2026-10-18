"use client";

import { useCallback, useEffect, useState } from "react";
import { dashboardFetch } from "@/lib/api";

interface EmailQueueItem {
  id: string;
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  status?: string;
  emailType?: string;
  createdAt?: string;
  sentAt?: string;
}

interface SentEmail extends EmailQueueItem {
  id: string;
}

/**
 * R5.2 — emails tab. Lists the pending email queue, supports send-now /
 * cancel, and previews a sent email via GET /api/dashboard/sent-emails/:id.
 */
export default function EmailsTab() {
  const [pending, setPending] = useState<EmailQueueItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<SentEmail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await dashboardFetch<{ pending: EmailQueueItem[] }>("/api/dashboard/pending-emails");
      setPending(res.pending ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email queue.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(id: string) {
    if (!window.confirm("Cancel this queued email?")) return;
    setBusy(`cancel-${id}`);
    setError(null);
    try {
      await dashboardFetch(`/api/dashboard/email-queue/${id}/cancel`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed.");
    } finally {
      setBusy(null);
    }
  }

  async function sendNow(id: string) {
    setBusy(`send-${id}`);
    setError(null);
    try {
      await dashboardFetch(`/api/dashboard/email-queue/${id}/send-now`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setBusy(null);
    }
  }

  async function openPreview(id: string) {
    setError(null);
    try {
      const doc = await dashboardFetch<SentEmail>(`/api/dashboard/sent-emails/${id}`);
      setPreview(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email.");
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {error && <p style={{ color: "#c0392b", fontSize: "0.85rem", margin: 0 }}>{error}</p>}
      {pending === null && <p style={{ color: "#7a8a96" }}>Loading…</p>}
      {pending !== null && pending.length === 0 && <p style={{ color: "#7a8a96" }}>No pending emails.</p>}

      {pending?.map((e) => (
        <div
          key={e.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "0.6rem",
            border: "1px solid rgba(18,59,93,0.14)",
            borderRadius: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "#202a33", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {e.subject ?? "(no subject)"}
            </div>
            <div style={{ color: "#7a8a96", fontSize: "0.8rem" }}>
              {e.to ?? "—"} · {e.emailType ?? e.status ?? "pending"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
            <button
              type="button"
              disabled={busy === `send-${e.id}`}
              onClick={() => sendNow(e.id)}
              style={PILL_PRIMARY}
            >
              {busy === `send-${e.id}` ? "…" : "Send now"}
            </button>
            <button
              type="button"
              disabled={busy === `cancel-${e.id}`}
              onClick={() => cancel(e.id)}
              style={PILL_GHOST}
            >
              Cancel
            </button>
            <button type="button" onClick={() => openPreview(e.id)} style={PILL_GHOST}>
              Preview
            </button>
          </div>
        </div>
      ))}

      {preview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(18,42,61,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
          }}
          onClick={() => setPreview(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "1.25rem",
              maxWidth: 640,
              width: "90%",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ margin: 0, color: "#123b5d" }}>{preview.subject ?? "(no subject)"}</h3>
              <button type="button" onClick={() => setPreview(null)} style={{ border: "none", background: "transparent", fontSize: "1.3rem", cursor: "pointer" }}>
                ×
              </button>
            </div>
            <p style={{ color: "#7a8a96", fontSize: "0.8rem" }}>To: {preview.to ?? "—"}</p>
            {preview.html ? (
              <iframe
                title="Email preview"
                srcDoc={preview.html}
                style={{ width: "100%", height: 420, border: "1px solid rgba(18,59,93,0.14)", borderRadius: 10 }}
              />
            ) : (
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", color: "#202a33" }}>
                {preview.text ?? "(no body)"}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const PILL_PRIMARY: React.CSSProperties = {
  padding: "0.35rem 0.7rem",
  border: "none",
  borderRadius: 999,
  background: "#5cccf7",
  color: "#123b5d",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.8rem",
};

const PILL_GHOST: React.CSSProperties = {
  padding: "0.35rem 0.7rem",
  border: "1px solid rgba(18,59,93,0.14)",
  borderRadius: 999,
  background: "transparent",
  color: "#4a5a66",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.8rem",
};