import Nav from "@/components/Nav";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
import s from "@/components/MarketingPage.module.scss";

const PILLARS = [
  {
    title: "Your legal profile stays with you",
    body: "Your residency, property, companies, vehicles and household details sit in one legal profile. Your lawyer reads it before every call, so you do not have to repeat yourself.",
  },
  {
    title: "Calls with a lawyer licensed in Costa Rica",
    body: "Members get up to three 20-minute video calls a month (60 minutes) with an independent lawyer licensed in Costa Rica.",
  },
  {
    title: "Follow-up after every call",
    body: "Your lawyer confirms the summary and the next steps. Your customer success manager (CSM) at ILP then follows up on them with you.",
  },
  {
    title: "Dates before they are due",
    body: "The free deadline check lists the dates that may apply to you, and members are reminded before them.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>
        <section className={`${s.wrap} ${s.section}`}>
          <div className={s.sectionHead}>
            <p className={s.eyebrow}>About us</p>
            <RevealTitle text="Your legal life in Costa Rica, kept in one place." className={s.headingXl} />
            <p className={s.sub}>
              International Legal Partner (ILP) is a legal membership for North Americans who live in Costa Rica or
              own property there. ILP keeps your legal profile, books your calls with a lawyer licensed in Costa Rica
              and follows up on what comes next. Panama and Mexico are planned after Costa Rica.
            </p>
          </div>

          <div className={s.steps}>
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} className={s.step} delay={i * 0.1}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={`${s.wrap} ${s.section}`}>
          <div className={s.split}>
            <div className={s.rail}>
              <p className={s.eyebrow}>Our model</p>
              <RevealTitle text="Independent lawyers, coordinated by ILP." className={s.headingLg} />
            </div>
            <div className={s.featureList}>
              <li>ILP runs the platform and keeps your legal profile, and your customer success manager follows up with you after each call.</li>
              <li>Independent lawyers licensed in Costa Rica give the legal advice. ILP checks each lawyer&apos;s license before they take calls.</li>
              <li>Legal work beyond the calls, such as drafting or filings, is quoted separately. Nothing starts until you accept the quote.</li>
            </div>
          </div>
        </section>

        <footer className={s.footer}>
          <div className={s.wrap}>
            <p>International Legal Partner. A legal membership for North Americans living in Costa Rica or owning property there.</p>
          </div>
        </footer>
      </main>
    </>
  );
}