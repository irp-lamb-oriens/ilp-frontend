"use client";

import Link from "next/link";
import { Notice, PageIntro } from "@/components/ui";
import s from "./apply.module.scss";

/** Intro above the application: what it is, the steps, why it matters (working-screen order). */
export default function ApplyIntro() {
  return (
    <div className={s.intro}>
      <PageIntro
        eyebrow="Partner lawyers"
        title="Apply as a partner lawyer"
        what="An application to take 20-minute video calls with ILP members through the lawyer portal. Applying is free, and the form has seven short steps."
        how={[
          "Tell us about you, your practice, your areas, your hours and your fees.",
          "Send the application. You get a confirmation email and can sign in to the lawyer portal.",
          "We check your carné with the Colegio and email you when you are approved. Members can book you after that.",
        ]}
        why="Your answers set up your lawyer account, so you can start taking calls soon after approval."
        actions={
          <Link href="/attorneys" className={s.inlineLink}>
            Read about the partnership first
          </Link>
        }
      />
      <Notice tone="neutral" title="What this form does not ask for">
        No bank details, no ID numbers and no passwords. We ask for payout details after you are approved.
      </Notice>
    </div>
  );
}
