"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { MorphStage, MorphItem, Reveal, RevealTitle } from "@/components/motion/Motion";
import { COSTS, FEATURES, STEPS } from "./content";
import s from "./landing.module.scss";

/**
 * Signature moment: the stage locks to the viewport while three costs of a
 * missed deadline morph in, hold, and morph out one after another. The giant
 * figure word and its explanation travel on separate axes and curves.
 */
export function CostsMorph() {
  const slice = 1 / COSTS.length;
  return (
    <section className={s.costs} aria-label="What a missed deadline costs">
      <MorphStage heightVh={320} mobileHeightVh={240} className={s.costsStage} spring>
        {(progress, reduce) => (
          <>
            <p className={s.costsKicker}>What a missed deadline costs</p>
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
                    <MorphItem progress={progress} range={range} reduce={reduce} className={s.costFigure}>
                      {c.figure}
                    </MorphItem>
                    <MorphItem
                      progress={progress}
                      range={range}
                      reduce={reduce}
                      axis="x"
                      className={i % 2 === 0 ? s.costText : `${s.costText} ${s.costTextLeft}`}
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
        <p className={s.eyebrow}>What you get</p>
        <RevealTitle text="The ILP system at a glance." className={s.headingXl} />
        <p className={s.sub}>
          A living profile, transcribed history, a human CSM, and automated
          reminders. The context follows the client.
        </p>
      </div>
      <ol className={s.featureList}>
        {FEATURES.map((f, i) => (
          <li key={f.title}>
            <Reveal className={s.feature} from={i % 2 === 0 ? "right" : "bottom"}>
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
    <section className={s.steps} aria-label="How it works">
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
      <div className={s.stepsIntro}>
        <p className={s.eyebrow}>How it works</p>
        <RevealTitle text="How ILP works in practice." className={s.headingXl} />
      </div>
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