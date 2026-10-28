"use client";

import { Notice } from "@/components/ui";
import { PLAN_STANDARD } from "@/lib/contracts";
import { useMember } from "./MemberContext";

/** First visit after joining (?welcome=1). Short, so the next step stays above the fold. */
export default function WelcomeBanner() {
  const { home, welcome } = useMember();
  if (!welcome) return null;
  const minutes = home.membership?.minutesIncluded ?? PLAN_STANDARD.minutesIncluded;
  const calls = home.membership?.callsIncluded ?? PLAN_STANDARD.callsIncluded;
  const pct = Math.round(home.completeness.score * 100);
  return (
    <Notice
      tone="success"
      headingLevel={1}
      title="Your membership is active"
      terms={["membership", "profile", "consultationReady"]}
      fix={{
        label: "What to do first",
        steps: [
          "Book your first call with the Book a call button on your next step card or in your membership box. Your lawyer reads your profile before the call.",
          home.completeness.consultationReady
            ? "Your profile has what your lawyer needs. Update it (Profile in the menu) when something changes."
            : "Fill in the rest of your profile (Profile in the menu). At 70% complete, your lawyer has what they need to prepare.",
          "Write to your ILP team from Messages any time you have a question.",
        ],
        tutorialId: "client.overview",
      }}
    >
      {home.capacity.minutesLeft} of {minutes} minutes and {home.capacity.callsLeft} of {calls} calls are ready this month.
      Your profile is {pct}% complete from the answers you gave when you joined.
    </Notice>
  );
}
