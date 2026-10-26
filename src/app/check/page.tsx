"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackFunnel } from "@/lib/funnel";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import FunnelHeader from "./FunnelHeader";
import { CHECK_DISCLAIMER } from "@/components/legal/disclaimers";
import {
  type CheckAnswers,
  type CheckFinding,
  EMAIL_RE,
  longDate,
  runCheck,
  saveCheck,
} from "@/app/join/joinApi";
import s from "./funnel.module.scss";

type Option<V> = { value: V; label: string; hint?: string };
type ChoiceStep = {
  id: string;
  kind: "choice";
  question: string;
  help?: string;
  options: Option<string | boolean>[];
  apply: (a: CheckAnswers, v: string | boolean) => CheckAnswers;
  selected: (a: CheckAnswers) => string | boolean | undefined;
  show?: (a: CheckAnswers) => boolean;
};
type DateStep = {
  id: string;
  kind: "date";
  question: string;
  help?: string;
  field: "residencyExpiresAt" | "lastEntryDate";
  show: (a: CheckAnswers) => boolean;
};
type Step = ChoiceStep | DateStep;

const YES_NO: Option<boolean>[] = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

const PROVINCES = ["Guanacaste", "San José", "Alajuela", "Heredia", "Cartago", "Puntarenas", "Limón"];

const STEPS: Step[] = [
  {
    id: "country",
    kind: "choice",
    question: "Where do you live or own things abroad?",
    help: "The free check covers Costa Rica today. Panama and Mexico come next.",
    options: [{ value: "CR", label: "Costa Rica" }],
    apply: (a) => ({ ...a, country: "CR" }),
    selected: (a) => a.country,
  },
  {
    id: "residency",
    kind: "choice",
    question: "What is your residency status in Costa Rica?",
    options: [
      { value: "resident", label: "I am a resident", hint: "I have a DIMEX card" },
      { value: "applying", label: "My application is in progress" },
      { value: "visitor", label: "I visit as a tourist" },
      { value: "unsure", label: "I am not sure" },
    ],
    apply: (a, v) => {
      const next: CheckAnswers = { ...a, residencyStatus: v as CheckAnswers["residencyStatus"] };
      if (v !== "resident") delete next.residencyExpiresAt;
      if (v !== "visitor") delete next.lastEntryDate;
      return next;
    },
    selected: (a) => a.residencyStatus,
  },
  {
    id: "residencyDate",
    kind: "date",
    field: "residencyExpiresAt",
    question: "When does your DIMEX card expire?",
    help: "It is printed on the front of the card. Skip this if you do not have it at hand.",
    show: (a) => a.residencyStatus === "resident",
  },
  {
    id: "entryDate",
    kind: "date",
    field: "lastEntryDate",
    question: "When did you last enter Costa Rica?",
    help: "The date on your most recent entry stamp. Skip this if you are not sure.",
    show: (a) => a.residencyStatus === "visitor",
  },
  {
    id: "property",
    kind: "choice",
    question: "Do you own property in Costa Rica?",
    help: "A house, condo or land, in your own name or through a company.",
    options: YES_NO,
    apply: (a, v) => {
      const next = { ...a, ownsProperty: v as boolean };
      if (!v) delete next.propertyLocation;
      return next;
    },
    selected: (a) => a.ownsProperty,
  },
  {
    id: "propertyLocation",
    kind: "choice",
    question: "Which province is it in?",
    options: PROVINCES.map((p) => ({ value: p, label: p })),
    apply: (a, v) => ({ ...a, propertyLocation: v as string }),
    selected: (a) => a.propertyLocation,
    show: (a) => a.ownsProperty === true,
  },
  {
    id: "company",
    kind: "choice",
    question: "Do you have a Costa Rican corporation?",
    help: "Many people hold a house or car through one, even if it does no business.",
    options: [
      { value: "SA", label: "Yes, a sociedad anónima (S.A.)" },
      { value: "SRL", label: "Yes, a limitada (S.R.L.)" },
      { value: "none", label: "No" },
      { value: "unsure", label: "I am not sure" },
    ],
    apply: (a, v) => ({ ...a, companyType: v as CheckAnswers["companyType"] }),
    selected: (a) => a.companyType,
  },
  {
    id: "vehicle",
    kind: "choice",
    question: "Do you own a car or motorcycle registered in Costa Rica?",
    options: YES_NO,
    apply: (a, v) => ({ ...a, ownsVehicle: v as boolean }),
    selected: (a) => a.ownsVehicle,
  },
  {
    id: "employees",
    kind: "choice",
    question: "Does anyone work for you in Costa Rica?",
    help: "Including a housekeeper, gardener, caretaker or driver.",
    options: YES_NO,
    apply: (a, v) => ({ ...a, hasEmployees: v as boolean }),
    selected: (a) => a.hasEmployees,
  },
];

