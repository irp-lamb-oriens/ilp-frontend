"use client";

import { useEffect, useState } from "react";
import { funnelAnonId, funnelSource, trackFunnel } from "@/lib/funnel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FunnelHeader from "@/app/check/FunnelHeader";
import {
  EMAIL_RE,
  PRICE,
  type PaymentsMode,
  type StoredCheck,
  getPlan,
  join,
  loadCheck,
  runCheck,
  saveCheck,
} from "./joinApi";
import s from "@/app/check/funnel.module.scss";

export default function JoinPage() {
  const router = useRouter();
  const [mode, setMode] = useState<PaymentsMode>("manual");
  const [check, setCheck] = useState<StoredCheck | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const stored = loadCheck();
    setCheck(stored);
    if (stored?.email) setEmail(stored.email);
    setCancelled(new URLSearchParams(window.location.search).get("cancelled") === "1");
    void getPlan().then((p) => setMode(p.mode));
    trackFunnel("join_started", { leadId: stored?.leadId });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!fullName.trim()) return setError("Enter your full name.");
    if (!EMAIL_RE.test(cleanEmail)) return setError("Enter a valid email address.");
    if (!accept) return setError("Please confirm you have read the membership terms.");

    setBusy(true);
    try {
      // Save the check answers as a lead under this email so they pre-fill the profile.
      let leadId = check?.email === cleanEmail ? check.leadId : undefined;
      if (check && !leadId) {
        const saved = await runCheck(check.answers, cleanEmail, fullName.trim());
        leadId = saved.leadId;
        saveCheck({ ...check, email: cleanEmail, leadId });
      }
      const res = await join({
        email: cleanEmail,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        leadId,
        acceptTerms: true,
        anonId: funnelAnonId(),
        source: funnelSource(),
      });
      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl);
        return;
      }
      router.push(`/join/welcome?t=${encodeURIComponent(res.token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const findingsCount = check?.findings.length ?? 0;

  return (
    <div className={s.page}>
      <FunnelHeader note="Secure sign-up" />
      <main className={s.main}>
        <h1 className={s.title}>Join ILP</h1>
        <p className={s.help}>
          {findingsCount
            ? `Your ${findingsCount} ${findingsCount === 1 ? "date" : "dates"} from the check will be on your profile, ready for your first call.`
            : "One membership for your legal life in Costa Rica."}
        </p>

        {cancelled && (
          <p className={s.error} role="status">Payment was not completed. You can try again below.</p>
        )}

        <section className={s.plan} aria-labelledby="plan-name">
          <h2 id="plan-name" className={s.planName}>ILP membership</h2>
          <div className={s.priceLine}>
            <span className={s.price}>{PRICE.monthly}</span>
            <span className={s.priceUnit}>a month, plus a {PRICE.activation} one-time activation</span>
          </div>
          <ul className={s.includes}>
            <li>
              {PRICE.minutes} minutes a month with a vetted Costa Rica lawyer, across up to {PRICE.calls} calls of{" "}
              {PRICE.callLength} minutes
            </li>
            <li>A brief prepared from your profile before each call, so no minutes go to background</li>
            <li>Your ILP team follows up on the next steps after every call</li>
            <li>Reminders before the dates on your profile</li>
            <li>Legal work such as filings, drafting or representation is quoted separately, and nothing starts until you accept</li>
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

        <form onSubmit={submit} noValidate aria-labelledby="details-title">
          <h2 id="details-title" className={s.sectionTitle}>Your details</h2>
          <div className={s.field}>
            <label htmlFor="join-name">Full name</label>
            <input id="join-name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className={s.field}>
            <label htmlFor="join-email">Email</label>
            <input
              id="join-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span className={s.fieldHint}>You sign in with a code sent to this address.</span>
          </div>
          <div className={s.field}>
            <label htmlFor="join-phone">Phone or WhatsApp (optional)</label>
            <input
              id="join-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <h2 className={s.sectionTitle}>Payment</h2>
          <p className={s.help}>
            {mode === "stripe"
              ? `You will pay ${PRICE.dueToday} on Stripe's secure checkout page, then come straight back here.`
              : `Our team will contact you with payment details for ${PRICE.dueToday}. Your membership starts as soon as payment is confirmed.`}
          </p>

          <label className={s.checkRow}>
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
            <span>
              I have read the <Link href="/terms">membership terms</Link>. I understand ILP connects me with
              independent lawyers and that legal work is quoted separately.
            </span>
          </label>

          {error && <p className={s.error} role="alert">{error}</p>}

          <button type="submit" className={`${s.primary} ${s.primaryWide}`} disabled={busy}>
            {busy
              ? "One moment…"
              : mode === "stripe"
              ? `Continue to payment, ${PRICE.dueToday}`
              : "Join ILP"}
          </button>
        </form>

        <p className={s.fine}>
          Already a member? <Link href="/status">Sign in</Link>.
        </p>
      </main>
    </div>
  );
}
