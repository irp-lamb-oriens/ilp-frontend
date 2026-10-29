"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Button,
  Checkbox,
  ChipSelect,
  FieldError,
  MoneyInput,
  Notice,
  NumberStepper,
  ProgressBar,
  RadioGroup,
  Select,
  TextArea,
  TextInput,
  WeeklyHoursEditor,
  type WeeklyWindowValue,
} from "@/components/ui";
import { API_URL } from "@/lib/api";
import { track } from "@/lib/journey";
import { COUNTRIES, isCountryCode } from "@/lib/contracts";
import { COUNTRY_ZONE_OPTIONS, zoneLabelOf } from "@/lib/timeZones";
import { LEGAL_VERSIONS } from "@/components/legal/versions";
import { PARTNER_TERMS_VERSION } from "@/components/legal/content/partner";
import {
  APPLIED_EMAIL_KEY,
  AREAS,
  BIO_MAX,
  BIO_MIN,
  clearDraft,
  type Draft,
  EMPTY_DRAFT,
  type Errors,
  FIELD_STEP,
  FLAT_FEES,
  hasContent,
  LANGUAGES,
  loadDraft,
  licensingFor,
  NOTICE_OPTIONS,
  PRACTICE_COUNTRIES,
  PROVINCES,
  saveDraft,
  STEP_IDS,
  type StepId,
  toRequestBody,
  validateStep,
} from "./applyModel";
import s from "./apply.module.scss";

interface StepCopy {
  title: string;
  ask: string;
  why: string;
  next: string;
}

const STEPS: Record<StepId, StepCopy> = {
  you: {
    title: "You",
    ask: "The country where you are licensed, your name, how to reach you, the languages you can hold a call in and where you work.",
    why: "We use your email to open your lawyer account and to send your sign-in codes. Members are matched to lawyers who speak their language.",
    next: "Next we ask about your practice and your licence number.",
  },
  practice: {
    title: "Your practice",
    ask: "Your licence number with the body that licenses lawyers in your country (for example the Colegio de Abogados y Abogadas de Costa Rica carné, or the Ordem dos Advogados cédula in Portugal), the year you were admitted, whether you are a notary, and your firm if you have one.",
    why: "We check your licence with that body before anyone can book you. Some member work, like a property transfer, needs a notary.",
    next: "Next you choose the legal areas you take.",
  },
  areas: {
    title: "Legal areas",
    ask: "The kinds of law you take, and how much of your work each one is.",
    why: "Members without an assigned lawyer are matched by legal area, so you get questions you can answer.",
    next: "Next you set the hours when members could book you.",
  },
  availability: {
    title: "Availability",
    ask: "Your usual weekly hours, how many 20-minute calls a week you could take, and the notice you need.",
    why: "Members can only book inside these hours. We save them to your account, and you can change them any time in the portal.",
    next: "Next we ask about your fees for paid work.",
  },
  fees: {
    title: "Fees",
    ask: "Your usual hourly rate and, if you like, your typical flat fees for common work, in US dollars.",
    why: "When a member needs more than a call, we prepare the quote with you. Members see the price of a quote, not your hourly rate.",
    next: "Next you write a short introduction for members.",
  },
  about: {
    title: "About you",
    ask: "A short introduction for members, in English if you can.",
    why: "Members read it before they talk to you. It helps them feel they know who is on the call.",
    next: "Last, you confirm a few agreements and send the application.",
  },
  agreements: {
    title: "Agreements",
    ask: "Four confirmations, including permission to check your licence with the body that issued it.",
    why: "We need them to review the application and to keep a record of what you agreed to.",
    next: "After you send, we email you a confirmation and you can sign in to the lawyer portal. We email you again when the review is done.",
  },
};

const COMFORT_OPTIONS = [
  { value: "regular", label: "Most of my work" },
  { value: "sometimes", label: "Some of my work" },
];

function sessionStore() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}
function localStore() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

type SendState = { kind: "idle" } | { kind: "sending" } | { kind: "exists"; message: string } | { kind: "error"; message: string };

