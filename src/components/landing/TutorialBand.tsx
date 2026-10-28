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
}

/**
 * A public tutorial played between two selling sections: a plain heading and
 * one lead-in sentence on the left, the demo on the right (stacked on phones).
 * The demo loads only when it nears the screen and plays while in view.
 */
export function TutorialBand({ band, tint = false }: { band: TutorialBandContent; tint?: boolean }) {
  return (
    <section id={band.anchor} className={tint ? `${s.tutorialBand} ${s.tutorialBandTint}` : s.tutorialBand} aria-label={band.title}>
      <div className={`${s.wrap} ${s.tutorialGrid}`}>
        <SectionHead title={band.title} why={band.lead} icon="play" className={s.tutorialHead} />
        <TutorialEmbed tutorialId={band.id} caption={band.caption} className={s.tutorialEmbed} />
      </div>
    </section>
  );
}
