import Nav from "@/components/Nav";
import { RevealTitle } from "@/components/motion/Motion";
import s from "./LegalPage.module.scss";

export interface LegalSection {
  heading: string;
  body: string[];
}

export default function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Nav />
      <main className={s.main}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Legal</p>
          <RevealTitle as="h1" text={title} className={s.title} />
          <p className={s.updated}>Last updated {updated}</p>

          {sections.map((sec) => (
            <section key={sec.heading} className={s.section}>
              <h2 className={s.heading}>{sec.heading}</h2>
              {sec.body.map((p, i) => (
                <p key={i} className={s.para}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </>
  );
}