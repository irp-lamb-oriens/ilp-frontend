"use client";

import { Eyebrow, RevealText, Stage, StageItem } from "@/components/motion/Story";
import { cx } from "@/components/ui/cx";
import { FEATURES, FEATURES_HEAD, STEPS, STEPS_HEAD } from "./content";
import { SectionHead } from "./SectionHead";
import s from "./landing.module.scss";

/**
 * Sticky split: the heading locks on the left while the features stream past.
 * Each feature card rises in, then its number (eyebrow), title and body
 * stage in order; the reminders card underlines "may require review".
 */
export function FeaturesSticky() {
  return (
    <section className={`${s.wrap} ${s.sticky}`} aria-labelledby="features-title">
      <div className={s.stickyHead}>
        <SectionHead id="features-title" title={FEATURES_HEAD.title} why={FEATURES_HEAD.why} mark={FEATURES_HEAD.mark} icon="profile" />
      </div>
      <ol className={s.featureList}>
        {FEATURES.map((f, i) => (
          <li key={f.title}>
            <Stage className={s.feature} enter="visual" amount={0.35}>
              <Eyebrow className={s.featureIndex}>{String(i + 1).padStart(2, "0")}</Eyebrow>
              <StageItem as="h3" level="title" className={s.featureTitle}>
                {f.title}
              </StageItem>
              <RevealText text={f.body} mark={f.mark} className={s.featureBody} />
            </Stage>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Real situations. No longer pinned (the page keeps two pinned stories: the
 * hero story and the costs story): each situation is a row that stages in as
 * it enters, number first, then title and body, alternating sides.
 */
export function SituationsList() {
  return (
    <section className={s.steps} aria-labelledby="situations-title">
      <div className={`${s.wrap} ${s.section}`}>
        <SectionHead id="situations-title" title={STEPS_HEAD.title} why={STEPS_HEAD.why} mark={STEPS_HEAD.mark} icon="path" />
        <ol className={s.situations}>
          {STEPS.map((st, i) => (
            <Stage as="li" key={st.n} className={cx(s.situation, i % 2 === 1 && s.situationFlip)} amount={0.4}>
              <StageItem level="visual" className={s.stepNum}>
                <span aria-hidden="true">{st.n}</span>
              </StageItem>
              <div className={s.situationText}>
                <StageItem as="h3" level="title" className={s.situationTitle}>
                  {st.title}
                </StageItem>
                <RevealText text={st.body} className={s.situationBody} />
              </div>
            </Stage>
          ))}
        </ol>
      </div>
    </section>
  );
}