/**
 * The partner lawyer application: seven short steps, each opening with what
 * we ask, why and what happens next. Checks every step before moving on,
 * keeps a draft in this browser (agreements excluded), and on success sends
 * the lawyer to /lawyer with their email ready for a sign-in code.
 */
export default function ApplyForm() {
  const router = useRouter();
  const [d, setD] = useState<Draft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [restored, setRestored] = useState<string | null>(null);
  const [send, setSend] = useState<SendState>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useRef(0);
  const ready = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
    const draft = loadDraft(localStore());
    if (draft && hasContent(draft.data)) {
      setD(draft.data);
      setStep(draft.step);
      setRestored(draft.savedAt);
    }
    ready.current = true;
  }, []);

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

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    if (!applyStarted.current) {
      applyStarted.current = true;
      track.step("lawyer_apply_start");
    }
    setD((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // JOURNEYS: the first answer starts the application (lawyer_apply_start).
  const applyStarted = useRef(false);

  function go(to: number) {
    moved.current = true;
    setErrors({});
    setStep(to);
  }

  function next() {
    const e = validateStep(id, d);
    if (Object.keys(e).length) {
      setErrors(e);
      focusFirstError(e);
      return;
    }
    go(step + 1);
  }

  function focusFirstError(e: Errors) {
    track.formErrors("lawyer_apply", Object.keys(e));
    const first = Object.keys(e)[0];
    window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] select, [data-field="${first}"] textarea, [data-field="${first}"] button`);
      el?.focus();
    });
  }

  async function submit() {
    const all: Errors = {};
    for (const sid of STEP_IDS) Object.assign(all, validateStep(sid, d));
    if (Object.keys(all).length) {
      const firstStep = STEP_IDS.indexOf(FIELD_STEP[Object.keys(all)[0]] ?? id);
      if (firstStep !== step) go(firstStep);
      setErrors(all);
      focusFirstError(all);
      return;
    }
    setSend({ kind: "sending" });
    const body = toRequestBody(
      d,
      { partnerTerms: PARTNER_TERMS_VERSION, privacy: LEGAL_VERSIONS.privacy },
      { homepage: honeypot, elapsedMs: Date.now() - startedAt.current },
    );
    let res: Response;
    let json: { error?: string; errors?: Errors } = {};
    try {
      res = await fetch(`${API_URL}/api/providers/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      json = await res.json().catch(() => ({}));
    } catch {
      setSend({ kind: "error", message: "We could not reach ILP. Check your connection and press Send application again. Your answers are still here." });
      return;
    }
    if (res.status === 201 || res.status === 202) {
      clearDraft(localStore());
      try {
        sessionStore()?.setItem(APPLIED_EMAIL_KEY, body.email);
      } catch {
        // The sign-in page asks for the email instead.
      }
      router.push("/lawyer?applied=1");
      return;
    }
    if (res.status === 400 && json.errors) {
      const fieldErrors = json.errors;
      const firstStep = STEP_IDS.indexOf(FIELD_STEP[Object.keys(fieldErrors)[0]] ?? "agreements");
      if (firstStep !== step) go(firstStep);
      setErrors(fieldErrors);
      setSend({ kind: "error", message: json.error ?? "Some answers need a fix. Each one is marked on the form." });
      focusFirstError(fieldErrors);
      return;
    }
    if (res.status === 409) {
      try {
        sessionStore()?.setItem(APPLIED_EMAIL_KEY, body.email);
      } catch {
        // ignore
      }
      setSend({ kind: "exists", message: json.error ?? "We already have a lawyer account or application for this email." });
      return;
    }
    if (res.status === 429) {
      setSend({ kind: "error", message: json.error ?? "Too many tries from this connection. Wait an hour, then send again." });
      return;
    }
    setSend({ kind: "error", message: "Something went wrong on our side. Your answers are saved in this browser. Try again in a few minutes." });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (last) void submit();
    else next();
  }

  function startOver() {
    clearDraft(localStore());
    setD(EMPTY_DRAFT);
    setRestored(null);
    go(0);
  }

  const err = (k: string) => errors[k];
  // COUNTRIES: the licensing body, number label and time zone follow the country of practice.
  const lic = licensingFor(d.country);
  const tz = d.timezone || (isCountryCode(d.country) ? COUNTRIES[d.country].defaultTimeZone : "America/Costa_Rica");

  return (
    <div className={s.layout}>
      <aside className={s.rail} aria-label="Application steps">
        <ProgressBar label={`Step ${step + 1} of ${STEP_IDS.length}: ${copy.title}`} value={step + 1} max={STEP_IDS.length} valueText={`Step ${step + 1} of ${STEP_IDS.length}`} />
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
        <p className={s.railNote}>We save your answers in this browser as you go, except the agreements. Nothing is sent to ILP until the last step.</p>
      </aside>

      <form className={s.form} onSubmit={onSubmit} noValidate aria-labelledby="apply-step-title">
        {restored && step === 0 && (
          <Notice
            tone="info"
            title="We filled in your saved answers"
            actions={
              <Button type="button" variant="secondary" size="sm" onClick={startOver}>
                Start over
              </Button>
            }
          >
            You started this application earlier in this browser. Check the answers and carry on.
          </Notice>
        )}

        <header className={s.stepHead}>
          <p className={s.stepCount}>
            Step {step + 1} of {STEP_IDS.length}
          </p>
          <h2 id="apply-step-title" ref={headingRef} tabIndex={-1} className={s.stepTitle}>
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
              <dd>{copy.next}</dd>
            </div>
          </dl>
        </header>

        <div className={s.fields}>
          {id === "you" && (
            <>
              <div data-field="country">
                <RadioGroup
                  label="Where are you licensed to practise?"
                  hint="Members are matched with lawyers licensed in the country their question is about."
                  name="country"
                  options={PRACTICE_COUNTRIES}
                  value={d.country}
                  onChange={(v) => {
                    set("country", v);
                    set("timezone", "");
                    if (v !== "CR" && (PROVINCES as readonly string[]).includes(d.province)) set("province", "");
                  }}
                  error={err("country")}
                  required
                />
              </div>
              <div data-field="name">
                <TextInput label="Full name" hint="As it appears on your licence." autoComplete="name" value={d.name} onChange={(e) => set("name", e.target.value)} error={err("name")} required />
              </div>
              <div data-field="email">
                <TextInput type="email" label="Email" hint="Your sign-in codes and our replies go here." autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} error={err("email")} required />
              </div>
              <div data-field="phone">
                <TextInput type="tel" label="Mobile or WhatsApp" hint="With the country code, like +506 8888 1234 or +351 912 345 678. We call or write only about your application and your calls." autoComplete="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} error={err("phone")} required />
              </div>
              <div data-field="languages">
                <ChipSelect label="Languages you can hold a call in" hint="Most members speak English. Choose every language you are comfortable advising in." options={LANGUAGES} value={d.languages} onChange={(v) => set("languages", v)} error={err("languages")} required />
              </div>
              <div className={s.pair}>
                <div data-field="city">
                  <TextInput label="City or town" hint="Where you usually work, like Escazú, Medellín or Lisbon." autoComplete="address-level2" value={d.city} onChange={(e) => set("city", e.target.value)} error={err("city")} required />
                </div>
                <div data-field="province">
                  {d.country === "CR" || !d.country ? (
                    <Select label="Province" value={d.province} onChange={(e) => set("province", e.target.value)} error={err("province")} required placeholder="Choose a province" options={PROVINCES.map((p) => ({ value: p, label: p }))} />
                  ) : (
                    <TextInput label="State, region or department" hint="Like Antioquia, Jalisco, Andalusia or Lisboa." value={d.province} onChange={(e) => set("province", e.target.value)} error={err("province")} required />
                  )}
                </div>
              </div>
            </>
          )}

          {id === "practice" && (
            <>
              <div className={s.pair}>
                <div data-field="carne">
                  <TextInput
                    label={d.country === "CR" || !d.country ? "Colegio carné number" : lic.numberLabel}
                    hint={d.country === "CR" || !d.country ? "Your membership number with the Colegio de Abogados y Abogadas de Costa Rica. Digits only." : `As issued by the ${lic.body}.`}
                    inputMode={d.country === "CR" || !d.country ? "numeric" : "text"}
                    value={d.carne} onChange={(e) => set("carne", e.target.value)} error={err("carne")} required />
                </div>
                <div data-field="yearAdmitted">
                  <TextInput label="Year admitted" hint="The year you were sworn in, like 2011." inputMode="numeric" maxLength={4} value={d.yearAdmitted} onChange={(e) => set("yearAdmitted", e.target.value.replace(/\D/g, ""))} error={err("yearAdmitted")} required />
                </div>
              </div>
              <div data-field="yearsInPractice">
                <NumberStepper label="Years in practice" hint={`Count the years you have practised law, in ${lic.countryName} or elsewhere.`} value={d.yearsInPractice} onChange={(v) => set("yearsInPractice", v)} min={0} max={70} unit={["year", "years"]} error={err("yearsInPractice")} required />
              </div>
              <div data-field="notary">
                <RadioGroup
                  label="Are you a notary public?"
                  name="notary"
                  inline
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                  value={d.notary}
                  onChange={(v) => set("notary", v as Draft["notary"])}
                  error={err("notary")}
                  required
                />
              </div>
              {d.notary === "yes" && (
                <div data-field="notaryCarne">
                  <TextInput label="Notary number" hint="The number on your notary registration. We check it too." inputMode="numeric" value={d.notaryCarne} onChange={(e) => set("notaryCarne", e.target.value)} error={err("notaryCarne")} required />
                </div>
              )}
              <div className={s.pair}>
                <div data-field="firmName">
                  <TextInput label="Firm name" hint="Leave it empty if you work on your own." autoComplete="organization" value={d.firmName} onChange={(e) => set("firmName", e.target.value)} error={err("firmName")} optional />
                </div>
                <div data-field="firmWebsite">
                  <TextInput type="url" label="Firm website" hint="Like yourfirm.cr." autoComplete="url" value={d.firmWebsite} onChange={(e) => set("firmWebsite", e.target.value)} error={err("firmWebsite")} optional />
                </div>
              </div>
            </>
          )}

          {id === "areas" && (
            <>
              <div data-field="areas">
                <ChipSelect label="Legal areas you take" hint="Choose every area where you would answer a member's question." options={AREAS} value={d.areas} onChange={(v) => set("areas", v)} error={err("areas")} required />
              </div>
              {d.areas.includes("other") && (
                <div data-field="otherArea">
                  <TextInput label="Which other area?" hint="For example: litigation, environmental permits." value={d.otherArea} onChange={(e) => set("otherArea", e.target.value)} error={err("otherArea")} required />
                </div>
              )}
              {d.areas.length > 0 && (
                <fieldset className={s.comfort}>
                  <legend className={s.comfortLegend}>How much of your work is each area? (optional)</legend>
                  <p className={s.hint}>This helps us send you the questions you know best. Skip it if you prefer.</p>
                  {d.areas.map((a) => (
                    <RadioGroup
                      key={a}
                      label={AREAS.find((x) => x.value === a)?.label ?? a}
                      name={`comfort_${a}`}
                      inline
                      optional
                      options={COMFORT_OPTIONS}
                      value={d.areaComfort[a] ?? ""}
                      onChange={(v) => set("areaComfort", { ...d.areaComfort, [a]: v as "regular" | "sometimes" })}
                    />
                  ))}
                </fieldset>
              )}
            </>
          )}

          {id === "availability" && (
            <>
              <fieldset className={s.hours} data-field="weekly" aria-describedby={err("weekly") ? "weekly-hint weekly-error" : "weekly-hint"} aria-invalid={err("weekly") ? true : undefined}>
                <legend className={s.comfortLegend}>Your usual weekly hours ({zoneLabelOf(tz)})</legend>
                <p id="weekly-hint" className={s.hint}>Switch on the days you could take calls and set the hours. Each call is 20 minutes.</p>
                <WeeklyHoursEditor value={d.weekly as WeeklyWindowValue[]} onChange={(v) => set("weekly", v)} defaultWindow={{ start: "09:00", end: "12:00" }} idPrefix="apply-hours" />
                <FieldError id="weekly-error">{err("weekly")}</FieldError>
              </fieldset>
              <div data-field="timezone">
                <Select
                  label="Time zone of these hours"
                  hint="It defaults to the country where you are licensed. Members see your times in their own time zone."
                  value={tz}
                  onChange={(e) => set("timezone", e.target.value)}
                  error={err("timezone")}
                  options={COUNTRY_ZONE_OPTIONS.some((z) => z.value === tz) ? COUNTRY_ZONE_OPTIONS : [...COUNTRY_ZONE_OPTIONS, { value: tz, label: tz }]}
                />
              </div>
              <div data-field="callsPerWeek">
                <NumberStepper label="Calls you could take in a week" hint="A guess is fine. You can change it later." value={d.callsPerWeek} onChange={(v) => set("callsPerWeek", v)} min={1} max={40} presets={[3, 6, 10]} unit={["call", "calls"]} error={err("callsPerWeek")} required />
              </div>
              <div data-field="minNoticeHours">
                <RadioGroup label="Minimum notice before a call" hint="Members cannot book a call that starts sooner than this." name="notice" inline options={NOTICE_OPTIONS} value={d.minNoticeHours} onChange={(v) => set("minNoticeHours", v)} error={err("minNoticeHours")} required />
              </div>
            </>
          )}

          {id === "fees" && (
            <>
              <div data-field="hourlyRateCents">
                <MoneyInput
                  label="Your usual hourly rate"
                  hint="In US dollars, before tax. ILP staff see it; members do not."
                  valueCents={typeof d.hourlyRateCents === "number" ? d.hourlyRateCents : null}
                  onChangeCents={(c) => set("hourlyRateCents", c === undefined ? "invalid" : c)}
                  error={err("hourlyRateCents")}
                  required
                />
              </div>
              <fieldset className={s.comfort}>
                <legend className={s.comfortLegend}>Typical flat fees (optional)</legend>
                <p className={s.hint}>If you usually charge a flat fee for any of these, enter it in US dollars. Leave the rest empty.</p>
                <div className={s.feeGrid}>
                  {FLAT_FEES.map((f) => (
                    <div key={f.key} data-field={`fee_${f.key}`}>
                      <MoneyInput
                        label={f.label}
                        valueCents={typeof d.flatFeesCents[f.key] === "number" ? (d.flatFeesCents[f.key] as number) : null}
                        onChangeCents={(c) => set("flatFeesCents", { ...d.flatFeesCents, [f.key]: c === undefined ? "invalid" : c })}
                        error={err(`fee_${f.key}`)}
                        optional
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
              <div data-field="quotePreference">
                <RadioGroup
                  label="How do you prefer to quote?"
                  name="quotePreference"
                  options={[
                    { value: "flat", label: "A flat fee for the whole job" },
                    { value: "hourly", label: "Hourly, with an estimate of the hours" },
                    { value: "either", label: "It depends on the job" },
                  ]}
                  value={d.quotePreference}
                  onChange={(v) => set("quotePreference", v as Draft["quotePreference"])}
                  error={err("quotePreference")}
                  required
                />
              </div>
              <div data-field="invoicingEntity">
                <RadioGroup
                  label="Who sends your invoices?"
                  hint="We only need to know which one. We ask for payout and invoice details after you are approved."
                  name="invoicingEntity"
                  inline
                  options={[
                    { value: "individual", label: "I do, as an individual" },
                    { value: "firm", label: "My firm" },
                  ]}
                  value={d.invoicingEntity}
                  onChange={(v) => set("invoicingEntity", v as Draft["invoicingEntity"])}
                  error={err("invoicingEntity")}
                  required
                />
              </div>
            </>
          )}

          {id === "about" && (
            <>
              <div className={s.guide}>
                <p className={s.guideTitle}>What to write</p>
                <ul>
                  <li>Where you practise and for how long.</li>
                  <li>The kinds of questions you help with most, in plain words.</li>
                  <li>The languages you speak on calls.</li>
                </ul>
                <p className={s.hint}>Example: “I have practised in Escazú since 2011, mostly residency and property for people moving from the US and Canada. I take calls in English and Spanish.”</p>
              </div>
              <div data-field="bio">
                <TextArea
                  label="Your introduction for members"
                  hint={`Between ${BIO_MIN} and ${BIO_MAX} characters. You can change it later. A photo comes later too, inside the portal.`}
                  value={d.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={6}
                  autoGrow
                  maxLength={BIO_MAX + 50}
                  error={err("bio")}
                  required
                />
                <p className={d.bio.trim().length > BIO_MAX ? `${s.counter} ${s.counterOver}` : s.counter} aria-live="polite">
                  {d.bio.trim().length} of {BIO_MAX} characters
                  {d.bio.trim().length < BIO_MIN ? `, at least ${BIO_MIN}` : ""}
                </p>
              </div>
            </>
          )}

          {id === "agreements" && (
            <>
              <dl className={s.review}>
                <div>
                  <dt>Name</dt>
                  <dd>{d.name || "Not filled in"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{d.email || "Not filled in"}</dd>
                </div>
                <div>
                  <dt>{lic.numberLabel}</dt>
                  <dd>{d.carne || "Not filled in"}</dd>
                </div>
                <div>
                  <dt>Areas</dt>
                  <dd>{d.areas.map((a) => AREAS.find((x) => x.value === a)?.label ?? a).join(", ") || "None chosen"}</dd>
                </div>
              </dl>
              <div data-field="licensedInGoodStanding">
                <Checkbox label={`I am licensed to practise law in ${lic.countryName} and in good standing with the ${lic.body}.`} checked={d.licensedInGoodStanding} onChange={(e) => set("licensedInGoodStanding", e.target.checked)} error={err("licensedInGoodStanding")} required />
              </div>
              <div data-field="partnerTerms">
                <Checkbox
                  label={
                    <>
                      I have read the{" "}
                      <Link href="/legal/partner-terms" target="_blank" rel="noopener">
                        partner lawyer terms (draft, opens in a new tab)
                      </Link>{" "}
                      and agree to them.
                    </>
                  }
                  hint="The terms are a draft that ILP's counsel is still reviewing. If they change, we ask you to agree to the new version."
                  checked={d.partnerTerms}
                  onChange={(e) => set("partnerTerms", e.target.checked)}
                  error={err("partnerTerms")}
                  required
                />
              </div>
              <div data-field="privacy">
                <Checkbox
                  label={
                    <>
                      I have read the{" "}
                      <Link href="/privacy" target="_blank" rel="noopener">
                        privacy policy (opens in a new tab)
                      </Link>{" "}
                      and agree to ILP using my application as it describes.
                    </>
                  }
                  checked={d.privacy}
                  onChange={(e) => set("privacy", e.target.checked)}
                  error={err("privacy")}
                  required
                />
              </div>
              <div data-field="carneVerification">
                <Checkbox
                  label={`ILP may check my ${lic.numberLabel.toLowerCase()} with the ${lic.body}, and my notary registration if I gave a notary number.`}
                  checked={d.carneVerification}
                  onChange={(e) => set("carneVerification", e.target.checked)}
                  error={err("carneVerification")}
                  required
                />
              </div>
            </>
          )}
        </div>

        <div className={s.honeypot} aria-hidden="true">
          <label htmlFor="apply-homepage">Leave this empty</label>
          <input id="apply-homepage" name="homepage" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        {send.kind === "error" && (
          <Notice
            tone="danger"
            urgent
            title="The application was not sent"
            fix={{ steps: ["Read the message below and fix any answer marked on the form.", "Press Send application again. Your answers stay in this browser."] }}
          >
            {send.message}
          </Notice>
        )}
        {send.kind === "exists" && (
          <Notice
            tone="info"
            title="This email already has a lawyer account"
            actions={
              <Link href="/lawyer?applied=existing" className={s.inlineLink}>
                Sign in to the lawyer portal
              </Link>
            }
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
            {last ? "Send application" : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
