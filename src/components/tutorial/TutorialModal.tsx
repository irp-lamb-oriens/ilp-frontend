"use client";

/**
 * The walkthrough modal, on the kit Dialog (focus trap, Esc, aria-modal,
 * labelled by the step title). A centred card on desktop, a bottom sheet on
 * phones.
 *
 * - Header: the tutorial's name and "Step 2 of 4" above the step title, and a
 *   close button.
 * - Body: the demo with its control bar (PlayerControls), the step text, and
 *   "What happens here".
 * - Footer: "Don't show again" and the step navigation (StepNav): previous
 *   step, labelled step segments, next step (Done on the last step).
 *
 * Keys: ← / → move between steps (while the demo is paused they step
 * between its actions first); Enter goes on when focus is not on a control.
 * Captions offer a glossary meaning the first time a word appears in the
 * tutorial. The scene's cursor actions are also written out for screen
 * readers, so every step reads without the animation.
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Dialog } from "../ui/Dialog";
import type { ActiveTutorial, CloseReason } from "./context";
import { StepNav } from "./PlayerControls";
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

const CONTROL = "input, textarea, select, button, a[href], [contenteditable='true'], [role='radio']";

export function TutorialModal({ active, hidden = false, onNext, onBack, onClose, onSpotlight }: TutorialModalProps) {
  const { tutorial, step } = active;
  const steps = tutorial.steps;
  const st = steps[step];
  const last = step === steps.length - 1;
  const [dontShow, setDontShow] = useState(false);
  const [targetHere, setTargetHere] = useState(false);
  const description = st.describe ?? describeScene(st.scene);
  const newTerms = useMemo(() => firstUseTerms(steps), [steps]);
  const titles = useMemo(() => steps.map((x) => x.title), [steps]);
  const many = steps.length > 1;

  useEffect(() => {
    setTargetHere(tourTargetExists(st.target));
  }, [st]);

  useEffect(() => {
    if (hidden) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      const onControl = !!el?.closest?.(CONTROL);
      const inField = !!el?.closest?.("input, textarea, select, [role='radiogroup']");
      if (e.key === "ArrowRight" && !inField) {
        e.preventDefault();
        if (!last) onNext();
      } else if (e.key === "ArrowLeft" && !inField) {
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

  const close = () => onClose(last ? "done" : "skip", dontShow);
  const eyebrow = active.adhoc ? (many ? `Step ${step + 1} of ${steps.length}` : undefined) : `${tutorial.title} · Step ${step + 1} of ${steps.length}`;

  return (
    <Dialog
      open={!hidden}
      size="lg"
      onClose={close}
      title={st.title}
      eyebrow={eyebrow}
      closeLabel={last ? "Close" : "Close the tutorial"}
      footer={
        <div className={s.footer}>
          {!active.adhoc && <Checkbox label="Don't show again" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />}
          <StepNav
            className={s.nav}
            index={step}
            count={steps.length}
            titles={titles}
            onPrev={onBack}
            onNext={() => (last ? onClose("done", dontShow) : onNext())}
            lastLabel="Done"
            primaryNext
            extra={
              targetHere && st.target ? (
                <Button variant="secondary" onClick={() => onSpotlight(st.target as string)}>
                  Show me on this page
                </Button>
              ) : undefined
            }
          />
        </div>
      }
    >
      <ScenePlayer key={`${tutorial.id}:${st.id}`} scene={st.scene} className={s.scene} keys newTerms={newTerms[step]} step={{ index: step, count: steps.length }} />
      {st.body && <p className={s.body}>{st.body}</p>}
      {description && <p className={s.sr}>{description}</p>}
      <p className={s.sr} aria-live="polite" aria-atomic="true">
        Step {step + 1} of {steps.length}: {st.title}
      </p>
    </Dialog>
  );
}

export default TutorialModal;
