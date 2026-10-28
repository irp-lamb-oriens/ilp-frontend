"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Drawer, Loadable, Skeleton, ErrorNotice } from "@/components/ui";
import s from "./crm.module.scss";
import { dashboardFetch } from "@/lib/api";
import { usePaginatedSearch } from "@/lib/usePaginatedSearch";
import { SearchInput, Pagination } from "./ListControls";

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
      setError(err instanceof Error ? err.message : "The email queue did not load.");
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
      setError(err instanceof Error ? err.message : "This email did not load.");
    }
  }

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    total,
    totalPages,
  } = usePaginatedSearch<EmailQueueItem>(pending ?? [], {
    searchKeys: ["to", "subject", "emailType", "status"],
    pageSize: 20,
  });

  return (
    <div className={s.stack}>
      {error && (
        <ErrorNotice audience="staff">{error}</ErrorNotice>
      )}
      <Loadable loading={pending === null && !error} label="Loading the email queue" skeleton={<EmailQueueSkeleton />}>
        {null}
      </Loadable>
      {pending !== null && pending.length === 0 && <p className={s.meta}>No emails are waiting to go out.</p>}

      {pending !== null && pending.length > 0 && (
        <SearchInput value={query} onChange={setQuery} placeholder="Search emails…" resultCount={total} />
      )}

      {pageItems.map((e) => (
        <div key={e.id} className={s.item}>
          <div className={s.itemText}>
            <div className={s.itemTitle}>{e.subject ?? "(no subject)"}</div>
            <div className={s.itemSub}>
              {e.to ?? "No recipient"} · {e.emailType ?? e.status ?? "pending"}
            </div>
          </div>
          <div className={s.itemActions}>
            <Button size="sm" busy={busy === `send-${e.id}`} onClick={() => sendNow(e.id)}>
              Send now
            </Button>
            <Button size="sm" variant="ghost" busy={busy === `cancel-${e.id}`} onClick={() => cancel(e.id)}>
              Cancel
            </Button>
            <Button size="sm" variant="ghost" onClick={() => openPreview(e.id)}>
              Preview
            </Button>
          </div>
        </div>
      ))}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        size="lg"
        title={preview?.subject ?? "(no subject)"}
        subtitle={`To: ${preview?.to ?? "no recipient"}`}
      >
        {preview?.html ? (
          <iframe title="Email preview" srcDoc={preview.html} className={s.preview} />
        ) : (
          <pre className={s.pre}>{preview?.text ?? "(no body)"}</pre>
        )}
      </Drawer>
    </div>
  );
}

/** Search field, then queued emails: subject, recipient and type, three actions. */
function EmailQueueSkeleton() {
  return (
    <div className={s.stack} aria-hidden="true">
      <Skeleton shape="block" size="sm" />
      {[0, 1, 2].map((i) => (
        <div key={i} className={s.item}>
          <div className={s.itemTextSk}>
            <Skeleton shape="line" size="md" width={i % 2 ? "40" : "60"} />
            <Skeleton shape="line" size="sm" width="40" />
          </div>
          <div className={s.itemActions}>
            <Skeleton shape="pill" size="lg" width="pill" />
            <Skeleton shape="pill" size="lg" width="pill-sm" />
            <Skeleton shape="pill" size="lg" width="pill-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