const AREA_LABELS: Record<string, string> = {
  immigration: "Residency",
  property: "Property",
  corporate: "Your corporation",
  vehicle: "Vehicle",
  employment: "People who work for you",
};
const AREA_ORDER = ["immigration", "property", "corporate", "vehicle", "employment"];

function groupFindings(findings: CheckFinding[]) {
  const by = new Map<string, CheckFinding[]>();
  for (const f of findings) by.set(f.area, [...(by.get(f.area) ?? []), f]);
  return [...by.entries()].sort((a, b) => AREA_ORDER.indexOf(a[0]) - AREA_ORDER.indexOf(b[0]));
}

export default function CheckPage() {
  const reduce = useReducedMotion();
  const [answers, setAnswers] = useState<CheckAnswers>({ country: "CR" });
  const [index, setIndex] = useState(0);
  const [findings, setFindings] = useState<CheckFinding[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateDraft, setDateDraft] = useState("");
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "saving" | "saved">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | undefined>();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const visible = useMemo(() => STEPS.filter((st) => !("show" in st) || !st.show || st.show(answers)), [answers]);
  const step = visible[Math.min(index, visible.length - 1)];
  const done = findings !== null;

  // P2 funnel: the visitor opened the check.
  useEffect(() => {
    trackFunnel("check_started");
  }, []);

  // Move focus to the new question so screen readers and keyboards follow along.
  useEffect(() => {
    headingRef.current?.focus();
  }, [index, done]);

  useEffect(() => {
    if (step?.kind === "date") setDateDraft((answers[step.field] as string | undefined) ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  async function finish(final: CheckAnswers) {
    setBusy(true);
    setError(null);
    try {
      const res = await runCheck(final);
      setFindings(res.findings);
      saveCheck({ answers: final, findings: res.findings });
      trackFunnel("check_completed");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not run the check. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function advance(next: CheckAnswers) {
    setAnswers(next);
    const nextVisible = STEPS.filter((st) => !("show" in st) || !st.show || st.show(next));
    const pos = nextVisible.findIndex((st) => st.id === step.id);
    if (pos + 1 >= nextVisible.length) void finish(next);
    else setIndex(pos + 1);
  }

  function back() {
    if (index > 0) setIndex(index - 1);
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailState("saving");
    try {
      const res = await runCheck(answers, clean);
      setLeadId(res.leadId);
      saveCheck({ answers, findings: res.findings, email: clean, leadId: res.leadId });
      trackFunnel("check_email_given", { leadId: res.leadId });
      setEmailState("saved");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "We could not save your results.");
      setEmailState("idle");
    }
  }

  const motionProps = reduce
    ? {}
    : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] as const } };

  if (done) {
    const groups = groupFindings(findings);
    return (
      <div className={s.page}>
        <FunnelHeader note="Free, no account needed" />
        <main className={s.main}>
          <motion.section {...motionProps} aria-labelledby="results-title">
            <h1 id="results-title" className={s.title} ref={headingRef} tabIndex={-1}>
              {findings.length
                ? `${findings.length} ${findings.length === 1 ? "date" : "dates"} that may apply to you`
                : "Nothing dated came up from your answers"}
            </h1>
            <p className={s.help}>
              {findings.length
                ? "Based on your answers, these may require review. They are general dates, not legal advice, and a lawyer can confirm what applies to you."
                : "That is good news. Rules and dates change, so it is worth checking again once a year or when something changes."}
            </p>

            {groups.map(([area, items]) => (
              <section key={area} className={s.group} aria-label={AREA_LABELS[area] ?? area}>
                <h2 className={s.groupTitle}>{AREA_LABELS[area] ?? area}</h2>
                <ul className={s.findings}>
                  {items.map((f) => (
                    <li key={f.ruleId} className={s.finding}>
                      <span className={s.findingDate}>{longDate(f.dueAt)}</span>
                      <h3 className={s.findingTitle}>{f.title}</h3>
                      <p className={s.findingMeaning}>{f.meaning}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <div className={s.cta}>
              <p className={s.ctaText}>
                An ILP lawyer can go through these with you on a call, and your team follows up on each date.
              </p>
              <Link
                href={leadId ? "/join?from=check" : "/join"}
                className={`${s.primary} ${s.primaryWide}`}
              >
                Have a lawyer review this — join ILP
              </Link>
            </div>

            <div className={s.emailBox}>
              <h2>Keep these dates</h2>
              {emailState === "saved" ? (
                <p role="status" className={s.notice}>Saved. We sent the list to {email.trim().toLowerCase()}.</p>
              ) : (
                <form onSubmit={saveEmail} noValidate>
                  <p>We will email you this list. No account and no spam.</p>
                  <div className={s.field}>
                    <label htmlFor="check-email">Email</label>
                    <input
                      id="check-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "check-email-error" : undefined}
                    />
                    {emailError && <span id="check-email-error" className={s.error}>{emailError}</span>}
                  </div>
                  <button type="submit" className={s.ghost} disabled={emailState === "saving"}>
                    {emailState === "saving" ? "Saving…" : "Email me the list"}
                  </button>
                </form>
              )}
            </div>

            <div className={s.actions}>
              <button
                type="button"
                className={s.linkButton}
                onClick={() => {
                  setFindings(null);
                  setIndex(0);
                  setEmailState("idle");
                }}
              >
                Change my answers
              </button>
            </div>
            <p className={s.fine}>
              {CHECK_DISCLAIMER} <Link href="/legal/disclaimer">Read the disclaimer</Link>
            </p>
            <p className={s.fine}>
              ILP is a membership service that connects you with vetted, independent Costa Rica lawyers.
            </p>
          </motion.section>
        </main>
      </div>
    );
  }

  const position = visible.findIndex((st) => st.id === step.id);
  const total = visible.length;

  return (
    <div className={s.page}>
      <FunnelHeader note="Free, about 2 minutes" />
      <main className={s.main}>
        <div className={s.progress}>
          <span className={s.progressLabel} aria-live="polite">
            Question {position + 1} of {total}
          </span>
          <progress className={s.track} aria-label="Check progress" max={total} value={position + 1} />
        </div>

        <motion.section key={step.id} {...motionProps} aria-labelledby={`q-${step.id}`}>
          <h1 id={`q-${step.id}`} className={s.question} ref={headingRef} tabIndex={-1}>
            {step.question}
          </h1>
          {step.help && <p className={s.help}>{step.help}</p>}

          {error && <p className={s.error} role="alert">{error}</p>}

          {step.kind === "choice" ? (
            <ul className={s.options}>
              {step.options.map((o) => {
                const selected = step.selected(answers) === o.value;
                return (
                  <li key={String(o.value)}>
                    <button
                      type="button"
                      className={`${s.option} ${selected ? s.optionSelected : ""}`}
                      aria-pressed={selected}
                      disabled={busy}
                      onClick={() => advance(step.apply(answers, o.value))}
                    >
                      <span className={s.optionLabel}>{o.label}</span>
                      {o.hint && <span className={s.optionHint}>{o.hint}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                advance({ ...answers, [step.field]: dateDraft || undefined });
              }}
            >
              <div className={s.field}>
                <label htmlFor={`d-${step.id}`}>Date</label>
                <input
                  id={`d-${step.id}`}
                  type="date"
                  value={dateDraft}
                  onChange={(e) => setDateDraft(e.target.value)}
                />
              </div>
              <div className={s.actions}>
                <button type="submit" className={s.primary} disabled={busy || !dateDraft}>
                  Continue
                </button>
                <button
                  type="button"
                  className={s.linkButton}
                  disabled={busy}
                  onClick={() => {
                    const next = { ...answers };
                    delete next[step.field];
                    advance(next);
                  }}
                >
                  Skip this question
                </button>
              </div>
            </form>
          )}

          {busy && <p className={s.progressLabel} role="status">Checking the dates…</p>}

          {position > 0 && (
            <div className={s.actions}>
              <button type="button" className={s.linkButton} onClick={back} disabled={busy}>
                Back
              </button>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
