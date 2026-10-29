"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackFunnel } from "@/lib/funnel";
import { track, useExperiment } from "@/lib/journey";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import FunnelHeader from "./FunnelHeader";
import { Button, Checkbox, Notice, PageIntro, Skeleton, SkeletonRegion, SkeletonText, TextInput, useSkeleton } from "@/components/ui";
import { DeadlineCards } from "@/components/deadlines/DeadlineCards";
import { joinConsents } from "@/components/legal/consentApi";
import { type DeadlineCardItem, defaultSelection, savePendingDeadlines } from "@/lib/deadlines";
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
  claimDeadlines,
  EMAIL_RE,
  PRICE,
  runCheck,
  saveCheck,
} from "@/app/join/joinApi";
import { ApiError } from "@/lib/api";
import s from "./funnel.module.scss";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The country question, then that country's questions from the research (server API/countries/rules). */
type Step = { kind: "country" } | { kind: "question"; q: CountryQuestion };

/** DEADLINES: a finding as a deadline card (the rule id is the card id). */
const toCard = (f: CheckFinding): DeadlineCardItem => ({
  id: f.ruleId,
  area: f.area,
  title: f.title,
  meaning: f.meaning,
  authority: f.authority,
  confidence: f.confidence,
  dueAt: f.dueAt,
  windowStartAt: f.windowStartAt,
  dueText: f.dueText,
});

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
  // DEADLINES: which cards are included, and the "Set the deadlines for each" form.
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [claimOpen, setClaimOpen] = useState(false);
  const [claim, setClaim] = useState({ firstName: "", terms: false, privacy: false, marketing: false, website: "" });
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const claimRef = useRef<HTMLHeadingElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { questions: allQuestions, error: loadError, retry } = useCountryQuestions(country || null, "check");
  // JOURNEYS experiment "check-length": the control asks every question; the
  // other variant skips the questions marked optional. The control is used
  // while the variant loads, and the exposure counts once a question shows.
  const checkLength = useExperiment("check-length", { whileLoading: "control", exposeWhen: index > 0 && !!allQuestions });
  const questions = useMemo(
    () => (allQuestions && !checkLength.isControl ? allQuestions.filter((q) => !q.optional) : allQuestions),
    [allQuestions, checkLength.isControl],
  );
  const started = useRef(false);
  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    track.step("check_start");
  };
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
        markStarted();
      }
    } catch {
      // no query string
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // JOURNEYS: the results are on screen.
  useEffect(() => {
    if (done) track.step("results_view");
  }, [done]);

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
      setSelected(defaultSelection(res.findings.map(toCard)));
      setClaimOpen(false);
      saveCheck({ answers: body, findings: res.findings });
      trackFunnel("check_completed");
      track.step("check_finish");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not run the check. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  /** Save an answer (or remove it with undefined) and go to the next shown question, or finish. */
  function answer(key: string, value: string | string[] | undefined) {
    // JOURNEYS: question n answered (target "q<n>"), so staff can see which question people leave at.
    track.click(`check.q${index}`, "check_start");
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
    markStarted();
  }

  function back() {
    if (index > 0) setIndex(index - 1);
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      track.formError("check.email", "results_view");
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

  function openClaim() {
    setClaimOpen(true);
    track.step("deadlines_select");
    // After the form renders: bring it into view and move focus to its heading.
    window.requestAnimationFrame(() => {
      claimRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      claimRef.current?.focus({ preventScroll: true });
    });
  }

  async function submitClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!country || !findings) return;
    const clean = email.trim().toLowerCase();
    const errs: Record<string, string> = {};
    if (!EMAIL_RE.test(clean)) errs.email = "Enter a valid email address.";
    if (!claim.terms) errs.terms = "Tick this box to save your deadlines.";
    if (!claim.privacy) errs.privacy = "Tick this box to save your deadlines.";
    const ruleIds = findings.map((f) => f.ruleId).filter((id) => selected.has(id));
    if (!ruleIds.length) errs.cards = "Include at least one item above.";
    setClaimErrors(errs);
    setClaimError(null);
    if (Object.keys(errs).length) {
      track.formErrors("check.claim", Object.keys(errs), "deadlines_select");
      return;
    }
    track.step("signup_start");
    setClaimBusy(true);
    try {
      const res = await claimDeadlines({
        email: clean,
        firstName: claim.firstName.trim() || undefined,
        country,
        answers,
        leadId,
        ruleIds,
        consents: joinConsents(claim.marketing),
        website: claim.website || undefined,
      });
      // Kept in this tab only: the Deadlines page finishes the save after sign-in. Nothing personal goes in the URL.
      savePendingDeadlines({ email: clean, country, ruleIds, claimToken: res.claimToken, count: res.total ?? ruleIds.length, savedAt: new Date().toISOString() });
      router.push("/status/deadlines");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setClaimError("Too many tries from this connection. Wait a few minutes, then press Save my deadlines again.");
      else setClaimError(err instanceof Error ? err.message : "We could not save your deadlines. Please try again.");
      setClaimBusy(false);
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
    const cards = findings.map(toCard);
    const n = findings.length;
    const chosen = cards.filter((c) => selected.has(c.id)).length;
    return (
      <div className={s.page}>
        <FunnelHeader note="Free, no account needed" />
        <main className={`${s.main} ${s.mainWide}`}>
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
                n ? "Include the items that apply to you and skip the rest. You can go through them one by one." : "Check your answers if something looks wrong.",
                n ? "Press Set the deadlines for each. We save them to a free ILP account, where you set a date for each one and get reminders." : "Email the list to yourself, or join ILP.",
                `As a member, a lawyer licensed in ${countryName} goes through them with you on a call, and your team reminds you before each date.`,
              ]}
              labels={{ how: "What happens next" }}
              why="A missed date can bring late fees, interest or a lapsed status. Knowing the dates early gives you time to act."
              tutorialId="public.check"
            />

            {n > 0 && (
              <DeadlineCards
                items={cards}
                selected={selected}
                onChange={setSelected}
                intro="Items with a date from your answers start included. Items with no fixed date start skipped, so include the ones that apply to you."
                actionLabel="Set the deadlines for each"
                onAction={openClaim}
                actionDisabled={chosen === 0}
              />
            )}

            {n > 0 && claimOpen && (
              <section className={s.claim} aria-labelledby="claim-title">
                <h2 className={s.choiceHead} id="claim-title" ref={claimRef} tabIndex={-1}>
                  Set the deadlines for each
                </h2>
                <p className={s.ctaText}>
                  We save the {chosen} {chosen === 1 ? "item" : "items"} you included to a free ILP account. Next, you sign in with a 6-digit code we email you,
                  then set a date for each one. We remind you 30 and 7 days before each date. You can add or remove deadlines at any time.
                </p>
                <form onSubmit={submitClaim} noValidate className={s.claimForm}>
                  <TextInput
                    label="Email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={claimErrors.email}
                    required
                  />
                  <TextInput
                    label="First name"
                    optional
                    autoComplete="given-name"
                    value={claim.firstName}
                    onChange={(e) => setClaim({ ...claim, firstName: e.target.value })}
                    hint="So our emails can greet you by name."
                  />
                  {/* Honeypot: hidden from people and screen readers; bots fill it. */}
                  <div className={s.honeypot} aria-hidden="true">
                    <label htmlFor="claim-website">Website</label>
                    <input id="claim-website" tabIndex={-1} autoComplete="off" value={claim.website} onChange={(e) => setClaim({ ...claim, website: e.target.value })} />
                  </div>
                  <Checkbox
                    label={
                      <>
                        I agree to the <Link href="/terms" target="_blank" rel="noopener">Terms (opens in a new tab)</Link>. I understand ILP is not a law firm and this list is general information, not legal advice.
                      </>
                    }
                    checked={claim.terms}
                    onChange={(e) => setClaim({ ...claim, terms: e.target.checked })}
                    error={claimErrors.terms}
                    required
                  />
                  <Checkbox
                    label={
                      <>
                        I agree to the <Link href="/privacy" target="_blank" rel="noopener">Privacy Policy (opens in a new tab)</Link>: ILP keeps my answers and deadlines to show them to me and send my reminders.
                      </>
                    }
                    checked={claim.privacy}
                    onChange={(e) => setClaim({ ...claim, privacy: e.target.checked })}
                    error={claimErrors.privacy}
                    required
                  />
                  <Checkbox
                    label="Send me ILP news and offers by email (optional). Reminders about my deadlines come either way, and every email has an unsubscribe link."
                    checked={claim.marketing}
                    onChange={(e) => setClaim({ ...claim, marketing: e.target.checked })}
                  />
                  {claimErrors.cards && <p className={s.error} role="alert">{claimErrors.cards}</p>}
                  {claimError && (
                    <Notice tone="danger" variant="inline" title="Your deadlines are not saved yet" fix={{ steps: ["Check your email address.", "Press Save my deadlines again.", "If it keeps happening, use Email me the list below so you keep the dates."] }}>
                      {claimError}
                    </Notice>
                  )}
                  <div className={s.actions}>
                    <Button type="submit" busy={claimBusy}>
                      Save my deadlines
                    </Button>
                    <button type="button" className={s.linkButton} onClick={() => setClaimOpen(false)} disabled={claimBusy}>
                      Not now
                    </button>
                  </div>
                </form>
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
                <Link href={leadId ? "/join?from=check" : "/join"} className={`${s.primary} ${s.primaryWide}`} onClick={() => track.click("check.join")}>
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
