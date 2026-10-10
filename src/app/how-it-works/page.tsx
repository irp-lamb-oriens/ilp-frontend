import Nav from "@/components/Nav";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
import s from "@/components/MarketingPage.module.scss";

const STEPS = [
  {
    n: "01",
    title: "Onboard with your CSM",
    body: "A Customer Success Manager sets up your living legal profile, gathers your documents, and maps the obligations that apply to you.",
  },
  {
    n: "02",
    title: "Consult a vetted specialist",
    body: "Book a consultation with a local attorney matched to your situation. They explain the law, your options, and the next steps.",
  },
  {
    n: "03",
    title: "Get a summary and follow-up",
    body: "Your call is transcribed and summarized. Action items and deadlines are attached to your profile, and your CSM coordinates what comes next.",
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
            <RevealTitle text="Three steps. One organized legal life." className={s.headingXl} />
            <p className={s.sub}>
              Membership gives you technical legal explanations and ongoing
              coordination. Formal legal work is scoped and paid separately.
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
            <p>International Legal Partner. Trusted legal support for your life abroad.</p>
          </div>
        </footer>
      </main>
    </>
  );
}