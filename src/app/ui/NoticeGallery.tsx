"use client";

import { useState } from "react";
import { Button, ErrorNotice, Notice, resetNoticeDismissals, type NoticeFix, type NoticeTone, type NoticeVariant } from "@/components/ui";
import s from "./NoticeGallery.module.scss";

const TONES: NoticeTone[] = ["info", "success", "warning", "danger", "neutral"];
const VARIANTS: NoticeVariant[] = ["block", "inline", "banner"];

const SAMPLE: Record<NoticeTone, { title: string; body: string }> = {
  info: { title: "Standard hours apply", body: "Members can book you Monday to Friday, 9:00 am to 5:00 pm, until you save your own hours here." },
  success: { title: "Your membership is active", body: "60 of 60 minutes and 3 of 3 calls are ready this month." },
  warning: { title: "Your last payment did not go through", body: "Your access continues until November 3 while you update your card." },
  danger: { title: "Calls are paused", body: "Your membership is paused because the last payment did not go through." },
  neutral: { title: "Draft: pending review by ILP's counsel", body: "This text is a working draft and may change before ILP opens to members." },
};

const FIX: Record<NoticeTone, NoticeFix> = {
  info: {
    steps: ["Turn on each day you work.", "Add one or more time windows for that day.", "Press Save hours at the bottom of the page."],
    tutorialId: "lawyer.availability",
    tutorialStep: "weekly",
  },
  success: { steps: ["Book your first call from Overview.", "Fill in your profile so your lawyer can prepare."] },
  warning: {
    summary: "This takes about two minutes.",
    steps: ["Press Update your card.", "Type the new card details on the secure page.", "Come back here. The notice goes away once the payment goes through."],
    scene: () => import("@/tutorials/noticeScenes").then((m) => m.updateCard),
  },
  danger: {
    steps: ["Press Update your card and pay the missed month.", "Your calls open again as soon as the payment goes through.", "If you pay by bank transfer, write to your ILP team from Messages."],
  },
  neutral: {
    steps: ["Nothing to do: you can read and use this page as it is.", "ILP will show the final version here once its lawyer has checked it."],
  },
};

export default function NoticeGallery() {
  const [variant, setVariant] = useState<NoticeVariant>("block");
  const [key, setKey] = useState(0);

  return (
    <div className={s.wrap}>
      <p className={s.note}>
        One look for every prerequisite, warning, disclaimer and banner: no fill, a dashed border and an outline icon in the
        tone color. Warning and danger must pass <code>fix</code>. Open &ldquo;How to fix this&rdquo; to see the steps.
      </p>

      <div className={s.switch} role="group" aria-label="Variant">
        {VARIANTS.map((v) => (
          <Button key={v} size="sm" variant={v === variant ? "primary" : "secondary"} aria-pressed={v === variant} onClick={() => setVariant(v)}>
            {v}
          </Button>
        ))}
      </div>

      <div className={s.list}>
        {TONES.map((t) => {
          const common = { title: SAMPLE[t].title, variant, headingLevel: 4 as const };
          return t === "warning" || t === "danger" ? (
            <Notice key={t} {...common} tone={t} fix={FIX[t]} actions={<Button size="sm">Update your card</Button>}>
              {SAMPLE[t].body}
            </Notice>
          ) : (
            <Notice key={t} {...common} tone={t} fix={FIX[t]} terms={t === "neutral" ? ["counsel"] : undefined}>
              {SAMPLE[t].body}
            </Notice>
          );
        })}
      </div>

      <h3 className={s.h3}>Without fix steps</h3>
      <div className={s.list}>
        <Notice tone="info" title="Your Google Meet link is coming by email" variant="inline" />
        <Notice tone="success" title="Closed: Welcome call with Imani Okafor" variant="inline" />
      </div>

      <h3 className={s.h3}>&ldquo;Show me&rdquo;</h3>
      <div className={s.list}>
        <Notice
          tone="info"
          title="Placeholder data is loaded"
          headingLevel={4}
          terms={["placeholderData"]}
          fix={{
            steps: ["Tick Exclude placeholder data to hide the example members from your figures.", "Ask an admin to run scripts/removePlaceholders.ts before real members join."],
            scene: () => import("@/tutorials/noticeScenes").then((m) => m.placeholderData),
          }}
        >
          38 example members are loaded. Plays a one-off scene.
        </Notice>
        <Notice tone="info" title="Standard hours apply" headingLevel={4} fix={FIX.info}>
          Opens the Availability tutorial at the &ldquo;Set your weekly hours&rdquo; step.
        </Notice>
      </div>

      <h3 className={s.h3}>Dismissible and errors</h3>
      <div className={s.list} key={key}>
        <Notice id="gallery.dismiss" dismissible tone="info" title="Get a reminder on this device" actions={<Button size="sm">Enable notifications</Button>} headingLevel={4}>
          Dismissal is remembered in this browser by <code>id</code>.
        </Notice>
        <ErrorNotice audience="member" onRetry={() => undefined}>
          Could not load your calls.
        </ErrorNotice>
      </div>
      <div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            resetNoticeDismissals("gallery.dismiss");
            setKey((k) => k + 1);
          }}
        >
          Show dismissed notice again
        </Button>
      </div>
    </div>
  );
}
