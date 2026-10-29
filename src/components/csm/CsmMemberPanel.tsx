"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, staffApi } from "@/lib/api";
import { CSM_CONTACT_CHANNELS, type CsmContact, type CsmContactChannel, type CsmTask } from "@/lib/contracts";
import { CHANNEL_LABEL, EMAIL_CLASS_LABEL, type MemberCsmView } from "@/lib/csm";
import { Button, Checkbox, DateInput, isoFromDateInput, Notice, Select, Skeleton, StatusPill, TextArea, TextInput, useUnsavedChanges } from "@/components/ui";
import { shortDate } from "../dashboard/staff/format";
import { HealthPill } from "./HealthPill";
import s from "./csm.module.scss";

const WHEN = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * "Your actions" on the member page (COMMS-P3), on /csm and /dashboard:
 * the health score with its reasons, log a call or message (and close the
 * task it worked on), send a playbook email (email classes respected on the
 * server), create a task, take an unassigned member, and the last contacts.
 */
export function CsmMemberPanel({ clientId, openTasks, onChanged }: { clientId: string; openTasks: CsmTask[]; onChanged: () => void }) {
  const [view, setView] = useState<MemberCsmView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(() => {
    staffApi
      .get<MemberCsmView>(`/api/csm/members/${encodeURIComponent(clientId)}`)
      .then(setView)
      .catch((e) => setError(e instanceof ApiError && e.status === 403 ? "This member is in another CSM's book." : e instanceof Error ? e.message : "Your actions could not be loaded."));
  }, [clientId]);
  useEffect(load, [load]);

  const changed = (msg: string) => {
    setDone(msg);
    load();
    onChanged();
  };

  if (error) return <Notice tone="info" variant="inline" title={error} />;
  if (!view) {
    return (
      <section className={s.block} aria-busy="true" aria-label="Loading your actions">
        <Skeleton shape="line" size="md" width="40" />
        <Skeleton shape="pill" size="sm" width="pill-lg" />
        <Skeleton shape="block" size="lg" width="100" />
      </section>
    );
  }

  return (
    <section className={s.block} aria-labelledby="csm-actions" data-tour="csm-member-actions">
      <h2 id="csm-actions" className={s.h2}>Your actions</h2>
      <div className={s.healthBox}>
        <p className={s.label}>Health</p>
        <HealthPill health={view.health} full />
        <p className={s.meta}>
          CSM: {view.csmEmail ?? "nobody yet"}
          {view.row?.lastContactAt ? `. Last contact ${shortDate(view.row.lastContactAt)}.` : ". No contact logged yet."}
        </p>
        {!view.csmEmail && <TakeMember clientId={clientId} onDone={() => changed("This member is now in your book.")} />}
      </div>
      {done && <Notice tone="success" variant="inline" title={done} />}
      <LogContact clientId={clientId} openTasks={openTasks} onDone={changed} />
      <SendPlaybook clientId={clientId} view={view} onDone={changed} />
      <NewTask clientId={clientId} onDone={changed} />
      <RecentContacts contacts={view.contacts} />
    </section>
  );
}

function TakeMember({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className={s.row}>
      <Button
        size="sm"
        busy={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await staffApi.post(`/api/csm/members/${encodeURIComponent(clientId)}/take`, {});
            onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : "This member could not be added to your book.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Take this member
      </Button>
      {error && <span className={s.errorText}>{error}</span>}
    </div>
  );
}

function LogContact({ clientId, openTasks, onDone }: { clientId: string; openTasks: CsmTask[]; onDone: (msg: string) => void }) {
  const [channel, setChannel] = useState<CsmContactChannel>("call");
  const [inbound, setInbound] = useState(false);
  const [reached, setReached] = useState(true);
  const [summary, setSummary] = useState("");
  const [taskId, setTaskId] = useState("");
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useUnsavedChanges(summary.trim() !== "", "The contact you are logging is not saved yet.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (summary.trim().length < 3) {
      setError("Write one line on what happened.");
      return;
    }
    if (taskId && !outcome.trim()) {
      setError("Write the task outcome, or choose No task.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await staffApi.post(`/api/csm/members/${encodeURIComponent(clientId)}/contacts`, {
        channel,
        direction: inbound ? "inbound" : "outbound",
        reached,
        summary: summary.trim(),
        ...(taskId ? { taskId, closeTask: outcome.trim() } : {}),
      });
      setSummary("");
      setOutcome("");
      setTaskId("");
      onDone(taskId ? "Contact logged and task closed." : "Contact logged. It is on the timeline.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The contact could not be logged.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={s.form} onSubmit={submit} noValidate aria-labelledby="csm-log">
      <h3 id="csm-log" className={s.h3}>Log a call or message</h3>
      <Select label="How" value={channel} onChange={(e) => setChannel(e.target.value as CsmContactChannel)} options={CSM_CONTACT_CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))} />
      <Checkbox label="The member contacted us" checked={inbound} onChange={(e) => setInbound(e.target.checked)} />
      <Checkbox label="We reached the member" checked={reached} onChange={(e) => setReached(e.target.checked)} />
      <TextArea label="What happened" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="Called Grace. Profile reviewed; she uploads her DIMEX copy by Friday." error={error ?? undefined} />
      {openTasks.length > 0 && (
        <>
          <Select
            label="Close a task with it"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            options={[{ value: "", label: "No task" }, ...openTasks.map((t) => ({ value: t.id, label: t.title }))]}
          />
          {taskId && <TextInput label="Task outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Welcome call done, DIMEX promised by Friday." />}
        </>
      )}
      <Button type="submit" size="sm" busy={busy}>
        Log it
      </Button>
    </form>
  );
}

