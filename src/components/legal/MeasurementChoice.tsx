"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MEASURE_EVENT, type MeasureChoice, getMeasureChoice, gpcEnabled, setMeasureChoice } from "./preferences";
import s from "./MeasurementChoice.module.scss";

/**
 * Allow or refuse the optional measurement id. `compact` is the one-line
 * notice in the site footer (shown until the visitor answers); the full form
 * is on /legal/cookies.
 */
export default function MeasurementChoice({ compact = false }: { compact?: boolean }) {
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState<MeasureChoice | null>(null);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    const sync = () => setChoice(getMeasureChoice());
    sync();
    setGpc(gpcEnabled());
    setReady(true);
    window.addEventListener(MEASURE_EVENT, sync);
    return () => window.removeEventListener(MEASURE_EVENT, sync);
  }, []);

  if (!ready) return null;
  if (compact && (choice !== null || gpc)) return null;

  const choose = (c: MeasureChoice) => {
    setMeasureChoice(c);
    setChoice(c);
  };

  if (gpc) {
    return (
      <section className={s.box} aria-labelledby="measure-title">
        <h2 id="measure-title" className={s.title}>Your choice</h2>
        <p className={s.text}>Your browser sends the Global Privacy Control signal, so we do not store the measurement id.</p>
      </section>
    );
  }

  return (
    <section className={compact ? s.notice : s.box} aria-labelledby={compact ? "measure-notice" : "measure-title"}>
      {compact ? (
        <p id="measure-notice" className={s.text}>
          May we keep an anonymous id in this browser to count how many people go from the free check to joining? No
          advertising, no tracking on other sites. <Link href="/legal/cookies">Cookie notice</Link>
        </p>
      ) : (
        <>
          <h2 id="measure-title" className={s.title}>Your choice</h2>
          <p className={s.text} role="status">
            {choice === "allow"
              ? "You allowed the measurement id."
              : choice === "deny"
              ? "You refused the measurement id. Nothing is stored."
              : "You have not chosen yet. Nothing is stored until you allow it."}
          </p>
        </>
      )}
      <div className={s.actions}>
        <button type="button" className={s.button} aria-pressed={choice === "allow"} onClick={() => choose("allow")}>
          Allow
        </button>
        <button type="button" className={s.button} aria-pressed={choice === "deny"} onClick={() => choose("deny")}>
          No thanks
        </button>
      </div>
    </section>
  );
}
