"use client";

import { useState } from "react";
import { providerFetch } from "@/lib/provider";
import type { LawyerClient } from "./types";
import styles from "./activityTab.module.scss";

const TYPE_ICONS: Record<string, string> = {
  stage_change: "🚦",
  note_added: "📝",
  note_edited: "✏️",
  note_deleted: "🗑",
  email_triggered: "📧",
  email_sent: "📧",
  action_executed: "⚡",
  insights_extracted: "🧠",
  field_update: "✏️",
  manual_intake: "🌱",
  client_archived: "📦",
  transcript_reviewed: "🧠",
};

const PAGE_SIZE = 10;

function titleFor(e: Record<string, unknown>): string {
  const type = String(e.type ?? "other");
  switch (type) {
    case "stage_change":
      return `Stage moved to ${e.to ?? "?"}`;
    case "note_added":
      return "Note added";
    case "note_edited":
      return "Note edited";
    case "note_deleted":
      return "Note deleted";
    case "email_triggered":
    case "email_sent":
      return `Email sent — ${e.emailType ?? "email"}`;
    case "action_executed":
      return `Action — ${String(e.actionKey ?? "").replace(/_/g, " ")}`;
    case "insights_extracted":
      return "AI insights extracted";
    case "field_update":
      return `Fields updated: ${(Array.isArray(e.fields) ? e.fields : []).join(", ")}`;
    case "manual_intake":
      return "Client added manually";
    case "client_archived":
      return "Client archived";
    case "transcript_reviewed":
      return "Transcript reviewed";
    default:
      return type;
  }
}

function detailFor(e: Record<string, unknown>): string {
  const type = String(e.type ?? "other");
  switch (type) {
    case "stage_change":
      return e.from ? `from ${e.from}` : "";
    case "note_added":
    case "note_edited":
    case "note_deleted":
      return typeof e.noteText === "string" ? e.noteText : "";
    case "action_executed":
      return e.success === false ? "failed" : "";
    default:
      return "";
  }
}

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return iso;
  }
}

function exactTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ActivityTab({
  client,
  onRefreshed,
}: {
  client: LawyerClient;
  onRefreshed: (client: LawyerClient) => void;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [undoing, setUndoing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activity = (client.activityLog ?? []).slice().reverse();
  const shown = activity.slice(0, visible);
  const hasMore = activity.length > visible;

  async function undoLast() {
    if (undoing) return;
    setUndoing(true);
    setError(null);
    try {
      await providerFetch(`/api/provider/clients/${client.id}/undo-last`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await providerFetch<{ activityLog: Array<Record<string, unknown>> }>(
        `/api/provider/clients/${client.id}`,
      );
      onRefreshed({ ...client, activityLog: res.activityLog ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Undo failed.");
    } finally {
      setUndoing(false);
    }
  }

  if (activity.length === 0) {
    return <p className={styles.empty}>No activity yet.</p>;
  }

  return (
    <div className={styles.activity}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.undoBtn}
          onClick={undoLast}
          disabled={undoing}
        >
          {undoing ? "Undoing…" : "↩ Undo last"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {shown.map((a, i) => {
        const e = a as Record<string, unknown>;
        const type = String(e.type ?? "other");
        const ts = String(e.timestamp ?? e.at ?? "");
        const detail = detailFor(e);
        return (
          <div key={i} className={styles.entry}>
            <span className={styles.icon} aria-hidden="true">
              {TYPE_ICONS[type] ?? "•"}
            </span>
            <div className={styles.body}>
              <span className={styles.title}>{titleFor(e)}</span>
              {detail && <span className={styles.detail}>{detail}</span>}
              <span className={styles.meta} title={exactTime(ts)}>
                {e.actor ? `${String(e.actor).split("@")[0]} · ` : ""}
                {timeAgo(ts)}
              </span>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          type="button"
          className={styles.moreBtn}
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
        >
          Show {Math.min(PAGE_SIZE, activity.length - visible)} more
        </button>
      )}
      {!hasMore && visible > PAGE_SIZE && (
        <button
          type="button"
          className={styles.moreBtn}
          onClick={() => setVisible(PAGE_SIZE)}
        >
          Show less
        </button>
      )}
    </div>
  );
}