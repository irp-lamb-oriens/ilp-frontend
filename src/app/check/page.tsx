"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackFunnel } from "@/lib/funnel";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import FunnelHeader from "./FunnelHeader";
import { Notice, PageIntro, Skeleton, SkeletonRegion, SkeletonText, useSkeleton } from "@/components/ui";
import { TutorialEmbed } from "@/components/tutorial";
import { CHECK_DISCLAIMER } from "@/components/legal/disclaimers";
import { COUNTRIES, type CountryCode, isCountryCode } from "@/lib/contracts";
import { type CountryAnswers, type CountryQuestion, DEFAULT_WHY, questionShown, visibleAnswers } from "@/lib/countryQuestions";
import { useCountryQuestions } from "@/components/countries/useCountryQuestions";
import { setCountryContext } from "@/lib/countryContext";
import { LEGAL_COUNTRY_OPTIONS } from "@/components/join/joinModel";
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The country question, then that country's questions from the research (server API/countries/rules). */
type Step = { kind: "country" } | { kind: "question"; q: CountryQuestion };

const AREA_LABELS: Record<string, string> = {
  immigration: "Residency and visas",
  property: "Property",
  corporate: "Your company",
  tax: "Taxes",
  vehicle: "Vehicle",
  employment: "People who work for you",
  estate: "Family and estate",
  identity: "IDs and registrations",
  cross_border: "Home-country filings",
};
const AREA_ORDER = ["immigration", "property", "corporate", "tax", "vehicle", "employment", "estate", "identity", "cross_border"];

function groupFindings(findings: CheckFinding[]) {
  const by = new Map<string, CheckFinding[]>();
  for (const f of findings) by.set(f.area, [...(by.get(f.area) ?? []), f]);
  return [...by.entries()].sort((a, b) => AREA_ORDER.indexOf(a[0]) - AREA_ORDER.indexOf(b[0]));
}

/** The date line of a finding: a window, one date, or "ask your lawyer" for a low-confidence date. */
function dateLine(f: CheckFinding): string {
  if (!f.dueAt) return "No fixed date";
  if (f.confidence === "low") return "Ask your lawyer to confirm this date";
  if (f.windowStartAt && f.windowStartAt.slice(0, 10) < f.dueAt.slice(0, 10)) return `Between ${longDate(f.windowStartAt)} and ${longDate(f.dueAt)}`;
  return longDate(f.dueAt);
}

