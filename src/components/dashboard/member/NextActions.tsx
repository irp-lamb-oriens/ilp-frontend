"use client";

import { useState } from "react";
import { staffApi } from "@/lib/api";
import { PLAN_STANDARD, type CsmTask } from "@/lib/contracts";
import { Button, DateInput, Select, StatusPill, TextInput } from "@/components/ui";
import { ErrorText } from "../staff/PageHeader";
import { dueLabel, shortDate, TASK_TYPE_LABEL, TASK_TYPE_TONE, usd } from "../staff/format";
import type { MemberBundle } from "../staff/types";
import { useLawyers } from "../staff/useLawyers";
import s from "./member.module.scss";

type Quote = Record<string, unknown>;
const quoteId = (q: Quote) => String(q.quoteId ?? q.id ?? "");

/** Right column: open tasks, book a call, quotes, lawyer assignment. */
export function NextActions({
  bundle,
  openTasks,
  onOpenTask,
  onChanged,
}: {
  bundle: MemberBundle;
  openTasks: CsmTask[];
  onOpenTask: (t: CsmTask) => void;
  onChanged: () => void;
}) {
  const clientId = String(bundle.client?.id ?? "");
  const { lawyers, nameOf } = useLawyers();
  const openMatters = bundle.matters.filter((m) => !m.closedAt);
  const assigned = openMatters.find((m) => m.assignedProviderId)?.assignedProviderId ?? (bundle.client?.assignedProviderId as string | undefined);
  const quotes = ((bundle.client?.quotes as Quote[] | undefined) ?? []).filter((q) => !["client_accepted", "accepted", "cancelled"].includes(String(q.status)));

  return (
    <>
      <section className={s.block} aria-label="Open tasks">
        <div className={s.blockHead}>
          <h2 className={s.blockTitle}>Open tasks</h2>
          <span className={s.meta}>{openTasks.length}</span>
        </div>
        {openTasks.length === 0 && <p className={s.meta}>No open tasks for this member.</p>}
        {openTasks.map((t) => {
          const due = dueLabel(t.dueAt);
          return (
            <div key={t.id} className={s.taskItem}>
              <div className={s.row}>
                <StatusPill size="sm" label={TASK_TYPE_LABEL[t.type]} tone={TASK_TYPE_TONE[t.type]} />
                <StatusPill size="sm" label={due.text} tone={due.tone} srPrefix="Due" />
              </div>
              <p className={s.taskTitle}>{t.title}</p>
              <Button size="sm" variant="secondary" onClick={() => onOpenTask(t)}>
                Open and close
              </Button>
            </div>
          );
        })}
      </section>

      <BookCall clientId={clientId} bundle={bundle} defaultLawyer={assigned} lawyers={lawyers} onBooked={onChanged} />

      <Quotes clientId={clientId} quotes={quotes} onChanged={onChanged} />

      <AssignLawyer clientId={clientId} current={assigned} currentName={assigned ? nameOf(assigned) : null} lawyers={lawyers} onAssigned={onChanged} />
    </>
  );
}

