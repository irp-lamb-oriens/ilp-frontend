"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { MorphStage, Reveal } from "@/components/motion/Motion";
import { FEATURES, FEATURES_HEAD, STEPS, STEPS_HEAD } from "./content";
import { SectionHead } from "./SectionHead";
import s from "./landing.module.scss";

/**
 * Sticky split: the heading locks on the left while features stream past.
 * The four-step loop diagram that sat under the heading moved out (HERO
 * redesign): "How ILP works" above already walks through the same steps.
 */
export function FeaturesSticky() {
  return (
    <section className={`${s.wrap} ${s.sticky}`}>
      <div className={s.stickyHead}>
        <SectionHead title={FEATURES_HEAD.title} why={FEATURES_HEAD.why} icon="profile" immediate />
      </div>
      <ol className={s.featureList}>
        {FEATURES.map((f, i) => (
          <li key={f.title}>
            <Reveal className={s.feature} from={i % 2 === 0 ? "right" : "bottom"} immediate>
              <span className={s.featureIndex}>{String(i + 1).padStart(2, "0")}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Steps pan horizontally while the stage is locked (vertical scroll -> x). */
export function StepsPan() {
  return (
    <section className={s.steps} aria-label={STEPS_HEAD.title}>
      <MorphStage heightVh={240} className={s.stepsStage}>
        {(progress, reduce) => <StepsTrack progress={progress} reduce={reduce} />}
      </MorphStage>
    </section>
  );
}

function StepsTrack({ progress, reduce }: { progress: MotionValue<number>; reduce: boolean }) {
  const x = useTransform(progress, [0.05, 0.95], ["0%", "-52%"]);
  return (
    <div className={s.stepsViewport}>
      <SectionHead title={STEPS_HEAD.title} why={STEPS_HEAD.why} icon="path" immediate className={s.stepsIntro} />
      <motion.ol className={s.stepsTrack} style={reduce ? undefined : { x }}>
        {STEPS.map((st) => (
          <li key={st.n} className={s.stepCard}>
            <span className={s.stepNum}>{st.n}</span>
            <h3>{st.title}</h3>
            <p>{st.body}</p>
          </li>
        ))}
      </motion.ol>
    </div>
  );
}