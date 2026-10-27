"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Loadable, Skeleton, StatusPill, type StatusTone } from "@/components/ui";
import { ApiError } from "@/lib/api";
import type { ConsentKind, PrivacyRequest } from "@/lib/contracts";
import { useMember } from "@/components/status/MemberContext";
import { type PrivacyMe, privacyApi, recordConsent } from "./consentApi";
import { announceAiConsent } from "./aiConsent";
import { PrivacyRequestsSkeleton } from "@/components/status/StatusSkeletons";
import s from "./PrivacyCenter.module.scss";

const KIND_LABEL: Record<PrivacyRequest["kind"], string> = {
  access: "Access to my data",
  export: "Download of my data",
  rectify: "Correction",
  delete: "Account deletion",
  restrict: "Objection to a use",
};

const STATUS: Record<PrivacyRequest["status"], [string, StatusTone]> = {
  received: ["Received", "info"],
  in_review: ["In review", "warning"],
  completed: ["Done", "success"],
  refused: ["Refused", "danger"],
};

const day = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

/** /status/privacy: download, consents, correction, objection, deletion (P6). */
export default function PrivacyCenter() {
  const { home } = useMember();
  const [me, setMe] = useState<PrivacyMe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // The export needs the member's Bearer token, so it is fetched, not linked (AUTH).
  async function downloadExport() {
    setExporting(true);
    setExportError(null);
    try {
      await privacyApi.downloadExport();
    } catch (err) {
      setExportError(err instanceof ApiError && err.status !== 401 ? err.message : "The download did not start. Try again.");
    } finally {
      setExporting(false);
    }
  }

  const load = useCallback(async () => {
    try {
      setMe(await privacyApi.me());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not load your privacy settings.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={s.page}>
      <header className={s.head}>
        <h1 className={s.h1}>Your data and privacy</h1>
        <p className={s.lead}>
          See and download what ILP keeps about you, change your choices, and ask us to correct or delete it. Read
          the <Link href="/privacy">Privacy Policy</Link> for the details.
        </p>
      </header>

      <section className={s.card} aria-labelledby="dl-title" data-tour="client-privacy-rights">
        <h2 id="dl-title" className={s.title}>Download my data</h2>
        <p className={s.text}>
          A file (JSON) with your profile, membership, calls and transcripts, the next steps your lawyer confirmed,
          messages, consents and requests. Your documents are listed by name; download the files themselves from
          Documents. Internal staff notes and pricing details are not included.
        </p>
        <div>
          <Button busy={exporting} onClick={() => void downloadExport()}>
            Download my data
          </Button>
        </div>
        {exportError && (
          <p className={s.error} role="alert">
            {exportError}
          </p>
        )}
      </section>

      <Choices me={me} loading={me === null && !loadError} onChange={load} />

      <RequestForm
        kind="rectify"
        title="Correct my data"
        help="Most profile details you can edit yourself on Profile. For anything else, tell us what is wrong and what it should say."
        label="What should we correct?"
        onDone={load}
        responseDays={me?.responseDays}
      />

      <RequestForm
        kind="restrict"
        title="Object to a use of my data"
        help="Tell us which use you object to, for example measurement, or sharing a document with a lawyer. We stop while we review it, where we can."
        label="What do you object to?"
        onDone={load}
        responseDays={me?.responseDays}
      />

      <DeleteAccount email={home.member.email} onDone={load} active={home.membership?.status === "active" || home.membership?.status === "past_due"} />

      <section className={s.card} aria-labelledby="req-title">
        <h2 id="req-title" className={s.title}>Your requests</h2>
        {loadError && (
          <p className={s.error} role="alert">
            {loadError}
          </p>
        )}
        <Loadable loading={me === null && !loadError} label="Loading your requests" skeleton={<PrivacyRequestsSkeleton />}>
          {null}
        </Loadable>
        {me && me.requests.length === 0 && <p className={s.text}>No requests yet.</p>}
        {me && me.requests.length > 0 && (
          <ul className={s.requests}>
            {me.requests.map((r) => (
              <li key={r.id} className={s.request}>
                <span className={s.reqName}>{KIND_LABEL[r.kind]}</span>
                <StatusPill label={STATUS[r.status][0]} tone={STATUS[r.status][1]} size="sm" srPrefix="Status" />
                <span className={s.reqMeta}>
                  Received {day(r.createdAt)}
                  {r.status === "received" || r.status === "in_review" ? ` · answer by ${day(r.dueAt)}` : ""}
                  {r.completedAt && r.status !== "received" ? ` · closed ${day(r.completedAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.card} aria-labelledby="complain-title">
        <h2 id="complain-title" className={s.title}>Not happy with our answer?</h2>
        <p className={s.text}>
          Reply to our email first so we can fix it. You can also complain to Costa Rica&apos;s data protection agency,
          PRODHAB (Agencia de Protección de Datos de los Habitantes), or to your US state&apos;s privacy regulator.
        </p>
      </section>
    </div>
  );
}

// ─── Consents ────────────────────────────────────────────────────────────

function Choices({ me, loading, onChange }: { me: PrivacyMe | null; loading: boolean; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState<ConsentKind | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const c = me?.consents ?? {};

  async function set(kind: ConsentKind, granted: boolean) {
    setBusy(kind);
    setError(null);
    setMsg(null);
    try {
      const r = await recordConsent(kind, granted, "privacy_page");
      if (kind === "ai_assistant") announceAiConsent(granted);
      if (kind === "recording" && !granted) {
        setMsg(
          r.upcomingCallsUpdated
            ? `Saved. ${r.upcomingCallsUpdated} upcoming ${r.upcomingCallsUpdated === 1 ? "call is" : "calls are"} now set to no recording.`
            : "Saved. Future calls will not be recorded unless you say yes again when you book or join.",
        );
      } else setMsg("Saved.");
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const status = (k: ConsentKind, yes: string, no: string, unset: string) =>
    c[k] ? `${c[k]!.granted ? yes : no} since ${day(c[k]!.at)}.` : unset;

  return (
    <section className={s.card} aria-labelledby="choices-title">
      <h2 id="choices-title" className={s.title}>Your choices</h2>
      <Loadable loading={loading} label="Loading your choices" className={s.choices} skeleton={<ChoicesSkeleton />}>
      {() => (
      <>

      <div className={s.choice}>
        <div>
          <h3 className={s.choiceName}>Call recording</h3>
          <p className={s.text}>
            {status("recording", "Last answer: yes", "Last answer: no", "We ask you at each booking and before each call.")} Withdrawing
            sets your upcoming calls to no recording.
          </p>
        </div>
        <Button variant="secondary" busy={busy === "recording"} onClick={() => set("recording", false)}>
          Withdraw for upcoming calls
        </Button>
      </div>

      <div className={s.choice}>
        <div>
          <h3 className={s.choiceName}>News and offers by email</h3>
          <p className={s.text}>
            {status("marketing_email", "You get them", "You do not get them", "You do not get them.")} Emails about your
            membership, calls and dates are not affected.
          </p>
        </div>
        {c.marketing_email?.granted ? (
          <Button variant="secondary" busy={busy === "marketing_email"} onClick={() => set("marketing_email", false)}>
            Stop news and offers
          </Button>
        ) : (
          <Button variant="secondary" busy={busy === "marketing_email"} onClick={() => set("marketing_email", true)}>
            Send me news and offers
          </Button>
        )}
      </div>

      <div className={s.choice}>
        <div>
          <h3 className={s.choiceName}>AI assistant</h3>
          <p className={s.text}>
            {status("ai_assistant", "You accepted the AI notice", "You withdrew the AI notice", "You have not used it yet.")}{" "}
            <Link href="/legal/recording">How ILP uses AI</Link>
          </p>
        </div>
        {c.ai_assistant?.granted && (
          <Button variant="secondary" busy={busy === "ai_assistant"} onClick={() => set("ai_assistant", false)}>
            Withdraw
          </Button>
        )}
      </div>
      </>
      )}
      </Loadable>

      {msg && (
        <p className={s.ok} role="status">
          {msg}
        </p>
      )}
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** The three consent rows (name, status line, button) while /privacy/me loads. */
function ChoicesSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className={s.choice}>
          <div>
            <Skeleton shape="line" size="md" width="40" />
            <Skeleton shape="line" size="sm" width="90" />
            <Skeleton shape="line" size="sm" width="60" />
          </div>
          <Skeleton shape="block" size="sm" width="pill-lg" />
        </div>
      ))}
    </>
  );
}

// ─── Requests ────────────────────────────────────────────────────────────

function RequestForm({
  kind,
  title,
  help,
  label,
  onDone,
  responseDays,
}: {
  kind: "rectify" | "restrict";
  title: string;
  help: string;
  label: string;
  onDone: () => Promise<void>;
  responseDays?: number;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = `req-${kind}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return setError("Write a few words first.");
    setBusy(true);
    setError(null);
    try {
      const r = await privacyApi.request(kind, note.trim());
      setDone(
        r.existing
          ? "You already have an open request of this kind. We will answer it by the date below."
          : `Sent. We will answer by ${day(r.request.dueAt)} and email you a confirmation now.`,
      );
      setNote("");
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.card} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={s.title}>{title}</h2>
      <p className={s.text}>
        {help}
        {responseDays ? ` We answer within ${responseDays} business days.` : ""}
      </p>
      <form onSubmit={submit} className={s.form} noValidate>
        <label htmlFor={id} className={s.label}>
          {label}
        </label>
        <textarea id={id} className={s.textarea} rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        {done && (
          <p className={s.ok} role="status">
            {done}
          </p>
        )}
        <div>
          <Button type="submit" variant="secondary" busy={busy}>
            Send request
          </Button>
        </div>
      </form>
    </section>
  );
}

function DeleteAccount({ email, active, onDone }: { email: string | null; active: boolean; onDone: () => Promise<void> }) {
  const [step, setStep] = useState<"idle" | "confirm" | "sent">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [due, setDue] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const r = await privacyApi.request("delete");
      setDue(r.request.dueAt);
      setStep("sent");
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.card} aria-labelledby="del-title">
      <h2 id="del-title" className={s.title}>Delete my account</h2>
      <p className={s.text}>
        We delete your profile, documents, call transcripts, messages and free-check answers. We keep invoices and
        payment records for as long as the law requires, and proof of your consents with your email replaced by a code.
      </p>
      {active && (
        <p className={s.text}>
          Your membership is still running. We cancel it before deleting your account, or you can{" "}
          <Link href="/status/money/cancel">cancel it yourself</Link> first.
        </p>
      )}
      {step === "idle" && (
        <div>
          <Button variant="danger" onClick={() => setStep("confirm")}>
            Ask to delete my account
          </Button>
        </div>
      )}
      {step === "confirm" && (
        <div className={s.confirm}>
          <p className={s.text}>
            This cannot be undone once we run it. We will email {email ?? "you"} to confirm, and may ask you to prove it is
            you.
          </p>
          <div className={s.actions}>
            <Button variant="danger" busy={busy} onClick={send}>
              Yes, delete my account
            </Button>
            <Button variant="ghost" onClick={() => setStep("idle")}>
              Keep my account
            </Button>
          </div>
        </div>
      )}
      {step === "sent" && (
        <p className={s.ok} role="status">
          Request sent. We will answer by {day(due ?? undefined)}. Check your email for the confirmation.
        </p>
      )}
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
