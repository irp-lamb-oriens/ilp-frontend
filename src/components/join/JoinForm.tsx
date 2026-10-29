"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Button,
  Checkbox,
  ChipSelect,
  DateInput,
  Notice,
  NumberStepper,
  ProgressBar,
  RadioGroup,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui";
import { TutorialEmbed } from "@/components/tutorial";
import PriceAnchor from "@/components/motion/PriceAnchor";
import { funnelAnonId, funnelSource } from "@/lib/funnel";
import { track } from "@/lib/journey";
import { joinConsents } from "@/components/legal/consentApi";
import {
  type CheckAnswers,
  type PaymentsMode,
  type StoredCheck,
  PRICE,
  join,
  joinFieldErrors,
  runCheck,
  saveCheck,
} from "@/app/join/joinApi";
import { COUNTRIES, isCountryCode } from "@/lib/contracts";
import { CountryQuestionFields } from "@/components/countries/CountryQuestionFields";
import { useCountryQuestions } from "@/components/countries/useCountryQuestions";
import {
  CITIZENSHIPS,
  checkAnswersFromDraft,
  clearDraft,
  defaultTimezoneFor,
  DOCUMENT_OPTIONS,
  type Draft,
  draftFromCheck,
  EMPTY_DRAFT,
  type Errors,
  guessTimezone,
  hasContent,
  LANGUAGE_OPTIONS,
  LEGAL_COUNTRY_OPTIONS,
  loadDraft,
  MARITAL_OPTIONS,
  PROVINCES,
  QUESTION_EXAMPLES,
  QUESTION_EXAMPLES_BY_COUNTRY,
  QUESTION_MAX,
  RESIDENCE_COUNTRIES,
  saveDraft,
  STEP_IDS,
  stepOfField,
  type StepId,
  TIME_ZONES,
  toggleDocuments,
  toJoinDetails,
  URGENCY_OPTIONS,
  validateStep,
  YES_NO,
} from "./joinModel";
import s from "./join.module.scss";

interface StepCopy {
  title: string;
  ask: string;
  why: string;
  next: string;
}

const STEPS: Record<StepId, StepCopy> = {
  you: {
    title: "You",
    ask: "Your name, how to reach you, the language you prefer, your citizenship, where you live now and your time zone.",
    why: "You sign in with your email. Your lawyer and your customer success manager use the rest to reach you at a sensible hour, in your language.",
    next: "Next we ask who lives with you.",
  },
  household: {
    title: "Your household",
    ask: "Your marital status and who lives with you. Pets are optional.",
    why: "Family details can change your residency options, how property is held and what happens to it later. Your lawyer reads them before your first call.",
    next: "Next we ask about your residency, property, companies, vehicles and anyone who works for you.",
  },
  situation: {
    title: "Your situation",
    ask: "Which country your membership is about (Colombia, Costa Rica, Mexico, Panama, Portugal or Spain), then your residency, property, companies, vehicles and anyone who works for you there. Most questions have an I am not sure answer.",
    why: "These answers put that country's dates on your profile, like a residency renewal or a yearly company filing. Each date is general and may require review by your lawyer.",
    next: "Next you tell us what you want to ask first.",
  },
  first: {
    title: "What you need first",
    ask: "The main question for your first call, how soon you need an answer, and which documents you already have.",
    why: "We open your first matter with this question. Your lawyer reads it before the call, so your 20 minutes go to the answer.",
    next: "Last, you check the plan, agree to the terms and pay.",
  },
  plan: {
    title: "Plan and payment",
    ask: "Check what the membership includes and costs, agree to the terms and the privacy policy, then pay.",
    why: "Your membership starts when payment is confirmed. Then your profile, your first matter and call booking open in your ILP home.",
    next: "",
  },
};

const PLAN_NEXT: Record<PaymentsMode, string> = {
  stripe: "You pay on Stripe's secure page, then come back here and go straight to your ILP home.",
  manual:
    "Our team emails you payment details within one business day. Your membership starts once payment is confirmed, and you sign in with a code we send to your email.",
};

function localStore() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

type SendState = { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string; exists?: boolean };

/**
 * The guided join (T3): five short steps, each opening with what we ask, why
 * and what happens next. Pre-filled from the free check, checked step by
 * step, kept as a draft in this browser (consents never stored). On success
 * it goes to Stripe or to /join/welcome, which opens the member's home.
 */
