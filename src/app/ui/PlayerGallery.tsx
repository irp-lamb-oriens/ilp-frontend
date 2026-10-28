"use client";

/**
 * /ui → Player controls: every state of the tutorial player's control bar
 * (PlayerControls) and step navigation (StepNav), a bar driven by the real
 * reducer (playerState.ts) without a scene, and the live player.
 */
import { useEffect, useReducer, useState } from "react";
import { PlayerControls, StepNav } from "@/components/tutorial/PlayerControls";
import { actionPosition, canNext, canPrev, initPlayer, playerReducer, shownMode, type PlayerState } from "@/components/tutorial/playerState";
import { ScenePlayer, TutorialEmbed } from "@/components/tutorial";
import { publicCheck } from "@/tutorials/public/check";
import s from "./PlayerGallery.module.scss";

const NAMES = ["One question at a time", "Yes", "Yes, a sociedad anónima (S.A.)", "DIMEX renewal", "Join ILP"];
const STOPS = NAMES.map((_, i) => i);
const DURATIONS = NAMES.map(() => 2400);
const STEPS = ["Answer a few questions", "See the dates that may apply", "Choose what applies and save your deadlines", "Keep the list"];
const noop = () => undefined;

function at(mode: PlayerState["mode"], pos: number, extra: Partial<PlayerState> = {}): PlayerState {
  return { ...initPlayer(STOPS, NAMES.length - 1, false), mode, at: pos, ...extra };
}

const STATES: Array<{ title: string; note: string; state: PlayerState; compact?: boolean; finale?: boolean; step?: { index: number; count: number } }> = [
  { title: "Playing", note: "The current segment fills while its caption is up. Pause is the one filled button.", state: at("playing", 1), step: { index: 0, count: 3 } },
  { title: "Paused by the viewer", note: "Play replaces Pause; the position line is announced when it changes.", state: at("paused", 2, { pausedBy: "user" }), step: { index: 0, count: 3 } },
  { title: "Held off screen", note: "Scrolled out of view: it holds where it is and looks unchanged.", state: at("paused", 2, { pausedBy: "view" }) },
  { title: "First action", note: "Previous action is disabled.", state: at("paused", 0, { pausedBy: "user" }) },
  { title: "Last action", note: "Next action is disabled.", state: at("paused", 4, { pausedBy: "user" }) },
  { title: "Ended (modal)", note: "Every segment full; the main button replays.", state: at("ended", 5) },
  { title: "Embed, minimal", note: "Play / pause, the scrubber and replay. Hover or focus shows the rest; touch screens get More controls.", state: at("playing", 1), compact: true },
  { title: "Embed, last frame", note: "Replay stands out on the end of the last step.", state: at("ended", 5), compact: true, finale: true },
  { title: "Reduced motion", note: "Nothing plays by itself. Show steps walks through the actions as still frames.", state: { ...initPlayer(STOPS, NAMES.length - 1, true) } },
  { title: "Reduced motion, stepping", note: "One still frame per action, with its caption under the scene.", state: { ...initPlayer(STOPS, NAMES.length - 1, true), mode: "paused", at: 1, pausedBy: "user" } },
];

function StaticBar({ state, compact, finale, step }: { state: PlayerState; compact?: boolean; finale?: boolean; step?: { index: number; count: number } }) {
  return (
    <PlayerControls
      mode={shownMode(state)}
      reduced={state.reduced}
      actions={NAMES}
      position={actionPosition(state)}
      durations={DURATIONS}
      canPrev={canPrev(state)}
      canNext={canNext(state)}
      onPlay={noop}
      onPause={noop}
      onPrev={noop}
      onNext={noop}
      onReplay={noop}
      onSeek={noop}
      onShowSteps={noop}
      onShowAll={noop}
      compact={compact}
      finale={finale}
      step={step}
    />
  );
}

/** The real reducer with a fake clock: each action lasts 2.4 s. */
function LiveBar() {
  const [st, send] = useReducer(playerReducer, undefined, () => initPlayer(STOPS, NAMES.length - 1, false));
  useEffect(() => {
    if (st.mode !== "playing") return;
    const t = window.setTimeout(() => (st.at >= NAMES.length - 1 ? send({ type: "end" }) : send({ type: "reach", at: st.at + 1 })), st.at < 0 ? 600 : DURATIONS[0]);
    return () => window.clearTimeout(t);
  }, [st.mode, st.at, st.runKey]);
  return (
    <div className={s.live}>
      <PlayerControls
        mode={shownMode(st)}
        actions={NAMES}
        position={actionPosition(st)}
        durations={DURATIONS}
        canPrev={canPrev(st)}
        canNext={canNext(st)}
        onPlay={() => send({ type: "play" })}
        onPause={() => send({ type: "pause" })}
        onPrev={() => send({ type: "prev" })}
        onNext={() => send({ type: "next" })}
        onReplay={() => send({ type: "replay" })}
        onSeek={(k) => send({ type: "seek", stop: k })}
      />
      <p className={s.note}>
        State: {st.mode}
        {st.pausedBy ? ` (by ${st.pausedBy})` : ""}, action {Math.max(0, actionPosition(st)) + 1} of {NAMES.length}
      </p>
    </div>
  );
}

export default function PlayerGallery() {
  const [modalStep, setModalStep] = useState(1);
  const [embedStep, setEmbedStep] = useState(3);
  const results = publicCheck.steps[1];
  return (
    <div className={s.wrap}>
      <p className={s.note}>
        <code>PlayerControls</code> and <code>StepNav</code> in <code>src/components/tutorial/PlayerControls.tsx</code>; state in <code>playerState.ts</code>. Hover or focus a button for its tooltip.
      </p>

      <h3 className={s.h3}>Try it (real reducer, no scene)</h3>
      <LiveBar />

      <h3 className={s.h3}>Every state</h3>
      <div className={s.grid}>
        {STATES.map((x) => (
          <section key={x.title} className={s.state} aria-label={x.title}>
            <p className={s.stateTitle}>{x.title}</p>
            <p className={s.note}>{x.note}</p>
            <StaticBar state={x.state} compact={x.compact} finale={x.finale} step={x.step} />
          </section>
        ))}
      </div>

      <h3 className={s.h3}>Step navigation</h3>
      <div className={s.grid}>
        <section className={s.state} aria-label="Modal step navigation">
          <p className={s.stateTitle}>Modal</p>
          <p className={s.note}>Segments show progress; Done on the last step.</p>
          <StepNav index={modalStep} count={STEPS.length} titles={STEPS} onPrev={() => setModalStep((i) => Math.max(0, i - 1))} onNext={() => setModalStep((i) => Math.min(STEPS.length - 1, i + 1))} lastLabel="Done" primaryNext />
        </section>
        <section className={s.state} aria-label="Embed step navigation">
          <p className={s.stateTitle}>Embed</p>
          <p className={s.note}>Each segment jumps to its step; Start over on the last one.</p>
          <StepNav index={embedStep} count={STEPS.length} titles={STEPS} onPrev={() => setEmbedStep((i) => Math.max(0, i - 1))} onNext={() => setEmbedStep((i) => (i >= STEPS.length - 1 ? 0 : i + 1))} onGo={setEmbedStep} lastLabel="Start over" />
        </section>
      </div>

      <h3 className={s.h3}>Live: full bar (modal) and compact bar (embed)</h3>
      <div className={s.grid}>
        <ScenePlayer scene={results.scene} loops={20} step={{ index: 1, count: publicCheck.steps.length }} />
        <TutorialEmbed tutorialId="public.check" tutorial={publicCheck} showStepText={false} />
      </div>
    </div>
  );
}
