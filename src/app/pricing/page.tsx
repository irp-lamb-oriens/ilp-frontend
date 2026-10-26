import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { PLAN_STANDARD } from "@/lib/contracts";
import m from "@/components/MarketingPage.module.scss";
import s from "./pricing.module.scss";

export const metadata: Metadata = {
  title: "Pricing | International Legal Partner",
  description:
    "One ILP membership: US$79.99 a month plus a US$100 activation. 60 minutes a month with a vetted Costa Rica lawyer; legal work quoted separately.",
};

const usd = (cents: number) => `US$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const MONTHLY = usd(PLAN_STANDARD.monthlyCents);
const ACTIVATION = usd(PLAN_STANDARD.activationCents);

const INCLUDED = [
  `${PLAN_STANDARD.minutesIncluded} minutes a month with a vetted Costa Rica lawyer, across up to ${PLAN_STANDARD.callsIncluded} calls of ${PLAN_STANDARD.callLengthMin} minutes`,
  "A brief prepared from your profile before each call, so the minutes go to your question",
  "Your ILP team follows up on the next steps after every call",
  "A living legal profile: residency, property, companies, vehicles and household in one place",
  "Reminders before the dates that apply to you",
];

const FAQ = [
  {
    q: "What does the activation fee cover?",
    a: "Setting up your legal profile, your welcome call with the ILP team and the review of the documents you share at the start.",
  },
  {
    q: "Do unused minutes roll over?",
    a: `No. Each month includes up to ${PLAN_STANDARD.minutesIncluded} minutes across up to ${PLAN_STANDARD.callsIncluded} calls, and unused minutes do not carry forward.`,
  },
  {
    q: "What is not included?",
    a: "Legal work such as drafting, filings, closings, opinions or representation. A lawyer scopes it, you get a written quote, and nothing starts until you accept it.",
  },
  {
    q: "Who are the lawyers?",
    a: "Independent lawyers licensed in Costa Rica, vetted by ILP. ILP organizes the relationship and the follow-up; the legal advice comes from the lawyer.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main>
        <section className={`${m.wrap} ${m.section}`}>
          <div className={m.sectionHead}>
            <p className={m.eyebrow}>Membership</p>
            <h1 className={m.headingXl}>One plan, priced in the open.</h1>
            <p className={m.sub}>
              Start with the free deadline check. If you want a lawyer to look at what came up, join for a monthly fee.
            </p>
          </div>

          <div className={s.layout}>
            <div className={s.plan}>
              <h2 className={s.planName}>ILP membership</h2>
              <p className={s.price}>
                {MONTHLY}
                <span className={s.unit}> a month</span>
              </p>
              <p className={s.activation}>plus {ACTIVATION} one-time activation</p>
              <Link href="/check" className={m.primary}>Start with the free check</Link>
              <Link href="/join" className={s.joinLink}>Or join now</Link>
            </div>

            <div>
              <h2 className={m.headingLg}>What is included</h2>
              <ul className={s.included}>
                {INCLUDED.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          </div>

          <div className={m.section}>
            <h2 className={m.headingLg}>Questions</h2>
            <div className={s.faq}>
              {FAQ.map((f) => (
                <div key={f.q} className={m.callout}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className={m.footer}>
          <div className={m.wrap}>
            <p>International Legal Partner. Trusted legal support for your life abroad.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
