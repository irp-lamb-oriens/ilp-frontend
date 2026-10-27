"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Notice } from "@/components/ui";
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
      <Notice
        tone="info"
        headingLevel={2}
        title="Your browser has already said no"
        fix={{
          label: "What does this mean?",
          steps: [
            "Your browser sends a privacy signal called Global Privacy Control. ILP treats it as a no to the measurement id.",
            "Nothing is stored and there is nothing for you to do.",
            "To allow it after all, turn off Global Privacy Control in your browser's privacy settings, then come back to this page.",
          ],
        }}
      >
        Your browser sends the Global Privacy Control signal, so we do not store the measurement id.
      </Notice>
    );
  }

  const buttons = (
    <div className={s.actions}>
      <button type="button" className={s.button} aria-pressed={choice === "allow"} onClick={() => choose("allow")}>
        Allow
      </button>
      <button type="button" className={s.button} aria-pressed={choice === "deny"} onClick={() => choose("deny")}>
        No thanks
      </button>
    </div>
  );

  if (compact) {
    return (
      <Notice
        tone="info"
        variant="banner"
        headingLevel="none"
        title="May we count visits with an anonymous id?"
        actions={buttons}
        fix={{
          label: "What does this mean?",
          steps: [
            "Allow keeps a random number in this browser, so ILP can count how many people go from the free check to joining.",
            "It is not linked to your name, there is no advertising and no tracking on other sites.",
            "No thanks stores nothing. The site works the same either way.",
            "You can change your answer any time on the cookie notice page.",
          ],
          learnMoreHref: "/legal/cookies",
          learnMoreLabel: "Cookie notice",
        }}
      >
        No advertising, no tracking on other sites. <Link href="/legal/cookies">Cookie notice</Link>
      </Notice>
    );
  }

  return (
    <section className={s.box} aria-labelledby="measure-title">
      <h2 id="measure-title" className={s.title}>Your choice</h2>
      <p className={s.text} role="status">
        {choice === "allow"
          ? "You allowed the measurement id."
          : choice === "deny"
          ? "You refused the measurement id. Nothing is stored."
          : "You have not chosen yet. Nothing is stored until you allow it."}
      </p>
      {buttons}
    </section>
  );
}
