import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import Nav from "@/components/Nav";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
import s from "@/components/MarketingPage.module.scss";

export const metadata: Metadata = pageMetadata("/how-it-works");

const STEPS = [
  {
    n: "1",
    title: "Take the free deadline check",
    body: "It takes about two minutes and you do not need an account. You get a dated list of what may apply to you in your country.",
  },
  {
    n: "2",
    title: "Join and set up your legal profile",
    body: "The membership is US$79.99 a month plus a one-time US$100 activation fee. Your customer success manager (CSM) helps you complete your legal profile.",
  },
  {
    n: "3",
    title: "Book a call with a lawyer",
    body: "Book up to three 20-minute video calls a month with a lawyer licensed in your country. Before the call, the lawyer reads a brief built from your profile.",
  },
  {
    n: "4",
    title: "Get the next steps in writing",
    body: "If you allow it, the call is recorded and transcribed. Your lawyer confirms the summary and the next steps, and your CSM follows up on them with you.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Nav />
      <main>
        <section className={`${s.wrap} ${s.section}`}>
          <div className={s.sectionHead}>
            <p className={s.eyebrow}>How it works</p>
            <RevealTitle text="From the free check to your next step." className={s.headingXl} />
            <p className={s.sub}>
              The membership covers your calls with a lawyer and the follow-up after them. Legal work such as
              drafting or filings is quoted separately, and you decide whether to go ahead.
            </p>
          </div>

          <div className={s.steps}>
            {STEPS.map((st, i) => (
              <Reveal key={st.n} className={s.step} delay={i * 0.1}>
                <span className={s.stepNum}>{st.n}</span>
                <h3>{st.title}</h3>
                <p>{st.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={`${s.wrap} ${s.section}`}>
          <div className={s.split}>
            <div className={s.rail}>
              <p className={s.eyebrow}>The boundary</p>
              <RevealTitle text="What is included, and what is separate." className={s.headingLg} />
            </div>
            <div className={s.featureList}>
              <li>Included: technical explanations of current laws, procedures, requirements, and options.</li>
              <li>Included: issue identification and next-step guidance during consultations.</li>
              <li>Separate: due diligence, contract drafting, closings, formal opinions, and filings.</li>
              <li>Separate: litigation and any individualized legal project, scoped and quoted up front.</li>
            </div>
          </div>
        </section>

        <footer className={s.footer}>
          <div className={s.wrap}>
            <p>International Legal Partner. A legal membership for North Americans living in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain, or owning property there.</p>
          </div>
        </footer>
      </main>
    </>
  );
}