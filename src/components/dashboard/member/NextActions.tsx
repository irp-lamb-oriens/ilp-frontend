"use client";

import { isQuoteAccepted } from "@/lib/quoteStatus";
import { useMemo, useState } from "react";
import { staffApi } from "@/lib/api";
import { PLAN_STANDARD, type CsmTask } from "@/lib/contracts";
import { Button, DateInput, FilterBar, ListFooter, Select, StatusPill, TextInput, useUnsavedChanges } from "@/components/ui";
import { LOCAL_SCHEMAS } from "@/lib/localListSchemas";
import { useSchemaList } from "@/lib/useSchemaList";
import { ErrorText } from "../staff/PageHeader";
import { dueLabel, shortDate, TASK_TYPE_LABEL, TASK_TYPE_TONE, usd } from "../staff/format";
import type { MemberBundle } from "../staff/types";
import { useLawyers } from "../staff/useLawyers";
import { AssignedLawyer } from "../routing/AssignedLawyer"; // ROUTING
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
  const { lawyers } = useLawyers();
  const openMatters = bundle.matters.filter((m) => !m.closedAt);
  const assigned = openMatters.find((m) => m.assignedProviderId)?.assignedProviderId ?? (bundle.client?.assignedProviderId as string | undefined);
  const quotes = useMemo(
    () => ((bundle.client?.quotes as Quote[] | undefined) ?? []).filter((q) => !isQuoteAccepted(q) && String(q.status) !== "cancelled"),
    [bundle.client],
  );
  // FILTERS: one member's open tasks, searched, filtered, sorted and paged in the browser.
  const tasks = useSchemaList<CsmTask>({
    schema: LOCAL_SCHEMAS.memberTasks,
    key: `staff-member-tasks-${clientId}`,
    rows: openTasks,
    pageSize: 5,
    defaultSort: { key: "dueAt", dir: "asc" },
    keyOf: (t) => t.id,
    local: { read: (t, f) => (f.key === "overdue" ? Date.parse(t.dueAt) < Date.now() : undefined) },
  });

  return (
    <>
      <section className={s.block} aria-label="Open tasks">
        <div className={s.blockHead}>
          <h2 className={s.blockTitle}>Open tasks</h2>
          <span className={s.meta}>{openTasks.length}</span>
        </div>
        {openTasks.length === 0 && <p className={s.meta}>No open tasks for this member.</p>}
        {openTasks.length > 3 && <FilterBar list={tasks} noun="tasks" searchLabel="Search tasks" placeholder="Task title" sortOptions="schema" compact />}
        {openTasks.length > 0 && tasks.list.status === "done" && tasks.list.items.length === 0 && <p className={s.meta}>No task matches these filters.</p>}
        {tasks.list.items.map((t) => {
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
        <ListFooter list={tasks.list} audience="staff" auto={false} endLabel={null} loadMoreLabel="Show more tasks" />
      </section>

      <BookCall clientId={clientId} bundle={bundle} defaultLawyer={assigned} lawyers={lawyers} onBooked={onChanged} />

      <Quotes clientId={clientId} quotes={quotes} onChanged={onChanged} />

      {/* ROUTING: assigned lawyer, Why this lawyer, run routing again, staff override. */}
      <AssignedLawyer clientId={clientId} lawyers={lawyers} onChanged={onChanged} />
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
  useUnsavedChanges(when !== "" || question.trim() !== "", "The call you started booking is not saved yet. If you leave now, it will be lost.");
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

const centsOf = (q: Quote) => (typeof q.totalMinor === "number" ? q.totalMinor : Math.round(Number(q.total ?? 0) * 100));

function Quotes({ clientId, quotes, onChanged }: { clientId: string; quotes: Quote[]; onChanged: () => void }) {
  const ql = useSchemaList<Quote>({
    schema: LOCAL_SCHEMAS.memberQuotes,
    key: `staff-member-quotes-${clientId}`,
    rows: quotes,
    pageSize: 5,
    keyOf: quoteId,
    local: { read: (q, f) => (f.key === "totalCents" ? centsOf(q) : f.key === "status" ? String(q.status ?? "draft") : undefined) },
  });
  const statusOptions = useMemo(
    () => ({ status: [...new Set(quotes.map((q) => String(q.status ?? "draft")))].map((v) => ({ value: v, label: v.replace(/_/g, " ") })) }),
    [quotes],
  );
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  useUnsavedChanges(title.trim() !== "", "The new quote title is not saved yet. If you leave now, it will be lost.");
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
      {quotes.length > 3 && <FilterBar list={ql} noun="quotes" searchLabel="Search quotes" placeholder="Quote title" sortOptions="schema" options={statusOptions} compact />}
      {quotes.length > 0 && ql.list.status === "done" && ql.list.items.length === 0 && <p className={s.meta}>No quote matches these filters.</p>}
      {ql.list.items.map((q) => {
        const cents = centsOf(q);
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
      <ListFooter list={ql.list} audience="staff" auto={false} endLabel={null} loadMoreLabel="Show more quotes" />
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
