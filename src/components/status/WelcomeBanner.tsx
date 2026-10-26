"use client";

import { PLAN_STANDARD } from "@/lib/contracts";
import { useMember } from "./MemberContext";
import s from "./WelcomeBanner.module.scss";

/** First visit after joining (?welcome=1). Short, so the next step stays above the fold. */
export default function WelcomeBanner() {
  const { home, welcome } = useMember();
  if (!welcome) return null;
  const minutes = home.membership?.minutesIncluded ?? PLAN_STANDARD.minutesIncluded;
  const calls = home.membership?.callsIncluded ?? PLAN_STANDARD.callsIncluded;
  return (
    <section className={s.banner} aria-labelledby="welcome-title">
      <h1 className={s.title} id="welcome-title">
        Your membership is active
      </h1>
      <p className={s.body}>
        {home.capacity.minutesLeft} of {minutes} minutes and {home.capacity.callsLeft} of {calls} calls are ready this
        month. Your profile is {Math.round(home.completeness.score * 100)}% complete.
      </p>
    </section>
  );
}
