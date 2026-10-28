"use client";

import { useState } from "react";
import { Button, Drawer, FilterBar, ListFooter, Loadable, Skeleton, SkeletonList, ErrorNotice } from "@/components/ui";
import s from "./crm.module.scss";
import { dashboardFetch, staffApi } from "@/lib/api";
import { apiListSource } from "@/lib/listSource";
import { LIST_SCHEMAS } from "@/lib/listSchemas";
import { useSchemaList } from "@/lib/useSchemaList";

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
const pendingSource = apiListSource<EmailQueueItem>(staffApi, "/api/dashboard/pending-emails");

export default function EmailsTab() {
  const sl = useSchemaList<EmailQueueItem>({
    schema: LIST_SCHEMAS.emailQueue,
    key: "staff-pending-emails",
    source: pendingSource,
    pageSize: 20,
    defaultSort: { key: "scheduledFor", dir: "asc" },
    keyOf: (e) => e.id,
  });
  const list = sl.list;
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<SentEmail | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** A queued email left the queue (sent or cancelled): take it off the list. */
  const drop = (id: string) => list.update((items) => items.filter((e) => e.id !== id));

  async function cancel(id: string) {
    if (!window.confirm("Cancel this queued email?")) return;
    setBusy(`cancel-${id}`);
    setError(null);
    try {
      await dashboardFetch(`/api/dashboard/email-queue/${id}/cancel`, { method: "POST" });
      drop(id);
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
      drop(id);
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


  return (
    <div className={s.stack}>
      {error && (
        <ErrorNotice audience="staff">{error}</ErrorNotice>
      )}
      <Loadable loading={list.initialLoading && !list.error} label="Loading the email queue" skeleton={<EmailQueueSkeleton />}>
        {null}
      </Loadable>
      {list.status === "done" && list.items.length === 0 && !list.activeQuery && sl.activeCount === 0 && <p className={s.meta}>No emails are waiting to go out.</p>}

      {!list.initialLoading && (list.items.length > 0 || !!list.activeQuery || sl.activeCount > 0) && (
        <FilterBar list={sl} noun="emails" searchLabel="Search emails" placeholder="Recipient, subject or type" sortOptions="schema" />
      )}

      {list.items.map((e) => (
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

      <ListFooter list={list} audience="staff" skeleton={<SkeletonList rows={2} variant="plain" />} />

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
