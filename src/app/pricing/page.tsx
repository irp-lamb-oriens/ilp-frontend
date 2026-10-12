"use client";

import Nav from "@/components/Nav";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
import { openLeadForm } from "@/lib/leadEvents";
import { PLANS, ADDONS } from "@/components/landing/content";
import s from "@/components/MarketingPage.module.scss";

const FAQ = [
  {
    q: "What does the activation fee cover?",
    a: "Your CSM onboarding, legal profile setup, document intake, and initial account configuration.",
  },
  {
    q: "Do unused consultation minutes roll over?",
    a: "No. Core Membership includes up to 60 minutes across up to 3 consultations. Enterprise includes up to 120 minutes. Unused minutes do not carry forward.",
  },
  {
    q: "What is not included?",
    a: "Formal legal work such as due diligence, contract drafting, closings, opinions, and filings is scoped, quoted, and paid separately.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main>
        <section className={`${s.wrap} ${s.section}`}>
          <div className={`${s.sectionHead} ${s.centerHead}`}>
            <p className={s.eyebrow}>Membership</p>
            <RevealTitle text="Three plans. Real professionals. Ongoing support." className={s.headingXl} />
          </div>

          <div className={s.plansGrid}>
            {PLANS.map((plan, i) => (
              <Reveal
                key={plan.id}
                className={`${s.planCard} ${plan.highlight ? s.planHighlight : ""}`}
                delay={i * 0.1}
              >
                <div className={s.planTagline}>{plan.tagline}</div>
                <h3 className={s.planName}>{plan.name}</h3>
                <div className={s.planPrice}>
                  {plan.price}
                  <span className={s.planUnit}>{plan.unit}</span>
                </div>
                <div className={s.planPerDay}>{plan.activation}</div>

                <div className={s.allowance}>
                  <strong>{plan.allowance}</strong>
                  <span>{plan.allowanceDetail}</span>
                </div>

                <ul className={s.planFeatures}>
                  {plan.features.map((f) => <li key={f}>{f}</li>)}
                </ul>

                <button
                  type="button"
                  className={plan.highlight ? s.primary : s.ghost}
                  onClick={() => openLeadForm({ topic: plan.topic })}
                >
                  {plan.cta}
                </button>
              </Reveal>
            ))}
          </div>

          <div className={s.section}>
            <h2 className={s.headingLg}>Add-ons and out-of-scope work</h2>
            <div className={s.steps}>
              {ADDONS.map((a, i) => (
                <Reveal key={a.title} className={s.step} delay={i * 0.1}>
                  <h3>{a.title}</h3>
                  <p>{a.body}</p>
                </Reveal>
              ))}
            </div>
          </div>

          <div className={s.section}>
            <h2 className={s.headingLg}>Questions</h2>
            <div className={s.featureList}>
              {FAQ.map((f) => (
                <div key={f.q} className={s.callout}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={s.primary}
            onClick={() => openLeadForm({ topic: PLANS[1].topic })}
          >
            {PLANS[1].cta}
          </button>
        </section>

        <footer className={s.footer}>
          <div className={s.wrap}>
            <p>International Legal Partner. Trusted legal support for your life abroad.</p>
          </div>
        </footer>
      </main>
    </>
  );
}