export default function CheckPage() {
  const reduce = useReducedMotion();
  const [country, setCountry] = useState<CountryCode | "">("");
  const [answers, setAnswers] = useState<CountryAnswers>({});
  const [index, setIndex] = useState(0);
  const [findings, setFindings] = useState<CheckFinding[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateDraft, setDateDraft] = useState("");
  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "saving" | "saved">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | undefined>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { questions, error: loadError, retry } = useCountryQuestions(country || null, "check");
  // While the dates are computed, the results page's placeholder replaces the last question.
  const sk = useSkeleton(busy);
  const countryName = country ? COUNTRIES[country].name : "";

  // A country page or the country switcher can open the check with ?country=XX: start on its first question.
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get("country")?.toUpperCase() ?? "";
      if (isCountryCode(code)) {
        setCountry(code);
        setIndex(1);
      }
    } catch {
      // no query string
    }
  }, []);

  const steps = useMemo<Step[]>(
    () => [{ kind: "country" }, ...(questions ?? []).filter((q) => questionShown(q, answers)).map((q) => ({ kind: "question" as const, q }))],
    [questions, answers],
  );
  const loadingQuestions = !!country && questions === null && !loadError;
  const step = steps[Math.min(index, steps.length - 1)];
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
  }, [index, done, loadingQuestions]);

  const stepKey = step?.kind === "question" ? step.q.key : "country";
  useEffect(() => {
    if (step?.kind !== "question") return;
    const v = answers[step.q.key];
    if (step.q.type === "date") setDateDraft(typeof v === "string" ? v : "");
    if (step.q.type === "multi") setMultiDraft(Array.isArray(v) ? v : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);

  async function finish(final: CountryAnswers) {
    if (!country) return;
    setBusy(true);
    setError(null);
    try {
      const body: CheckAnswers = { country, ...final };
      const res = await runCheck(body);
      setFindings(res.findings);
      saveCheck({ answers: body, findings: res.findings });
      trackFunnel("check_completed");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not run the check. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  /** Save an answer (or remove it with undefined) and go to the next shown question, or finish. */
  function answer(key: string, value: string | string[] | undefined) {
    const raw = { ...answers };
    if (value === undefined || (Array.isArray(value) && !value.length)) delete raw[key];
    else raw[key] = value;
    const next = visibleAnswers(questions ?? [], raw);
    setAnswers(next);
    const nextSteps = (questions ?? []).filter((q) => questionShown(q, next));
    const pos = nextSteps.findIndex((q) => q.key === key);
    if (pos + 1 >= nextSteps.length) void finish(next);
    else setIndex(pos + 2); // + the country step
  }

  function chooseCountry(code: string) {
    if (!isCountryCode(code)) return;
    if (code !== country) setAnswers({});
    setCountry(code);
    setCountryContext(code);
    setIndex(1);
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
    if (!country) return;
    setEmailState("saving");
    try {
      const body: CheckAnswers = { country, ...answers };
      const res = await runCheck(body, clean);
      setLeadId(res.leadId);
      saveCheck({ answers: body, findings: res.findings, email: clean, leadId: res.leadId });
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
    const dated = findings.filter((f) => f.dueAt);
    const undated = findings.filter((f) => !f.dueAt);
    const groups = groupFindings(dated);
    const n = findings.length;
    return (
      <div className={s.page}>
        <FunnelHeader note="Free, no account needed" />
        <main className={s.main}>
          <motion.section {...motionProps} aria-label="Your results" id="check-results">
            <PageIntro
              className={s.resultsIntro}
              title={n ? `${n} ${n === 1 ? "item" : "items"} that may apply to you in ${countryName}` : `Nothing came up from your answers for ${countryName}`}
              what={
                n
                  ? `A list of general dates and duties in ${countryName} that may apply to you, based on your answers. Each one may require review by a lawyer. It is not legal advice.`
                  : "None of the items in the check matched your answers. Rules and dates change, so it is worth checking again once a year or when something changes."
              }
              how={[
                n ? "Read each item, its date and what it usually means." : "Check your answers if something looks wrong.",
                "Email the list to yourself, or join ILP.",
                `As a member, a lawyer licensed in ${countryName} goes through them with you on a call, and your team reminds you before each date.`,
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
                      <span className={s.findingDate}>{dateLine(f)}</span>
                      <h3 className={s.findingTitle}>{f.title}</h3>
                      <p className={s.findingMeaning}>
                        <span className={s.meaningLabel}>What this usually means:</span> {f.meaning}
                      </p>
                      {f.confidence === "low" && f.dueText && <p className={s.findingMeaning}>{f.dueText}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {undated.length > 0 && (
              <section className={s.group} aria-labelledby="area-undated">
                <h2 className={s.groupTitle} id="area-undated">No fixed date: worth knowing</h2>
                <ul className={s.findings}>
                  {undated.map((f) => (
                    <li key={f.ruleId} className={s.finding}>
                      <span className={s.findingDate}>{AREA_LABELS[f.area] ?? f.area}</span>
                      <h3 className={s.findingTitle}>{f.title}</h3>
                      <p className={s.findingMeaning}>
                        <span className={s.meaningLabel}>What this usually means:</span> {f.meaning}
                      </p>
                      {f.dueText && (
                        <p className={s.findingMeaning}>
                          <span className={s.meaningLabel}>When:</span> {f.confidence === "low" ? `${f.dueText} Ask your lawyer to confirm this date.` : f.dueText}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Notice
              tone="neutral"
              className={s.disclaimer}
              headingLevel={2}
              title={n ? "These dates may require review" : "General information only"}
              fix={{
                steps: [
                  "These are general dates and duties based on your answers. They are not legal advice.",
                  "Some may not apply to you, or may have a different date in your case.",
                  "Where our research was not certain, we say Ask your lawyer to confirm this date.",
                  "A lawyer can confirm which ones apply. ILP members get that on a call.",
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
                  Join ILP for {PRICE.monthly} a month plus a {PRICE.activation} activation fee. A lawyer licensed in {countryName} goes
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
                  setIndex(1);
                  setEmailState("idle");
                }}
              >
                Change my answers
              </button>
              <button
                type="button"
                className={s.linkButton}
                onClick={() => {
                  setFindings(null);
                  setIndex(0);
                  setEmailState("idle");
                }}
              >
                Check another country
              </button>
            </div>
            <p className={s.fine}>
              ILP is a membership service that connects you with vetted, independent lawyers licensed in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain.
            </p>
          </motion.section>
        </main>
      </div>
    );
  }

  const total = loadingQuestions || !questions ? null : steps.length;
  const position = Math.min(index, steps.length - 1);

  return (
    <div className={s.page}>
      <FunnelHeader note="Free, about 2 minutes" />
      <main className={s.main}>
        <div className={s.progress}>
          <span className={s.progressLabel} aria-live="polite">
            {total ? `Question ${position + 1} of ${total}` : "Question 1"}
          </span>
          <progress className={s.track} aria-label="Check progress" max={total ?? 10} value={position + 1} />
        </div>

        {index > 0 && loadError ? (
          <Notice
            tone="warning"
            title="The questions did not load"
            fix={{ steps: ["Check your connection.", "Press Try again.", "Or go back and choose the country again."] }}
          >
            {loadError}{" "}
            <button type="button" className={s.linkButton} onClick={retry}>
              Try again
            </button>
          </Notice>
        ) : index > 0 && loadingQuestions ? (
          <div aria-live="polite">
            <p className={s.help}>Loading the questions for {countryName}…</p>
            <SkeletonText lines={3} />
          </div>
        ) : step.kind === "country" ? (
          <motion.section key="country" {...motionProps} aria-labelledby="q-country">
            <h1 id="q-country" className={s.question} ref={headingRef} tabIndex={-1}>
              Which country is this about?
            </h1>
            <p className={s.why}>
              <span className={s.whyLabel}>Why we ask:</span> Each country has its own legal dates, so we start here.
            </p>
            <p className={s.help}>The free check covers Colombia, Costa Rica, Mexico, Panama, Portugal and Spain. Choose the country where your residency, property or company is.</p>
            {error && <p className={s.error} role="alert">{error}</p>}
            <ul className={s.options}>
              {LEGAL_COUNTRY_OPTIONS.map((o) => {
                const selected = country === o.value;
                return (
                  <li key={o.value}>
                    <button type="button" className={`${s.option} ${selected ? s.optionSelected : ""}`} aria-pressed={selected} disabled={busy} onClick={() => chooseCountry(o.value)}>
                      <span className={s.optionLabel}>{o.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        ) : (
          <motion.section key={step.q.key} {...motionProps} aria-labelledby={`q-${step.q.key}`}>
            <h1 id={`q-${step.q.key}`} className={s.question} ref={headingRef} tabIndex={-1}>
              {step.q.question}
            </h1>
            <p className={s.why}>
              <span className={s.whyLabel}>Why we ask:</span> {step.q.why ?? DEFAULT_WHY}
            </p>
            {step.q.help && <p className={s.help}>{step.q.help}</p>}

            {error && <p className={s.error} role="alert">{error}</p>}

            {step.q.type === "date" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  answer(step.q.key, dateDraft || undefined);
                }}
              >
                <div className={s.field}>
                  <label htmlFor={`d-${step.q.key}`}>Date</label>
                  <input id={`d-${step.q.key}`} type="date" value={dateDraft} onChange={(e) => setDateDraft(e.target.value)} />
                </div>
                <div className={s.actions}>
                  <button type="submit" className={s.primary} disabled={busy || !dateDraft}>
                    Continue
                  </button>
                  <button type="button" className={s.linkButton} disabled={busy} onClick={() => answer(step.q.key, undefined)}>
                    Skip this question
                  </button>
                </div>
              </form>
            ) : step.q.type === "multi" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  answer(step.q.key, multiDraft);
                }}
              >
                <ul className={s.options}>
                  {step.q.options.map((o) => {
                    const on = multiDraft.includes(o.value);
                    return (
                      <li key={o.value}>
                        <button
                          type="button"
                          className={`${s.option} ${on ? s.optionSelected : ""}`}
                          aria-pressed={on}
                          disabled={busy}
                          onClick={() => setMultiDraft(on ? multiDraft.filter((x) => x !== o.value) : [...multiDraft, o.value])}
                        >
                          <span className={s.optionLabel}>{o.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className={s.actions}>
                  <button type="submit" className={s.primary} disabled={busy}>
                    {multiDraft.length ? "Continue" : "None of these"}
                  </button>
                </div>
              </form>
            ) : (
              <ul className={s.options}>
                {(step.q.type === "month" ? MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) : step.q.options).map((o) => {
                  const selected = answers[step.q.key] === o.value;
                  return (
                    <li key={o.value}>
                      <button type="button" className={`${s.option} ${selected ? s.optionSelected : ""}`} aria-pressed={selected} disabled={busy} onClick={() => answer(step.q.key, o.value)}>
                        <span className={s.optionLabel}>{o.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.section>
        )}

        {index > 0 && (
          <div className={s.actions}>
            <button type="button" className={s.linkButton} onClick={back} disabled={busy}>
              Back
            </button>
          </div>
        )}
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
