import Nav from "@/components/Nav";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
import s from "@/components/MarketingPage.module.scss";

const PILLARS = [
  {
    title: "The context follows the client",
    body: "Your legal history, documents, and obligations live in one profile that moves with you across countries and matters.",
  },
  {
    title: "Real professionals, not a call center",
    body: "Every consultation is with a vetted local attorney, matched to your jurisdiction and situation.",
  },
  {
    title: "Continuity over one-off advice",
    body: "Reminders, summaries, and follow-up keep your legal life moving between consultations.",
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
            <RevealTitle text="Built to replace fragmented legal advice." className={s.headingXl} />
            <p className={s.sub}>
              International Legal Partner is a U.S.-registered legal-tech
              platform. We pair access to qualified local attorneys with a
              persistent client profile, reminders, and follow-up, so your
              legal life abroad stays organized.
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
              <RevealTitle text="Independent partners, coordinated by ILP." className={s.headingLg} />
            </div>
            <div className={s.featureList}>
              <li>ILP provides the platform, the client profile, and the Customer Success coordination.</li>
              <li>Vetted local attorneys provide the legal judgment, matched to your specialty and language.</li>
              <li>Cross-border legal expertise and content bridge the gap between living abroad and staying compliant.</li>
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