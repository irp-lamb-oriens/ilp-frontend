"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { statusFetch } from "@/lib/status";
import s from "../portal.module.scss";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  deadlineLabel: string | null;
  status: string;
  createdAt: string | null;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statusFetch<{ reminders: Reminder[] }>("/api/portal/reminders")
      .then((r) => setReminders(r.reminders ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load reminders."));
  }, []);

  return (
    <PortalShell title="Compliance & reminder center">
      {error && <p className={s.empty} style={{ color: "#c0392b" }}>{error}</p>}
      {reminders === null && !error && <p className={s.empty}>Loading…</p>}
      {reminders !== null && reminders.length === 0 && (
        <p className={s.empty}>No reminders yet.</p>
      )}
      {reminders !== null && reminders.length > 0 && (
        <div className={s.list}>
          {reminders.map((r) => (
            <div key={r.id} className={s.row}>
              <div>
                <div className={s.rowTitle}>{r.title}</div>
                <div className={s.rowMeta}>{r.description ?? r.deadlineLabel ?? ""}</div>
              </div>
              <span className={s.badge}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}