"use client";

import Link from "next/link";
import { track } from "@/lib/journey";
import { Reveal } from "@/components/motion/Motion";
import { SectionHead } from "@/components/landing/SectionHead";
import { TutorialBand } from "@/components/landing/TutorialBand";
import l from "@/components/landing/landing.module.scss";
import s from "@/components/lawyers/lawyers.module.scss";
import { CONTACT_EMAIL, CONTACT_HREF, CSM_BANDS, CSM_FAQ, CSM_FINAL, CSM_HERO, ROLE_FACTS, SIGN_IN_HREF } from "./content";
import { CsmHero, HowYourDayWorks, RoleClose, WhyTheRoleMatters } from "./CsmStory";

/**
 * Customer success landing (/customer-success), built like the lawyers
 * landing. Order: hero (countries, promise, calls to action) -> why the role
 * matters (pinned story) -> how your day works (pinned story with example
 * CSM portal screens) -> what the role is -> demo: your day in the CSM
 * portal -> the work in plain words -> questions -> write to the team.
 * Linked from the Nav ("Customer success") and the site footer; CSMs sign
 * in at /csm.
 */
export default function CsmLanding() {
  return (
    <main>
      <CsmHero />
      <WhyTheRoleMatters />
      <HowYourDayWorks />
      <RoleClose />

      <TutorialBand band={CSM_BANDS.day} tint />

      <section className={`${l.wrap} ${s.split}`} aria-label={ROLE_FACTS.title}>
        <div className={s.splitHead}>
          <SectionHead title={ROLE_FACTS.title} why={ROLE_FACTS.why} icon="path" />
        </div>
        <dl className={s.facts}>
          {ROLE_FACTS.facts.map((f) => (
            <Reveal key={f.term} className={s.fact}>
              <dt>{f.term}</dt>
              <dd>{f.body}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      <section className={`${l.wrap} ${s.split}`} aria-label="Questions about the role">
        <div className={s.splitHead}>
          <SectionHead title="Questions about the role" why="Short answers to what people ask us about customer success at ILP." icon="question" />
        </div>
        <div className={s.faq}>
          {CSM_FAQ.map((item) => (
            <details key={item.q} className={s.faqItem}>
              <summary className={s.faqQ}>{item.q}</summary>
              <p className={s.faqA}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={s.final} id="contact" aria-label={CSM_FINAL.title}>
        <div className={`${l.wrap} ${s.finalInner}`}>
          <div>
            <h2 className={s.finalTitle}>{CSM_FINAL.title}</h2>
            <p className={l.sub}>
              {CSM_FINAL.sub} <a href={CONTACT_HREF}>{CONTACT_EMAIL}</a>
            </p>
          </div>
          <div className={s.finalActions}>
            <a href={CONTACT_HREF} className={s.primary} onClick={() => track.click("csm_landing.final.contact")}>
              {CSM_HERO.primary}
            </a>
            <Link href={SIGN_IN_HREF} className={s.secondary}>
              CSM sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
