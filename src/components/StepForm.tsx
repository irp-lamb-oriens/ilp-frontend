"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import s from "./StepForm.module.scss";

export interface Step {
  title: string;
  body: ReactNode;
  /** Validate this step before allowing "next". Return an error string or null. */
  validate?: () => string | null;
}

const EASE = [0.16, 1, 0.3, 1] as const; // expo-out
const EASE_IN_OUT = [0.87, 0, 0.13, 1] as const;

/**
 * Multi-step form. Steps slide in/out with a cubic-bezier ease, staggered
 * direction (forward slides left, back slides right), and a parallaxed
 * progress bar. `onComplete` fires on the final step's submit.
 */
export default function StepForm({
  steps,
  onComplete,
  submitLabel = "Submit",
  busy = false,
}: {
  steps: Step[];
  onComplete: () => void;
  submitLabel?: string;
  busy?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const isLast = index === steps.length - 1;

  const go = (next: number) => {
    if (next < 0 || next >= steps.length) return;
    setDir(next > index ? 1 : -1);
    setError(null);
    setIndex(next);
  };

  const next = () => {
    const err = steps[index].validate?.() ?? null;
    if (err) {
      setError(err);
      return;
    }
    if (isLast) {
      onComplete();
    } else {
      go(index + 1);
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d * 48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -48, opacity: 0 }),
  };

  return (
    <div className={s.wrap}>
      <div className={s.progress} aria-hidden="true">
        <motion.div
          className={s.progressFill}
          animate={{ width: `${((index + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </div>

      <div className={s.stage}>
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: EASE_IN_OUT }}
            className={s.step}
          >
            <h3 className={s.stepTitle}>{steps[index].title}</h3>
            <div className={s.stepBody}>{steps[index].body}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p className={s.error} role="alert">{error}</p>}

      <div className={s.controls}>
        {index > 0 && (
          <button type="button" className={s.back} onClick={() => go(index - 1)}>
            Back
          </button>
        )}
        <button
          type="button"
          className={s.next}
          onClick={next}
          disabled={busy}
        >
          {busy ? "Sending…" : isLast ? submitLabel : "Continue"}
        </button>
      </div>
    </div>
  );
}