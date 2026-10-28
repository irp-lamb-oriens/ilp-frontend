"use client";

import { useState } from "react";
import { Button, ButtonLink, INTRO_STORAGE_KEY, PageIntro } from "@/components/ui";
import { TutorialEmbed } from "@/components/tutorial";
import s from "./IntroGallery.module.scss";

/** PageIntro in both orders and the compact dashboard version. */
export function IntroGallery() {
  const [key, setKey] = useState(0);
  const resetCollapsed = () => {
    try {
      window.localStorage.removeItem(INTRO_STORAGE_KEY);
    } catch {
      // storage blocked: nothing stored to reset
    }
    setKey((k) => k + 1);
  };

  return (
    <div className={s.stack} key={key}>
      <p className={s.note}>
        Marketing hero, Golden Circle order (why, how, what), with a tutorial button and an illustration slot.
      </p>
      <div className={s.frame}>
        <PageIntro
          headingLevel={2}
          eyebrow="Free deadline check"
          title="See the Costa Rica dates that may apply to you"
          order="why-how-what"
          why="Residency renewals, company filings and car permits each have their own date. Knowing them early gives you time to ask a lawyer before anything is due."
          how={["Answer a few questions about your residency, property, company and car.", "See a dated list of what may require review.", "Keep the list by email, or talk it through with a lawyer as a member."]}
          what="A free check for people living in or owning property in Costa Rica. It takes about two minutes and needs no account."
          actions={<ButtonLink href="/check">Start the free check</ButtonLink>}
          tutorialId="public.check"
          illustration={<TutorialEmbed tutorialId="public.check" stepIds={["results"]} showStepText={false} explainList={false} />}
        />
      </div>

      <p className={s.note}>Working screen, what, how, why (the default order).</p>
      <div className={s.frame}>
        <PageIntro
          headingLevel={2}
          title="Book a call"
          what="A 20-minute video call with your lawyer, licensed in Costa Rica. Each month includes three calls, 60 minutes in all."
          how={["Pick a day and an open time.", "Write your question so your lawyer can prepare.", "Press Book this call. The Google Meet link comes by email."]}
          why="Your lawyer reads your question and your profile before the call, so the 20 minutes go to your answer."
          tutorialId="client.book"
        />
      </div>

      <p className={s.note}>
        Compact, for dashboards. Hide intro is remembered per screen in this browser (key <code>{INTRO_STORAGE_KEY}</code>).
      </p>
      <PageIntro
        compact
        headingLevel={2}
        storageKey="ui-gallery-compact"
        title="Today"
        what="Your list of jobs for today, with the most urgent on top, and the members who need attention."
        how={["Open a task from My queue.", "Do the job: call, email or update the member.", "Close the task with one line on what happened."]}
        why="Every member hears from ILP on time, and the whole team can see what was done."
        tutorialId="staff.today"
      />
      <div>
        <Button variant="secondary" size="sm" onClick={resetCollapsed}>
          Reset remembered intros
        </Button>
      </div>
    </div>
  );
}

/** TutorialEmbed: a public tutorial playing inline, no sign-in. */
export function EmbedGallery() {
  return (
    <div className={s.embedGrid}>
      <div className={s.embedText}>
        <p className={s.note}>
          <code>{'<TutorialEmbed tutorialId="public.check" caption="…" />'}</code> plays while a third of it is on screen and pauses when it leaves. Each step plays once, then the next one starts. Content loads only when the card nears the screen.
        </p>
        <p className={s.note}>The second demo uses <code>autoplay=&quot;off&quot;</code> and one step.</p>
      </div>
      <TutorialEmbed tutorialId="public.check" caption="The free deadline check, from the first question to the dated list." />
      <TutorialEmbed tutorialId="public.check" stepIds={["keep"]} autoplay="off" headingLevel={4} />
    </div>
  );
}

export default IntroGallery;
