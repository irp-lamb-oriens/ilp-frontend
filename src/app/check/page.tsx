"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackFunnel } from "@/lib/funnel";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import FunnelHeader from "./FunnelHeader";
import { Notice, PageIntro, Skeleton, SkeletonRegion, SkeletonText, useSkeleton } from "@/components/ui";
import { TutorialEmbed } from "@/components/tutorial";
import { CHECK_DISCLAIMER } from "@/components/legal/disclaimers";
import {
  type CheckAnswers,
  type CheckFinding,
  EMAIL_RE,
  PRICE,
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
  /** One line: why we ask this question. */
  why: string;
  /** A plain hint: what counts, where to find it. */
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
  why: string;
  help?: string;
  label: string;
  field: "residencyExpiresAt" | "lastEntryDate";
  show: (a: CheckAnswers) => boolean;
};
type Step = ChoiceStep | DateStep;

const YES_NO: Option<boolean>[] = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

const PROVINCES = ["Guanacaste", "San José", "Alajuela", "Heredia", "Cartago", "Puntarenas", "Limón"];

// Every question feeds a rule in the country catalog (server CHECK_RULES).
const STEPS: Step[] = [
  {
    id: "country",
    kind: "choice",
    question: "Which country is this about?",
    why: "Each country has its own legal dates, so we start here.",
    help: "The free check covers Costa Rica today. Panama and Mexico are planned after Costa Rica.",
    options: [{ value: "CR", label: "Costa Rica" }],
    apply: (a) => ({ ...a, country: "CR" }),
    selected: (a) => a.country,
  },
  {
    id: "residency",
    kind: "choice",
    question: "What is your residency status in Costa Rica?",
    why: "Residents have a card to renew and monthly Caja payments. Visitors have a limit on how long they can stay.",
    options: [
      { value: "resident", label: "I am a resident", hint: "I have a DIMEX card." },
      { value: "applying", label: "My application is in progress", hint: "I applied and I am waiting for an answer." },
      { value: "visitor", label: "I visit as a tourist", hint: "I enter with my passport and no residency." },
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
    label: "Expiry date",
    question: "When does your DIMEX card expire?",
    why: "Renewals are usually filed in the three months before the card expires, so we date that window from it.",
    help: "It is printed on the front of the card. Skip this if you do not have it at hand.",
    show: (a) => a.residencyStatus === "resident",
  },
  {
    id: "entryDate",
    kind: "date",
    field: "lastEntryDate",
    label: "Entry date",
    question: "When did you last enter Costa Rica?",
    why: "A tourist stay is counted from the day you enter, up to 180 days.",
    help: "The date on your most recent entry stamp. Skip this if you are not sure.",
    show: (a) => a.residencyStatus === "visitor",
  },
  {
    id: "property",
    kind: "choice",
    question: "Do you own property in Costa Rica?",
    why: "Property owners pay a yearly municipal tax, usually in quarterly installments.",
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
    why: "The tax is paid to the local municipality, and your lawyer will want to know which one.",
    help: "If you own more than one, choose the main one.",
    options: PROVINCES.map((p) => ({ value: p, label: p })),
    apply: (a, v) => ({ ...a, propertyLocation: v as string }),
    selected: (a) => a.propertyLocation,
    show: (a) => a.ownsProperty === true,
  },
  {
    id: "company",
    kind: "choice",
    question: "Do you have a Costa Rican company?",
    why: "Companies have a yearly tax and a yearly ownership declaration, even when they do no business.",
    help: "Many people hold a house or a car through an S.A. or an S.R.L.",
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
    why: "Every vehicle needs a yearly circulation permit, the marchamo, paid by December 31.",
    help: "Count a vehicle in your own name or in your company's name.",
    options: YES_NO,
    apply: (a, v) => ({ ...a, ownsVehicle: v as boolean }),
    selected: (a) => a.ownsVehicle,
  },
  {
    id: "employees",
    kind: "choice",
    question: "Does anyone work for you in Costa Rica?",
    why: "Employers, including households, usually pay monthly Caja contributions and a year-end bonus.",
    help: "Including a housekeeper, gardener, caretaker or driver, even part time.",
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
  // While the dates are computed, the results page's placeholder replaces the last question.
  const sk = useSkeleton(busy);

  const visible = useMemo(() => STEPS.filter((st) => !("show" in st) || !st.show || st.show(answers)), [answers]);
  const step = visible[Math.min(index, visible.length - 1)];
  const done = findings !== null;

  // P2 funnel: the visitor opened the check.
  useEffect(() => {
    trackFunnel("check_started");
  }, []);

  // Move focus to the new question so screen readers and keyboards follow along.
  useEffect(() => {
    if (done) {
      // The results title lives inside PageIntro: make it focusable, then focus it.
      const h = document.querySelector<HTMLElement>("#check-results h1");
      h?.setAttribute("tabindex", "-1");
      h?.focus();
      return;
    }
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

  if (sk.showSkeleton) {
    return (
      <div className={s.page}>
        <FunnelHeader note="Free, no account needed" />
        <main className={s.main}>
          <SkeletonRegion label="Checking the dates" visible={sk.skeletonVisible}>
            <CheckResultsSkeleton />
          </SkeletonRegion>
        </main>
      </div>
    );
  }

  if (done) {
    const groups = groupFindings(findings);
    const n = findings.length;
    return (
      <div className={s.page}>
        <FunnelHeader note="Free, no account needed" />
        <main className={s.main}>
          <motion.section {...motionProps} aria-label="Your results" id="check-results">
            <PageIntro
              className={s.resultsIntro}
              title={n ? `${n} ${n === 1 ? "date" : "dates"} that may apply to you` : "Nothing dated came up from your answers"}
              what={
                n
                  ? "A list of general dates in Costa Rica that may apply to you, based on your answers. Each one may require review by a lawyer. It is not legal advice."
                  : "None of the yearly dates in the check matched your answers. Rules and dates change, so it is worth checking again once a year or when something changes."
              }
              how={[
                n ? "Read each date and what it usually means." : "Check your answers if something looks wrong.",
                "Email the list to yourself, or join ILP.",
                "As a member, a lawyer licensed in Costa Rica goes through them with you on a call, and your team reminds you before each date.",
              ]}
              labels={{ how: "What happens next" }}
              why="A missed date can bring late fees, interest or a lapsed status. Knowing the dates early gives you time to act."
            />

            {groups.map(([area, items]) => (
              <section key={area} className={s.group} aria-labelledby={`area-${area}`}>
                <h2 className={s.groupTitle} id={`area-${area}`}>{AREA_LABELS[area] ?? area}</h2>
                <ul className={s.findings}>
                  {items.map((f) => (
                    <li key={f.ruleId} className={s.finding}>
                      <span className={s.findingDate}>{longDate(f.dueAt)}</span>
                      <h3 className={s.findingTitle}>{f.title}</h3>
                      <p className={s.findingMeaning}>
                        <span className={s.meaningLabel}>What this usually means:</span> {f.meaning}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <Notice
              tone="neutral"
              className={s.disclaimer}
              headingLevel={2}
              title={n ? "These dates may require review" : "General information only"}
              fix={{
                steps: [
                  "These are general dates based on your answers. They are not legal advice.",
                  "Some may not apply to you, or may have a different date in your case.",
                  "A lawyer can confirm which ones apply. ILP members get that on a call.",
                  "Nothing is due from you on this page.",
                ],
              }}
            >
              {CHECK_DISCLAIMER} <Link href="/legal/disclaimer">Read the disclaimer</Link>
            </Notice>

            <h2 className={s.choiceTitle}>What would you like to do?</h2>
            <div className={s.choices}>
              <div className={s.cta}>
                <h3 className={s.choiceHead}>Have a lawyer review this</h3>
                <p className={s.ctaText}>
                  Join ILP for {PRICE.monthly} a month plus a {PRICE.activation} activation fee. A lawyer licensed in Costa Rica goes
                  through these dates with you on a call, and your team follows up on each one. Your answers are filled in for you.
                </p>
                <Link href={leadId ? "/join?from=check" : "/join"} className={`${s.primary} ${s.primaryWide}`}>
                  Join ILP
                </Link>
              </div>

              <div className={s.emailBox}>
                <h3>Save these results by email</h3>
                {emailState === "saved" ? (
                  <Notice tone="success" variant="inline" title={`Saved. We sent the list to ${email.trim().toLowerCase()}.`} />
                ) : (
                  <form onSubmit={saveEmail} noValidate>
                    <p>We email you this list so you have the dates at hand. You do not need an account.</p>
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
            </div>

            <div className={s.demo}>
              <TutorialEmbed
                tutorialId="public.call"
                headingLevel={3}
                caption="What a call with an ILP lawyer looks like, from booking to the next steps your team follows up."
              />
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
              ILP is a membership service that connects you with vetted, independent lawyers licensed in Costa Rica.
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
          <p className={s.why}>
            <span className={s.whyLabel}>Why we ask:</span> {step.why}
          </p>
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
                <label htmlFor={`d-${step.id}`}>{step.label}</label>
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

/** The results page: heading, intro, two groups of dated findings, the join call to action. */
function CheckResultsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={s.title}>
        <Skeleton shape="line" size="xl" width="90" />
        <Skeleton shape="line" size="xl" width="60" />
      </div>
      <SkeletonText lines={2} className={s.help} />
      {[2, 1].map((n, g) => (
        <div key={g} className={s.group}>
          <Skeleton shape="line" size="xs" width="25" className={s.groupTitle} />
          <ul className={s.findings}>
            {Array.from({ length: n }, (_, i) => (
              <li key={i} className={s.finding}>
                <Skeleton shape="line" size="sm" width="25" />
                <Skeleton shape="line" size="lg" width="60" />
                <SkeletonText lines={2} size="sm" />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className={s.cta}>
        <SkeletonText lines={2} />
        <Skeleton shape="block" size="sm" />
      </div>
    </div>
  );
}
