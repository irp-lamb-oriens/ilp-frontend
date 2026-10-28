"use client";

import { useState } from "react";
import { staffApi } from "@/lib/api";
import { type Obligation, obligationDueAt, obligationNeedsDate } from "@/lib/contracts";
import { Button, DateInput, StatusPill } from "@/components/ui";
import { cardTitle, longDate } from "@/lib/deadlines";
import { ErrorText } from "../staff/PageHeader";
import s from "./member.module.scss";

const SOURCE: Record<string, string> = {
  check: "Free check",
  picker: "Added by member",
  lawyer: "Added by lawyer",
  staff: "Added by staff",
};

/**
 * DEADLINES: the member's own deadlines on the staff member page: where each
 * came from, whether it still needs a date, and the date shown to the member
 * (their own date first). Staff can set or clear the member's date
 * (PATCH /api/staff/obligations/:id). Removed ones are not listed.
 */
export function MemberDeadlines({ obligations, onChanged }: { obligations: Obligation[]; onChanged: () => void }) {
  const rows = obligations
    .filter((o) => o.status !== "dismissed" && !o.dismissedAt)
    .sort((a, b) => String(obligationDueAt(a) ?? "9999").localeCompare(String(obligationDueAt(b) ?? "9999")));
  const needs = rows.filter((o) => o.status !== "handled" && obligationNeedsDate(o)).length;
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 6);
  return (
    <section className={s.block} aria-label="Deadlines">
      <div className={s.blockHead}>
        <h2 className={s.blockTitle}>Deadlines</h2>
        <span className={s.meta}>
          {rows.length} on the list{needs ? ` · ${needs} need a date` : ""}
        </span>
      </div>
      {rows.length === 0 && <p className={s.meta}>No deadlines yet.</p>}
      {shown.map((o) => (
        <DeadlineRow key={o.id} o={o} onChanged={onChanged} />
      ))}
      {rows.length > 6 && (
        <Button size="sm" variant="ghost" onClick={() => setAll((v) => !v)}>
          {all ? "Show fewer" : `Show all ${rows.length}`}
        </Button>
      )}
    </section>
  );
}

function DeadlineRow({ o, onChanged }: { o: Obligation; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needs = obligationNeedsDate(o);
  const due = obligationDueAt(o);

  async function save(day: string | null) {
    setBusy(true);
    setError(null);
    try {
      await staffApi.patch(`/api/staff/obligations/${encodeURIComponent(o.id)}`, {
        userDueAt: day ? `${day}T12:00:00.000Z` : null,
        needsDate: day ? false : !o.dueAt || o.confidence === "low",
        remindersSent: [],
        updatedAt: new Date().toISOString(),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the date.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.taskItem}>
      <p className={s.taskTitle}>{cardTitle(o.title)}</p>
      <p className={s.meta}>
        {needs ? "Needs a date" : `${longDate(due)}${o.userDueAt ? " (member's date)" : ""}`}
        {o.dueText && needs ? ` · ${o.dueText}` : ""}
      </p>
      <div className={s.row}>
        <StatusPill label={SOURCE[o.source ?? "check"] ?? "Free check"} size="sm" />
        {needs && o.status !== "handled" && <StatusPill label="Needs a date" tone="warning" size="sm" />}
        {o.status === "handled" && <StatusPill label="Done" tone="success" size="sm" />}
        {o.status === "asked" && <StatusPill label="Asked the lawyer" tone="info" size="sm" />}
        {o.remind === false && <StatusPill label="Reminders off" size="sm" />}
      </div>
      {editing ? (
        <form
          className={s.actions}
          onSubmit={(e) => {
            e.preventDefault();
            if (draft) void save(draft);
          }}
        >
          <DateInput label="Member's date" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className={s.row}>
            <Button type="submit" size="sm" busy={busy} disabled={!draft}>
              Save date
            </Button>
            {o.userDueAt && (
              <Button size="sm" variant="ghost" onClick={() => void save(null)} disabled={busy}>
                Clear member&apos;s date
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className={s.row}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setDraft((o.userDueAt ?? o.dueAt ?? "").slice(0, 10));
              setEditing(true);
            }}
          >
            {needs ? "Set date" : "Edit date"}
          </Button>
        </div>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
