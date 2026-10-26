"use client";

import { useState } from "react";
import { staffApi } from "@/lib/api";
import type { Consultation } from "@/lib/contracts";
import { Button, DateInput, Select, StatusPill, TextInput, type StatusTone } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import s from "./member.module.scss";

/**
 * Per-call staff actions on the member page (P3 routes, staff may act any time):
 *   GET  /api/dashboard/consultations/:id/slots
 *   POST /api/dashboard/consultations/:id/{cancel,reschedule,restore-call,retry-calendar}
 */

/** P3 fields not (yet) in contracts.ts. */
export type StaffCall = Consultation & {
  calendarError?: string | null;
  chargedAt?: string;
  restoredAt?: string;
};

const STATUS: Record<Consultation["status"], { label: string; tone: StatusTone }> = {
  booked: { label: "Booked", tone: "info" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  no_show: { label: "Member didn't join", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

function crTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Costa_Rica",
  });
}

export function CallsPanel({
  calls,
  lawyerName,
  onChanged,
}: {
  calls: StaffCall[];
  lawyerName: (providerId: string) => string;
  onChanged: () => void;
}) {
  const upcoming = calls
    .filter((c) => c.status === "booked" || c.status === "in_progress")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const past = calls
    .filter((c) => c.status !== "booked" && c.status !== "in_progress")
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 5);

  return (
    <section className={s.block} aria-label="Calls">
      <div className={s.blockHead}>
        <h2 className={s.blockTitle}>Calls</h2>
        <span className={s.meta}>{upcoming.length} upcoming</span>
      </div>
      {upcoming.length === 0 && past.length === 0 && <p className={s.meta}>No calls yet.</p>}
      {[...upcoming, ...past].map((c) => (
        <CallItem key={c.id} call={c} lawyer={lawyerName(c.providerId)} onChanged={onChanged} />
      ))}
    </section>
  );
}

type Mode = null | "cancel" | "reschedule";

function CallItem({ call: c, lawyer, onChanged }: { call: StaffCall; lawyer: string; onChanged: () => void }) {
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState("");
  const [custom, setCustom] = useState("");
  const st = STATUS[c.status] ?? { label: c.status, tone: "neutral" as StatusTone };
  const id = encodeURIComponent(c.id);
  const booked = c.status === "booked";
  const canRestore = c.status === "no_show" && !!c.chargedAt && !c.restoredAt;

  async function run(key: string, fn: () => Promise<unknown>, done: string) {
    setBusy(key);
    setError(null);
    setMsg(null);
    try {
      await fn();
      setMsg(done);
      setMode(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function openReschedule() {
    setMode("reschedule");
    setError(null);
    setSlots(null);
    try {
      const r = await staffApi.get<{ slots: string[] }>(`/api/dashboard/consultations/${id}/slots`);
      setSlots(r.slots ?? []);
    } catch (e) {
      setSlots([]);
      setError(e instanceof Error ? e.message : "Open times could not be loaded.");
    }
  }

  function reschedule(e: React.FormEvent) {
    e.preventDefault();
    const iso = custom ? new Date(custom).toISOString() : slot;
    if (!iso) return setError("Pick a new time.");
    void run(
      "reschedule",
      () => staffApi.post(`/api/dashboard/consultations/${id}/reschedule`, { scheduledAt: iso, ...(custom ? { force: true } : {}) }),
      `Moved to ${crTime(iso)} (Costa Rica). Both sides get an email.`,
    );
  }

  return (
    <div className={s.taskItem}>
      <div className={s.row}>
        <StatusPill size="sm" label={st.label} tone={st.tone} srPrefix="Call" />
        {booked && (
          <StatusPill
            size="sm"
            label={c.meetUrl ? "Meet link sent" : c.calendarError ? "Meet link failed" : "No Meet link yet"}
            tone={c.meetUrl ? "success" : "warning"}
          />
        )}
        {c.restoredAt && <StatusPill size="sm" label="Call given back" tone="neutral" />}
      </div>
      <p className={s.taskTitle}>
        {crTime(c.scheduledAt)} · {lawyer}
      </p>
      {c.question && <p className={s.meta}>{c.question}</p>}

      {(booked || canRestore) && mode === null && (
        <div className={s.row}>
          {booked && (
            <Button size="sm" variant="secondary" onClick={openReschedule}>
              Reschedule
            </Button>
          )}
          {booked && (
            <Button size="sm" variant="ghost" onClick={() => setMode("cancel")}>
              Cancel call
            </Button>
          )}
          {booked && !c.meetUrl && (
            <Button
              size="sm"
              variant="secondary"
              busy={busy === "retry"}
              onClick={() =>
                run("retry", () => staffApi.post(`/api/dashboard/consultations/${id}/retry-calendar`, {}), "Meet link requested. If it worked, both sides get it by email.")
              }
            >
              Retry Meet link
            </Button>
          )}
          {canRestore && (
            <Button
              size="sm"
              variant="secondary"
              busy={busy === "restore"}
              onClick={() =>
                run("restore", () => staffApi.post(`/api/dashboard/consultations/${id}/restore-call`, {}), "The call and its minutes are back on the membership.")
              }
            >
              Restore call
            </Button>
          )}
        </div>
      )}

      {mode === "cancel" && (
        <div className={s.actions}>
          <TextInput label="Reason (optional, kept in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Member asked by phone" />
          <div className={s.row}>
            <Button
              size="sm"
              variant="danger"
              busy={busy === "cancel"}
              onClick={() =>
                run(
                  "cancel",
                  () => staffApi.post(`/api/dashboard/consultations/${id}/cancel`, reason.trim() ? { reason: reason.trim() } : {}),
                  "Call cancelled. Both sides get an email; a charged call is given back.",
                )
              }
            >
              Cancel this call
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
              Keep it
            </Button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <form className={s.actions} onSubmit={reschedule} noValidate>
          <Select label={<>Open times for {lawyer} (Costa Rica time)</>} value={slot} onChange={(e) => setSlot(e.target.value)} disabled={!slots?.length || !!custom}>
            <option value="">{slots === null ? "Loading…" : slots.length ? "Choose a time" : "No open times"}</option>
            {(slots ?? []).slice(0, 60).map((t) => (
              <option key={t} value={t}>
                {crTime(t)}
              </option>
            ))}
          </Select>
          <DateInput label="Or another time agreed with both (your local time)" kind="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <div className={s.row}>
            <Button size="sm" type="submit" busy={busy === "reschedule"}>
              Move call
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
              Back
            </Button>
          </div>
        </form>
      )}

      {msg && (
        <p className={s.ok} role="status">
          {msg}
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
