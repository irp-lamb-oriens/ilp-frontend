"use client";

import Link from "next/link";
import ValueChain from "@/components/ValueChain";
import { PageIntro } from "@/components/ui";
import { Reveal } from "@/components/motion/Motion";
import { SectionHead } from "@/components/landing/SectionHead";
import { TutorialBand } from "@/components/landing/TutorialBand";
import l from "@/components/landing/landing.module.scss";
import { APPLY_HREF, CHAIN_HEAD, LAWYER_BANDS, LAWYER_FAQ, LAWYER_FINAL, LAWYERS_HERO, PARTNERSHIP, SIGN_IN_HREF } from "./content";
import s from "./lawyers.module.scss";

/** Right side of the hero: a photo and what the portal gives a partner lawyer. */
function HeroArt() {
  return (
    <div className={s.art}>
      <div className={s.photo} role="img" aria-label={LAWYERS_HERO.imageAlt} />
      <div className={s.portalCard}>
        <h2 className={s.portalTitle}>{LAWYERS_HERO.cardTitle}</h2>
        <ul className={s.portalList}>
          {LAWYERS_HERO.cardItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Link href={SIGN_IN_HREF} className={s.textLink}>
          {LAWYERS_HERO.signIn}
        </Link>
      </div>
    </div>
  );
}

/**
 * Lawyers landing (T2). Order: why, how, what hero -> demo: your day in the
 * portal -> what happens around each call -> demo: during and after a call ->
 * the partnership in plain words -> demo: your hours and your fees ->
 * questions -> apply. Rendered by /attorneys (the Nav link); /lawyers
 * redirects there and the form lives at /lawyers/apply.
 */
export default function LawyersLanding() {
  return (
    <main>
      <div className={s.hero}>
        <div className={l.wrap}>
          <PageIntro
            order="why-how-what"
            eyebrow={LAWYERS_HERO.eyebrow}
            title={LAWYERS_HERO.title}
            why={LAWYERS_HERO.why}
            how={LAWYERS_HERO.how}
            what={LAWYERS_HERO.what}
            labels={LAWYERS_HERO.labels}
            className={s.intro}
            illustration={<HeroArt />}
            actions={
              <>
                <Link href={APPLY_HREF} className={s.primary}>
                  {LAWYERS_HERO.primary}
                </Link>
                <a href={`#${LAWYER_BANDS.day.anchor}`} className={s.secondary}>
                  {LAWYERS_HERO.secondary}
                </a>
              </>
            }
          />
        </div>
      </div>

      <TutorialBand band={LAWYER_BANDS.day} />

      <section className={s.chainSection} aria-label={CHAIN_HEAD.title}>
        <div className={l.wrap}>
          <SectionHead title={CHAIN_HEAD.title} why={CHAIN_HEAD.why} icon="path" />
          <ValueChain />
        </div>
      </section>

      <TutorialBand band={LAWYER_BANDS.call} />

      <section className={`${l.wrap} ${s.split}`} aria-label={PARTNERSHIP.title}>
        <div className={s.splitHead}>
          <SectionHead title={PARTNERSHIP.title} why={PARTNERSHIP.why} icon="lawyer" />
          <Link href={PARTNERSHIP.termsHref} className={s.textLink}>
            {PARTNERSHIP.termsLink}
          </Link>
        </div>
        <dl className={s.facts}>
          {PARTNERSHIP.facts.map((f) => (
            <Reveal key={f.term} className={s.fact}>
              <dt>{f.term}</dt>
              <dd>{f.body}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      <TutorialBand band={LAWYER_BANDS.hours} tint />

      <section className={`${l.wrap} ${s.split}`} aria-label="Questions lawyers ask">
        <div className={s.splitHead}>
          <SectionHead title="Questions lawyers ask" why="Short answers to what lawyers ask us before they apply." icon="question" />
        </div>
        <div className={s.faq}>
          {LAWYER_FAQ.map((item) => (
            <details key={item.q} className={s.faqItem}>
              <summary className={s.faqQ}>{item.q}</summary>
              <p className={s.faqA}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={s.final} id="apply" aria-label={LAWYER_FINAL.title}>
        <div className={`${l.wrap} ${s.finalInner}`}>
          <div>
            <h2 className={s.finalTitle}>{LAWYER_FINAL.title}</h2>
            <p className={l.sub}>{LAWYER_FINAL.sub}</p>
          </div>
          <div className={s.finalActions}>
            <Link href={APPLY_HREF} className={s.primary}>
              {LAWYERS_HERO.primary}
            </Link>
            <Link href={SIGN_IN_HREF} className={s.secondary}>
              Lawyer sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
