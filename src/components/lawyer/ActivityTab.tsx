"use client";

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

export default function ActivityTab({ client }: { client: LawyerClient }) {
  const activity = (client.activityLog ?? []).slice().reverse();

  if (activity.length === 0) {
    return <p className={styles.empty}>No activity yet.</p>;
  }

  return (
    <div className={styles.activity}>
      {activity.map((a, i) => {
        const e = a as Record<string, unknown>;
        const type = String(e.type ?? "other");
        const ts = String(e.timestamp ?? e.at ?? "");
        return (
          <div key={i} className={styles.entry}>
            <span className={styles.icon} aria-hidden="true">
              {TYPE_ICONS[type] ?? "•"}
            </span>
            <div className={styles.body}>
              <span className={styles.title}>{titleFor(e)}</span>
              <span className={styles.meta}>
                {e.actor ? `${String(e.actor).split("@")[0]} · ` : ""}
                {timeAgo(ts)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}