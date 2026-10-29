"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/journey";
import ValueChain from "@/components/ValueChain";
import { Reveal } from "@/components/motion/Motion";
import { SectionHead } from "@/components/landing/SectionHead";
import { TutorialBand } from "@/components/landing/TutorialBand";
import l from "@/components/landing/landing.module.scss";
import { APPLY_HREF, CHAIN_HEAD, LAWYER_BANDS, LAWYER_FAQ, LAWYER_FINAL, LAWYERS_HERO, PARTNERSHIP, SIGN_IN_HREF } from "./content";
import { HowItWorksForYou, LawyersHero, PartnershipClose, WhyLawyersJoin } from "./LawyersStory";
import s from "./lawyers.module.scss";

/**
 * Lawyers landing (T2). Order: hero (countries, promise, calls to action)
 * -> why lawyers join (pinned story) -> how it works for you (pinned story
 * with example screens) -> what the partnership is -> demo: your day in the
 * portal -> what happens around each call -> demo: during and after a call ->
 * the partnership in plain words -> demo: your hours and your fees ->
 * questions -> apply. Rendered by /attorneys (the Nav link); /lawyers
 * redirects there and the form lives at /lawyers/apply.
 */
export default function LawyersLanding() {
  useEffect(() => {
    track.step("lawyer_landing_view");
  }, []);
  return (
    <main>
      <LawyersHero />
      <WhyLawyersJoin />
      <HowItWorksForYou />
      <PartnershipClose />

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
            <Link href={APPLY_HREF} className={s.primary} onClick={() => track.click("lawyers.final.apply")}>
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
