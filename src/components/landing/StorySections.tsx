"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { MorphStage, MorphItem, Reveal } from "@/components/motion/Motion";
import { COSTS, COSTS_HEAD, FEATURES, FEATURES_HEAD, LOOP, STEPS, STEPS_HEAD } from "./content";
import { SectionHead } from "./SectionHead";
import s from "./landing.module.scss";

/**
 * Problem section. Signature moment: the stage locks to the viewport while three costs of a
 * missed deadline morph in, hold, and morph out one after another. The giant
 * figure word and its explanation travel on separate axes and curves.
 */
export function CostsMorph() {
  const slice = 1 / COSTS.length;
  return (
    <section className={s.costs} aria-label={COSTS_HEAD.title}>
      <div className={`${s.wrap} ${s.costsIntro}`}>
        <SectionHead title={COSTS_HEAD.title} why={COSTS_HEAD.why} icon="calendar" />
      </div>
      <MorphStage heightVh={320} mobileHeightVh={240} className={s.costsStage} spring>
        {(progress, reduce) => (
          <>
            <div className={s.costsLayer}>
              {COSTS.map((c, i) => {
                const a = i * slice;
                const range: [number, number, number, number] = [
                  a,
                  a + slice * 0.3,
                  a + slice * 0.75,
                  i === COSTS.length - 1 ? 1 : a + slice,
                ];
                return (
                  <div key={c.figure} className={reduce ? s.costStatic : s.costSlot}>
                    <MorphItem progress={progress} range={range} reduce={reduce} className={s.costFigure} initialVisible={i === 0}>
                      {c.figure}
                    </MorphItem>
                    <MorphItem
                      progress={progress}
                      range={range}
                      reduce={reduce}
                      axis="x"
                      className={i % 2 === 0 ? s.costText : `${s.costText} ${s.costTextLeft}`}
                      initialVisible={i === 0}
                    >
                      <h3>{c.title}</h3>
                      <p>{c.body}</p>
                    </MorphItem>
                  </div>
                );
              })}
            </div>
            {!reduce && <ProgressRail progress={progress} />}
          </>
        )}
      </MorphStage>
    </section>
  );
}

function ProgressRail({ progress }: { progress: MotionValue<number> }) {
  const scaleX = useTransform(progress, [0, 1], [0, 1]);
  return (
    <div className={s.rail} aria-hidden="true">
      <motion.div className={s.railFill} style={{ scaleX }} />
    </div>
  );
}

/** Sticky split: the heading locks on the left while features stream past. */
export function FeaturesSticky() {
  return (
    <section className={`${s.wrap} ${s.sticky}`}>
      <div className={s.stickyHead}>
        <SectionHead title={FEATURES_HEAD.title} why={FEATURES_HEAD.why} icon="profile" immediate />
        <ol className={s.loop} aria-label="How membership works, step by step">
          {LOOP.map((step, i) => (
            <li key={step.title} className={s.loopStep}>
              <span className={s.loopNum} aria-hidden="true">{i + 1}</span>
              <span className={s.loopTitle}>{step.title}</span>
              <span className={s.loopBody}>{step.body}</span>
            </li>
          ))}
        </ol>
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