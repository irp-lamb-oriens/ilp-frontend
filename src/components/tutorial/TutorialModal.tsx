"use client";

/**
 * The walkthrough modal, on the kit Dialog (focus trap, Esc, aria-modal,
 * labelled by the step title). A centred card on desktop, a bottom sheet on
 * phones. ← / → move between steps (while the demo is paused they step
 * between its actions first); Enter goes on when focus is not on a control.
 * Captions offer a glossary meaning the first time a word appears in the
 * tutorial. The scene's cursor actions are also written out for screen
 * readers, so every step reads without the animation.
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Dialog } from "../ui/Dialog";
import { cx } from "../ui/cx";
import type { ActiveTutorial, CloseReason } from "./context";
import { ScenePlayer } from "./ScenePlayer";
import { describeScene, firstUseTerms } from "./sceneUtils";
import s from "./TutorialModal.module.scss";

export interface TutorialModalProps {
  active: ActiveTutorial;
  /** True while the page spotlight is showing. */
  hidden?: boolean;
  onNext: () => void;
  onBack: () => void;
  onClose: (reason: CloseReason, dontShow: boolean) => void;
  onSpotlight: (target: string) => void;
}

function tourTargetExists(target: string | undefined): boolean {
  if (!target || typeof document === "undefined") return false;
  try {
    const el = document.querySelector(`[data-tour="${CSS.escape(target)}"]`);
    return !!el && (el as HTMLElement).offsetParent !== null;
  } catch {
    return false;
  }
}

const CONTROL = "input, textarea, select, button, a[href], [contenteditable='true']";

export function TutorialModal({ active, hidden = false, onNext, onBack, onClose, onSpotlight }: TutorialModalProps) {
  const { tutorial, step } = active;
  const steps = tutorial.steps;
  const st = steps[step];
  const last = step === steps.length - 1;
  const [dontShow, setDontShow] = useState(false);
  const [targetHere, setTargetHere] = useState(false);
  const description = st.describe ?? describeScene(st.scene);
  const newTerms = useMemo(() => firstUseTerms(steps), [steps]);

  useEffect(() => {
    setTargetHere(tourTargetExists(st.target));
  }, [st]);

  useEffect(() => {
    if (hidden) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      const onControl = !!el?.closest?.(CONTROL);
      if (e.key === "ArrowRight" && !el?.closest?.("input, textarea, select")) {
        e.preventDefault();
        if (!last) onNext();
      } else if (e.key === "ArrowLeft" && !el?.closest?.("input, textarea, select")) {
        e.preventDefault();
        onBack();
      } else if (e.key === "Enter" && !onControl) {
        e.preventDefault();
        if (last) onClose("done", dontShow);
        else onNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden, last, onNext, onBack, onClose, dontShow]);

  return (
    <Dialog
      open={!hidden}
      size="lg"
      onClose={() => onClose(last ? "done" : "skip", dontShow)}
      title={st.title}
      footer={
        <div className={s.footer}>
          <Button variant="ghost" onClick={() => onClose(last ? "done" : "skip", dontShow)}>
            {last ? "Close" : "Skip tutorial"}
          </Button>
          <div className={s.nav}>
            {targetHere && st.target && (
              <Button variant="secondary" onClick={() => onSpotlight(st.target as string)}>
                Show me on this page
              </Button>
            )}
            <Button variant="secondary" onClick={onBack} disabled={step === 0}>
              Back
            </Button>
            <Button data-autofocus="" onClick={() => (last ? onClose("done", dontShow) : onNext())}>
              {last ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      }
    >
      <p className={s.kicker}>
        {tutorial.title}
        <span className={s.count}>
          {" "}
          · Step {step + 1} of {steps.length}
        </span>
      </p>
      <ScenePlayer key={`${tutorial.id}:${st.id}`} scene={st.scene} className={s.scene} keys newTerms={newTerms[step]} />
      <p className={s.body}>{st.body}</p>
      {description && <p className={s.sr}>{description}</p>}
      <div className={s.meta}>
        <ol className={s.dots} aria-hidden="true">
          {steps.map((x, i) => (
            <li key={x.id} className={cx(s.dot, i === step && s.dotOn, i < step && s.dotDone)} />
          ))}
        </ol>
        <Checkbox label="Don't show again" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
      </div>
      <p className={s.sr} aria-live="polite" aria-atomic="true">
        Step {step + 1} of {steps.length}: {st.title}
      </p>
    </Dialog>
  );
}

export default TutorialModal;
