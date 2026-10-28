"use client";

import { TutorialEmbed } from "@/components/tutorial";
import { SectionHead } from "./SectionHead";
import s from "./landing.module.scss";

export interface TutorialBandContent {
  id: string;
  anchor: string;
  title: string;
  lead: string;
  caption: string;
  /** The key phrase of the lead-in. */
  mark?: string;
}

/**
 * A public tutorial played between two selling sections: a plain heading and
 * one lead-in sentence (its key phrase underlined) on the left, the demo on the right (stacked on phones).
 * The demo loads only when it nears the screen and plays while in view.
 */
export function TutorialBand({ band, tint = false }: { band: TutorialBandContent; tint?: boolean }) {
  return (
    <section id={band.anchor} className={tint ? `${s.tutorialBand} ${s.tutorialBandTint}` : s.tutorialBand} aria-labelledby={`${band.anchor}-title`}>
      <div className={`${s.wrap} ${s.tutorialGrid}`}>
        <SectionHead
          id={`${band.anchor}-title`}
          title={band.title}
          why={band.lead}
          mark={band.mark}
          icon="play"
          className={s.tutorialHead}
        />
        <TutorialEmbed tutorialId={band.id} caption={band.caption} className={s.tutorialEmbed} />
      </div>
    </section>
  );
}