function BookCall({
  clientId,
  bundle,
  defaultLawyer,
  lawyers,
  onBooked,
}: {
  clientId: string;
  bundle: MemberBundle;
  defaultLawyer?: string;
  lawyers: Array<{ id: string; name: string }>;
  onBooked: () => void;
}) {
  const [lawyer, setLawyer] = useState(defaultLawyer ?? "");
  const [when, setWhen] = useState("");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const m = bundle.membership;
  const canBook = m?.status === "active" && bundle.callsLeft > 0 && bundle.minutesLeft >= PLAN_STANDARD.callLengthMin;
  const next = bundle.consultations.filter((c) => c.status === "booked").sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!lawyer || !when) {
      setError("Pick a lawyer and a time.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await staffApi.post("/api/staff/consultations", {
        clientId,
        providerId: lawyer,
        matterId: bundle.matters.find((x) => !x.closedAt && x.assignedProviderId === lawyer)?.id ?? bundle.matters.find((x) => !x.closedAt)?.id,
        scheduledAt: new Date(when).toISOString(),
        durationMin: PLAN_STANDARD.callLengthMin,
        question: question.trim() || undefined,
      });
      setMsg(`Call booked for ${shortDate(new Date(when).toISOString())}. The member keeps ${bundle.minutesLeft} minutes until it is completed.`);
      setWhen("");
      setQuestion("");
      onBooked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The call could not be booked.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.block} aria-label="Book a call">
      <div className={s.blockHead}>
        <h2 className={s.blockTitle}>Book a call</h2>
        <span className={s.meta}>
          {bundle.minutesLeft} min · {bundle.callsLeft} call{bundle.callsLeft === 1 ? "" : "s"} left
        </span>
      </div>
      {next && <p className={s.meta}>Next call {shortDate(next.scheduledAt)} with {lawyers.find((l) => l.id === next.providerId)?.name ?? "the lawyer"}.</p>}
      {!canBook ? (
        <p className={s.meta}>
          {m?.status !== "active" ? "Booking opens once the membership is active." : "No calls or minutes left this period."}
        </p>
      ) : (
        <form className={s.actions} onSubmit={book} noValidate>
          <Select label="Lawyer" value={lawyer} onChange={(e) => setLawyer(e.target.value)}>
            <option value="">Choose a lawyer</option>
            {lawyers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
          <DateInput label="Date and time (your local time)" kind="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          <TextInput label="What they want to ask" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Can I sell the house before the S.A. books are fixed?" />
          <Button type="submit" busy={busy}>
            Book 20 minutes
          </Button>
        </form>
      )}
      {msg && (
        <p className={s.ok} role="status">
          {msg}
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}

function Quotes({ clientId, quotes, onChanged }: { clientId: string; quotes: Quote[]; onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function draft(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the quote a title the member will understand.");
      return;
    }
    setBusy("new");
    setError(null);
    try {
      await staffApi.post(`/api/dashboard/clients/${encodeURIComponent(clientId)}/quotes`, { title: title.trim(), status: "draft" });
      setTitle("");
      setMsg("Draft quote created. Add lines and send it for approval from the client CRM (Pipeline).");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The quote could not be created.");
    } finally {
      setBusy(null);
    }
  }

  async function send(q: Quote) {
    setBusy(quoteId(q));
    setError(null);
    try {
      await staffApi.post(`/api/dashboard/clients/${encodeURIComponent(clientId)}/quotes/${encodeURIComponent(quoteId(q))}/send-to-client`, {});
      setMsg(`"${String(q.title ?? "Quote")}" sent to the member.`);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The quote could not be sent.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={s.block} aria-label="Quotes">
      <h2 className={s.blockTitle}>Quotes</h2>
      {quotes.length === 0 && <p className={s.meta}>No open quotes.</p>}
      {quotes.map((q) => {
        const cents = typeof q.totalMinor === "number" ? q.totalMinor : Math.round(Number(q.total ?? 0) * 100);
        return (
          <div key={quoteId(q)} className={s.taskItem}>
            <p className={s.taskTitle}>{String(q.title ?? "Quote")}</p>
            <p className={s.meta}>
              {cents ? usd(cents) : "Not priced"} · {String(q.status ?? "draft").replace(/_/g, " ")}
            </p>
            {q.status === "approved" && (
              <Button size="sm" busy={busy === quoteId(q)} onClick={() => send(q)}>
                Send to member
              </Button>
            )}
          </div>
        );
      })}
      <form className={s.actions} onSubmit={draft} noValidate>
        <TextInput label="New quote title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="S.A. clean-up before sale" />
        <Button type="submit" variant="secondary" busy={busy === "new"}>
          Draft quote
        </Button>
      </form>
      {msg && (
        <p className={s.ok} role="status">
          {msg}
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}

function AssignLawyer({
  clientId,
  current,
  currentName,
  lawyers,
  onAssigned,
}: {
  clientId: string;
  current?: string;
  currentName: string | null;
  lawyers: Array<{ id: string; name: string; legalAreas?: string[] }>;
  onAssigned: () => void;
}) {
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function assign() {
    if (!pick) return;
    setBusy(true);
    setError(null);
    try {
      const r = await staffApi.post<{ matterIds: string[] }>(`/api/dashboard/staff/members/${encodeURIComponent(clientId)}/assign-lawyer`, { providerId: pick });
      setMsg(`Assigned ${lawyers.find((l) => l.id === pick)?.name ?? "lawyer"}${r.matterIds.length ? ` to ${r.matterIds.length} open matter${r.matterIds.length === 1 ? "" : "s"}` : ""}.`);
      setPick("");
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The lawyer could not be assigned.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.block} aria-label="Lawyer">
      <div className={s.blockHead}>
        <h2 className={s.blockTitle}>Lawyer</h2>
        <StatusPill size="sm" tone={current ? "neutral" : "warning"} label={currentName ?? "Unassigned"} />
      </div>
      <Select label={current ? "Reassign to" : "Assign"} value={pick} onChange={(e) => setPick(e.target.value)}>
        <option value="">Choose a lawyer</option>
        {lawyers
          .filter((l) => l.id !== current)
          .map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
              {l.legalAreas?.length ? ` (${l.legalAreas.join(", ").replace(/_/g, " ")})` : ""}
            </option>
          ))}
      </Select>
      <Button variant="secondary" disabled={!pick} busy={busy} onClick={assign}>
        Assign lawyer
      </Button>
      {msg && (
        <p className={s.ok} role="status">
          {msg}
        </p>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}