export default function JoinForm({ mode, check }: { mode: PaymentsMode; check: StoredCheck | null }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [restored, setRestored] = useState<string | null>(null);
  const [fromCheck, setFromCheck] = useState(false);
  const [send, setSend] = useState<SendState>({ kind: "idle" });
  const ready = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    const draft = loadDraft(localStore());
    let start = draft && hasContent(draft.data) ? draft.data : EMPTY_DRAFT;
    if (draft && hasContent(draft.data)) {
      setStep(draft.step);
      setRestored(draft.savedAt);
    }
    if (check) {
      start = draftFromCheck(start, check.answers as Record<string, unknown>, check.email);
      setFromCheck(true);
    }
    if (!start.timezone) start = { ...start, timezone: guessTimezone() };
    setD(start);
    ready.current = true;
  }, [check]);

  useEffect(() => {
    if (ready.current) saveDraft(localStore(), d, step);
  }, [d, step]);

  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  const id = STEP_IDS[step];
  const copy = STEPS[id];
  const last = step === STEP_IDS.length - 1;
  // COUNTRIES: the membership country's situation questions (the free check's).
  const { questions: countryQs, error: countryQsError, retry: retryCountryQs } = useCountryQuestions(d.legalCountry, "check");
  const countryName = isCountryCode(d.legalCountry) ? COUNTRIES[d.legalCountry].name : "";

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function go(to: number) {
    moved.current = true;
    setErrors({});
    setStep(to);
  }

  function focusFirstError(e: Errors) {
    track.formErrors("join", Object.keys(e), "join_start");
    const first = Object.keys(e)[0];
    window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-field="${first}"] input, [data-field="${first}"] select, [data-field="${first}"] textarea, [data-field="${first}"] button`,
      );
      el?.focus();
    });
  }

  function next() {
    const e = validateStep(id, d, undefined, countryQs ?? undefined);
    if (Object.keys(e).length) {
      setErrors(e);
      focusFirstError(e);
      return;
    }
    go(step + 1);
  }

  /** Server keys that differ from the form's. */
  function fromServer(e: Record<string, string>): Errors {
    const out: Errors = {};
    for (const [k, v] of Object.entries(e)) {
      if (k === "nationality") out.citizenships = v;
      else if (k === "documentsOnHand") out.documents = v;
      else out[k] = v;
    }
    return out;
  }

  async function submit() {
    const all: Errors = {};
    for (const sid of STEP_IDS) Object.assign(all, validateStep(sid, d, undefined, countryQs ?? undefined));
    if (Object.keys(all).length) {
      const firstStep = STEP_IDS.indexOf(stepOfField(Object.keys(all)[0]) ?? id);
      if (firstStep !== step) go(firstStep);
      setErrors(all);
      focusFirstError(all);
      return;
    }
    setSend({ kind: "sending" });
    const details = toJoinDetails(d);
    try {
      // The check's dates follow this email: reuse its lead, or save the
      // answers from this form as a lead (the dates email goes out as before).
      let leadId = check?.email === details.email ? check.leadId : undefined;
      if (check && !leadId) {
        const answers = checkAnswersFromDraft(d) as unknown as CheckAnswers;
        const saved = await runCheck(answers, details.email, details.fullName);
        leadId = saved.leadId;
        saveCheck({ answers, findings: saved.findings, email: details.email, leadId });
      }
      const res = await join({
        ...details,
        leadId,
        acceptTerms: true,
        consents: joinConsents(d.marketing),
        anonId: funnelAnonId(),
        source: funnelSource(),
      });
      if (res.checkoutUrl) {
        // The draft stays until the welcome page sees the membership active,
        // so a cancelled payment comes back to the same answers.
        window.location.assign(res.checkoutUrl);
        return;
      }
      clearDraft(localStore());
      router.push(`/join/welcome?t=${encodeURIComponent(res.token)}`);
    } catch (err) {
      const fields = joinFieldErrors(err);
      const status = (err as { status?: number } | null)?.status;
      if (fields) {
        const e = fromServer(fields);
        const firstStep = STEP_IDS.indexOf(stepOfField(Object.keys(e)[0]) ?? "plan");
        if (firstStep !== step) go(firstStep);
        setErrors(e);
        focusFirstError(e);
      }
      setSend({
        kind: "error",
        exists: status === 409,
        message: err instanceof Error ? err.message : "Something went wrong on our side. Your answers are saved in this browser. Try again in a few minutes.",
      });
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (last) void submit();
    else next();
  }

  function startOver() {
    clearDraft(localStore());
    const fresh = check ? draftFromCheck(EMPTY_DRAFT, check.answers as Record<string, unknown>, check.email) : EMPTY_DRAFT;
    setD({ ...fresh, timezone: guessTimezone() });
    setRestored(null);
    go(0);
  }

  const err = (k: string) => errors[k];
  const yesNo = (v: string) => v as Draft["ownsProperty"];
  const examples = isCountryCode(d.legalCountry) ? QUESTION_EXAMPLES_BY_COUNTRY[d.legalCountry] : QUESTION_EXAMPLES;
  function chooseCountry(code: string) {
    setD((prev) => {
      const next: Draft = { ...prev, legalCountry: code, countryAnswers: prev.legalCountry === code ? prev.countryAnswers : {} };
      // Living in that country: its time zone, unless one of its zones is already chosen.
      const c = isCountryCode(code) ? COUNTRIES[code] : null;
      if (c && prev.residenceCountry === c.name && !c.timeZones.some((z) => z.id === prev.timezone)) next.timezone = defaultTimezoneFor(code);
      return next;
    });
    if (errors.legalCountry) setErrors((prev) => ({ ...prev, legalCountry: undefined }));
  }
  const tzOptions = d.timezone && !TIME_ZONES.some((z) => z.value === d.timezone) ? [...TIME_ZONES, { value: d.timezone, label: d.timezone }] : TIME_ZONES;

  return (
    <div className={s.layout}>
      <aside className={s.rail} aria-label="Join steps">
        <ProgressBar
          label={`Step ${step + 1} of ${STEP_IDS.length}: ${copy.title}`}
          value={step + 1}
          max={STEP_IDS.length}
          valueText={`Step ${step + 1} of ${STEP_IDS.length}`}
        />
        <ol className={s.stepList}>
          {STEP_IDS.map((sid, i) => (
            <li key={sid} className={i === step ? s.stepNow : i < step ? s.stepDone : s.stepLater}>
              {i < step ? (
                <button type="button" className={s.stepButton} onClick={() => go(i)}>
                  <span className={s.stepNum}>{i + 1}</span> {STEPS[sid].title}
                  <span className={s.srOnly}> (done, go back to this step)</span>
                </button>
              ) : (
                <span className={s.stepLabel} aria-current={i === step ? "step" : undefined}>
                  <span className={s.stepNum}>{i + 1}</span> {STEPS[sid].title}
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className={s.railNote}>
          We save your answers in this browser as you go, except the agreements. Nothing is sent to ILP until the last step, and we never ask for card details here.
        </p>
      </aside>

      <form className={s.form} onSubmit={onSubmit} noValidate aria-labelledby="join-step-title">
        {step === 0 && restored && (
          <Notice
            tone="info"
            title="We filled in your saved answers"
            actions={
              <Button type="button" variant="secondary" size="sm" onClick={startOver}>
                Start over
              </Button>
            }
          >
            You started joining earlier in this browser. Check the answers and carry on.
          </Notice>
        )}
        {step === 0 && !restored && fromCheck && (
          <Notice tone="info" title="Your free check answers are filled in">
            We copied your country and your answers about residency, property, companies, vehicles and staff. You can change them in step 3.
          </Notice>
        )}

        <header className={s.stepHead}>
          <p className={s.stepCount}>
            Step {step + 1} of {STEP_IDS.length}
          </p>
          <h2 id="join-step-title" ref={headingRef} tabIndex={-1} className={s.stepTitle}>
            {copy.title}
          </h2>
          <dl className={s.stepIntro}>
            <div>
              <dt>What we ask</dt>
              <dd>{copy.ask}</dd>
            </div>
            <div>
              <dt>Why we need it</dt>
              <dd>{copy.why}</dd>
            </div>
            <div>
              <dt>What happens next</dt>
              <dd>{id === "plan" ? PLAN_NEXT[mode] : copy.next}</dd>
            </div>
          </dl>
        </header>

        <div className={s.fields}>
          {id === "you" && (
            <>
              <div className={s.pair}>
                <div data-field="fullName">
                  <TextInput label="Full name" hint="As it appears on your passport." autoComplete="name" value={d.fullName} onChange={(e) => set("fullName", e.target.value)} error={err("fullName")} required />
                </div>
                <div data-field="preferredName">
                  <TextInput label="What should we call you?" hint="The name your lawyer and your team use with you, like Ruth." autoComplete="nickname" value={d.preferredName} onChange={(e) => set("preferredName", e.target.value)} error={err("preferredName")} optional />
                </div>
              </div>
              <div data-field="email">
                <TextInput type="email" inputMode="email" label="Email" hint="You sign in with a code sent to this address. We never ask for a password." autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} error={err("email")} required />
              </div>
              <div data-field="phone">
                <TextInput type="tel" inputMode="tel" label="Mobile or WhatsApp" hint="With the country code, like +1 503 555 0141 or +34 612 345 678. Your team uses it to confirm calls." autoComplete="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} error={err("phone")} required />
              </div>
              <div data-field="preferredLanguage">
                <RadioGroup label="Language for calls and messages" hint="Your lawyer and your team speak English. Some also speak Spanish." name="preferredLanguage" inline options={LANGUAGE_OPTIONS} value={d.preferredLanguage} onChange={(v) => set("preferredLanguage", v)} error={err("preferredLanguage")} required />
              </div>
              <div data-field="citizenships">
                <ChipSelect label="Your citizenship" hint="Choose every country whose passport you hold. We do not need passport numbers." options={CITIZENSHIPS} value={d.citizenships} onChange={(v) => set("citizenships", v)} error={err("citizenships")} required />
              </div>
              {d.citizenships.includes("other") && (
                <div data-field="otherCitizenship">
                  <TextInput label="Which other country?" hint="For example: United Kingdom." value={d.otherCitizenship} onChange={(e) => set("otherCitizenship", e.target.value)} error={err("otherCitizenship")} required />
                </div>
              )}
              <div data-field="residenceCountry">
                <RadioGroup label="Where do you live now?" hint="Where you spend most of the year." name="residenceCountry" options={RESIDENCE_COUNTRIES} value={d.residenceCountry} onChange={(v) => set("residenceCountry", v)} error={err("residenceCountry")} required />
              </div>
              {d.residenceCountry === "other" && (
                <div data-field="residenceCountryOther">
                  <TextInput label="Which country?" autoComplete="country-name" value={d.residenceCountryOther} onChange={(e) => set("residenceCountryOther", e.target.value)} error={err("residenceCountryOther")} required />
                </div>
              )}
              {d.residenceCountry === "Costa Rica" && (
                <div className={s.pair}>
                  <div data-field="residenceProvince">
                    <Select label="Province" value={d.residenceProvince} onChange={(e) => set("residenceProvince", e.target.value)} error={err("residenceProvince")} required placeholder="Choose a province" options={PROVINCES.map((p) => ({ value: p, label: p }))} />
                  </div>
                  <div data-field="residenceTown">
                    <TextInput label="Town" hint="Like Atenas, Grecia or Tamarindo." autoComplete="address-level2" value={d.residenceTown} onChange={(e) => set("residenceTown", e.target.value)} error={err("residenceTown")} optional />
                  </div>
                </div>
              )}
              <div data-field="timezone">
                <Select label="Your time zone" hint="We show call times in this time zone. We guessed it from this device; change it if it is wrong." value={d.timezone} onChange={(e) => set("timezone", e.target.value)} error={err("timezone")} required placeholder="Choose a time zone" options={tzOptions} />
              </div>
            </>
          )}

          {id === "household" && (
            <>
              <div data-field="maritalStatus">
                <Select label="Marital status" hint="In each of our six countries, being married can change how property is held and inherited." value={d.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)} error={err("maritalStatus")} required placeholder="Choose one" options={MARITAL_OPTIONS} />
              </div>
              <div data-field="livesWithPartner">
                <RadioGroup label="Does a spouse or partner live with you?" name="livesWithPartner" inline options={YES_NO} value={d.livesWithPartner} onChange={(v) => set("livesWithPartner", yesNo(v))} error={err("livesWithPartner")} required />
              </div>
              <div className={s.pair}>
                <div data-field="childrenAtHome">
                  <NumberStepper label="Children living with you" hint="Enter 0 if none." value={d.childrenAtHome} onChange={(v) => set("childrenAtHome", v)} min={0} max={20} unit={["child", "children"]} error={err("childrenAtHome")} required />
                </div>
                <div data-field="otherHousehold">
                  <NumberStepper label="Other people living with you" hint="Parents or other relatives. Enter 0 if none." value={d.otherHousehold} onChange={(v) => set("otherHousehold", v)} min={0} max={20} unit={["person", "people"]} error={err("otherHousehold")} required />
                </div>
              </div>
              <div data-field="pets">
                <TextInput label="Pets" hint="Useful if you travel or move with them, like two dogs." value={d.pets} onChange={(e) => set("pets", e.target.value)} error={err("pets")} optional />
              </div>
            </>
          )}

          {id === "situation" && (
            <>
              <div data-field="legalCountry">
                <RadioGroup
                  label="Which country is your membership about?"
                  hint="The country where your residency, property or company is. Your lawyer is licensed there, and the dates on your profile are that country's."
                  name="legalCountry"
                  options={LEGAL_COUNTRY_OPTIONS}
                  value={d.legalCountry}
                  onChange={chooseCountry}
                  error={err("legalCountry")}
                  required
                />
              </div>
              {isCountryCode(d.legalCountry) && (
                <fieldset className={s.group}>
                  <legend className={s.groupLegend}>Your situation in {countryName}</legend>
                  {countryQsError ? (
                    <Notice tone="warning" title="The questions did not load" fix={{ steps: ["Check your connection.", "Press Try again.", "Your other answers are kept in this browser."] }} actions={<Button type="button" variant="secondary" size="sm" onClick={retryCountryQs}>Try again</Button>}>
                      {countryQsError}
                    </Notice>
                  ) : countryQs === null ? (
                    <p className={s.railNote} aria-live="polite">Loading the questions for {countryName}…</p>
                  ) : (
                    <CountryQuestionFields
                      questions={countryQs}
                      answers={d.countryAnswers}
                      onChange={(next) => {
                        set("countryAnswers", next);
                        setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("countryAnswers."))));
                      }}
                      errors={errors}
                      idPrefix="join"
                    />
                  )}
                </fieldset>
              )}
            </>
          )}

          {id === "first" && (
            <>
              <div className={s.guide}>
                <p className={s.guideTitle}>Examples of a first question</p>
                <ul>
                  {examples.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
              <div data-field="question">
                <TextArea
                  label="Your main question for the first call"
                  hint="A sentence or two in your own words. You can add more questions later in your ILP home."
                  value={d.question}
                  onChange={(e) => set("question", e.target.value)}
                  rows={4}
                  autoGrow
                  maxLength={QUESTION_MAX + 50}
                  error={err("question")}
                  required
                />
                <p className={d.question.trim().length > QUESTION_MAX ? `${s.counter} ${s.counterOver}` : s.counter} aria-live="polite">
                  {d.question.trim().length} of {QUESTION_MAX} characters
                </p>
              </div>
              <div data-field="urgency">
                <RadioGroup label="How soon do you need an answer?" name="urgency" options={URGENCY_OPTIONS} value={d.urgency} onChange={(v) => set("urgency", v)} error={err("urgency")} required />
              </div>
              {d.urgency === "deadline" && (
                <div data-field="deadlineAt">
                  <DateInput label="Date of the deadline" hint="Your team uses it to offer you an early call." value={d.deadlineAt} onChange={(e) => set("deadlineAt", e.target.value)} error={err("deadlineAt")} required />
                </div>
              )}
              <div data-field="documents">
                <ChipSelect
                  label="Which of these documents do you already have?"
                  hint="Just tick them. You upload documents later in your ILP home, not here."
                  options={DOCUMENT_OPTIONS}
                  value={d.documents}
                  onChange={(v) => set("documents", toggleDocuments(v, d.documents))}
                  error={err("documents")}
                  required
                />
              </div>
            </>
          )}

          {id === "plan" && (
            <>
              <section className={s.plan} aria-labelledby="plan-name">
                <h3 id="plan-name" className={s.planName}>ILP membership</h3>
                <PriceAnchor size="sm" />
                <p className={s.priceUnit}>Plus a {PRICE.activation} one-time activation fee</p>
                <ul className={s.includes}>
                  <li>
                    Up to {PRICE.calls} video calls a month of {PRICE.callLength} minutes each ({PRICE.minutes} minutes) with a lawyer licensed in {countryName || "your country"}
                  </li>
                  <li>A brief prepared from your profile before each call, so your minutes go to your question</li>
                  <li>A customer success manager who follows up on the next steps after every call</li>
                  <li>Your legal profile, with reminders before the dates on it</li>
                  <li>Legal work such as filings, drafting or representation is quoted separately, and nothing starts until you accept the quote</li>
                  <li>Unused minutes do not roll over to the next month</li>
                </ul>
                <div className={s.totals}>
                  <div className={s.totalRow}>
                    <span>Activation, one time</span>
                    <span>{PRICE.activation}</span>
                  </div>
                  <div className={s.totalRow}>
                    <span>First month</span>
                    <span>{PRICE.monthly}</span>
                  </div>
                  <div className={`${s.totalRow} ${s.totalStrong}`}>
                    <span>Due today</span>
                    <span>{PRICE.dueToday}</span>
                  </div>
                </div>
              </section>

              <Notice tone="neutral" title="Renewal and cancelling">
                Your membership renews every month at {PRICE.monthly} until you cancel. You can cancel online at any time from your ILP home, and you keep access until the end of the month you paid for. The activation fee is charged once.
              </Notice>

              <TutorialEmbed
                tutorialId="public.member-home"
                caption="What happens after you join: your next step, your call minutes and booking, in your ILP home."
                headingLevel={3}
              />

              <dl className={s.review}>
                <div>
                  <dt>Name</dt>
                  <dd>{d.fullName || "Not filled in"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{d.email || "Not filled in"}</dd>
                </div>
                <div>
                  <dt>First question</dt>
                  <dd>{d.question.trim() || "Not filled in"}</dd>
                </div>
              </dl>

              <div data-field="acceptTerms">
                <Checkbox
                  label={
                    <>
                      I agree to the <Link href="/terms" target="_blank" rel="noopener">Terms of Membership (opens in a new tab)</Link>, including the automatic monthly renewal. I understand ILP is not a law firm, connects me with independent lawyers, and quotes legal work separately.
                    </>
                  }
                  checked={d.acceptTerms}
                  onChange={(e) => set("acceptTerms", e.target.checked)}
                  error={err("acceptTerms")}
                  required
                />
              </div>
              <div data-field="acceptPrivacy">
                <Checkbox
                  label={
                    <>
                      I agree to the <Link href="/privacy" target="_blank" rel="noopener">Privacy Policy (opens in a new tab)</Link>: ILP and my lawyers may use the information I give, including documents and, if I allow it for a call, recordings, to provide the membership, and ILP&apos;s providers may process it outside Costa Rica.
                    </>
                  }
                  checked={d.acceptPrivacy}
                  onChange={(e) => set("acceptPrivacy", e.target.checked)}
                  error={err("acceptPrivacy")}
                  required
                />
              </div>
              <div data-field="marketing">
                <Checkbox label="Optional: email me ILP news and offers. I can stop them at any time." checked={d.marketing} onChange={(e) => set("marketing", e.target.checked)} />
              </div>

              <p className={s.payNote}>
                {mode === "stripe"
                  ? `You pay ${PRICE.dueToday} on Stripe's secure checkout page. Your card details go to Stripe, not to ILP.`
                  : `Our team will email you how to pay ${PRICE.dueToday}. Your membership starts as soon as payment is confirmed.`}
              </p>
            </>
          )}
        </div>

        {send.kind === "error" && send.exists && (
          <Notice
            tone="info"
            title="This email already has a membership"
            actions={
              <Link href="/status" className={s.inlineLink}>
                Sign in to your ILP home
              </Link>
            }
          >
            {send.message}
          </Notice>
        )}
        {send.kind === "error" && !send.exists && (
          <Notice
            tone="danger"
            urgent
            title="We could not finish joining"
            fix={{
              steps: [
                "Read the message below and fix any answer marked on the form.",
                "Press the button at the bottom again. Your answers stay in this browser.",
              ],
            }}
          >
            {send.message}
          </Notice>
        )}

        <div className={s.actions}>
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={() => go(step - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" busy={send.kind === "sending"}>
            {!last ? "Continue" : mode === "stripe" ? `Continue to payment, ${PRICE.dueToday}` : "Join ILP"}
          </Button>
        </div>
      </form>
    </div>
  );
}