function SendPlaybook({ clientId, view, onDone }: { clientId: string; view: MemberCsmView; onDone: (msg: string) => void }) {
  const [id, setId] = useState(view.playbooks[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pb = view.playbooks.find((p) => p.id === id);
  const blocked = !!pb && view.email.optOut && pb.emailClass !== "transactional";

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const r = await staffApi.post<{ sent: boolean; placeholder: boolean; subject: string }>(`/api/csm/members/${encodeURIComponent(clientId)}/email`, { playbookId: id });
      onDone(r.placeholder ? "Placeholder member: no email was sent, the contact was logged." : `Sent: ${r.subject}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The email could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.form} aria-labelledby="csm-send">
      <h3 id="csm-send" className={s.h3}>Send a playbook email</h3>
      <Select label="Email" value={id} onChange={(e) => setId(e.target.value as typeof id)} options={view.playbooks.map((p) => ({ value: p.id, label: p.title }))} />
      {pb && <p className={s.meta}>Subject: {pb.subject}. {EMAIL_CLASS_LABEL[pb.emailClass]}.</p>}
      {blocked && <p className={s.meta}>This member turned off ILP emails, so this one will not be sent. Call or message them instead.</p>}
      {error && <p className={s.errorText}>{error}</p>}
      <Button size="sm" variant="secondary" onClick={send} busy={busy} disabled={!pb || blocked}>
        Send email
      </Button>
    </div>
  );
}

function NewTask({ clientId, onDone }: { clientId: string; onDone: (msg: string) => void }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const dueAt = isoFromDateInput(due);
    if (title.trim().length < 3 || !dueAt) {
      setError("Write what needs doing and pick a due date.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await staffApi.post(`/api/csm/members/${encodeURIComponent(clientId)}/tasks`, { title: title.trim(), dueAt });
      setTitle("");
      setDue("");
      onDone("Task created. It is in your queue on Today.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The task could not be created.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className={s.form} onSubmit={submit} noValidate aria-labelledby="csm-task">
      <h3 id="csm-task" className={s.h3}>Create a task for yourself</h3>
      <TextInput label="What needs doing" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Check the DIMEX upload" maxLength={200} />
      <DateInput label="Due" value={due} onChange={(e) => setDue(e.target.value)} error={error ?? undefined} />
      <Button type="submit" size="sm" variant="secondary" busy={busy}>
        Create task
      </Button>
    </form>
  );
}

function RecentContacts({ contacts }: { contacts: CsmContact[] }) {
  if (!contacts.length) return <p className={s.meta}>No calls or messages logged yet.</p>;
  return (
    <div aria-labelledby="csm-recent">
      <h3 id="csm-recent" className={s.h3}>Last contacts</h3>
      <ul className={s.contactList}>
        {contacts.slice(0, 5).map((c) => (
          <li key={c.id}>
            <span className={s.pills}>
              <StatusPill size="sm" label={CHANNEL_LABEL[c.channel]} />
              {!c.reached && <StatusPill size="sm" label="Not reached" tone="warning" />}
              {c.direction === "inbound" && <StatusPill size="sm" label="From the member" tone="info" />}
            </span>
            <span className={s.para}>{c.summary}</span>
            <span className={s.meta}>
              {WHEN.format(new Date(c.at))} by {c.csmEmail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
