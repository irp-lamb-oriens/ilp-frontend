import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { RevealTitle } from "@/components/motion/Motion";
import DraftBanner from "@/components/legal/DraftBanner";
import { LEGAL_DOCS } from "@/components/legal/versions";
import s from "./LegalPage.module.scss";

export interface LegalSection {
  heading: string;
  body: string[];
  /** Bulleted items after the paragraphs. */
  list?: string[];
  /** Two-column rows (label, detail), e.g. a data map or provider list. */
  rows?: Array<[string, string]>;
  /** Links after the section text. */
  links?: Array<{ label: string; href: string }>;
}

export default function LegalPage({
  title,
  updated,
  sections,
  version,
  intro,
  current,
  children,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
  /** Internal version id; shows the counsel-review draft banner. */
  version?: string;
  /** Short plain-language summary above the sections. */
  intro?: string;
  /** href of this page, to mark it in the related list. */
  current?: string;
  /** Interactive content after the sections (e.g. a preference control). */
  children?: ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className={s.main}>
        <div className={s.wrap}>
          {version && <DraftBanner version={version} />}
          <p className={s.eyebrow}>Legal</p>
          <RevealTitle as="h1" text={title} className={s.title} />
          <p className={s.updated}>
            Last updated {updated}
            {version ? ` · Version ${version}` : ""}
          </p>
          {intro && <p className={s.intro}>{intro}</p>}

          {sections.map((sec) => (
            <section key={sec.heading} className={s.section}>
              <h2 className={s.heading}>{sec.heading}</h2>
              {sec.body.map((p, i) => (
                <p key={i} className={s.para}>{p}</p>
              ))}
              {sec.list && (
                <ul className={s.list}>
                  {sec.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {sec.rows && (
                <dl className={s.rows}>
                  {sec.rows.map(([k, v]) => (
                    <div key={k} className={s.row}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {sec.links && (
                <p className={s.links}>
                  {sec.links.map((l) => (
                    <Link key={l.href} href={l.href}>
                      {l.label}
                    </Link>
                  ))}
                </p>
              )}
            </section>
          ))}

          {children}

          <nav className={s.related} aria-label="Legal documents">
            <h2 className={s.relatedTitle}>Legal documents</h2>
            <ul>
              {LEGAL_DOCS.map((d) => (
                <li key={d.href}>
                  {d.href === current ? (
                    <span aria-current="page">{d.title}</span>
                  ) : (
                    <Link href={d.href}>{d.title}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
    </>
  );
}
