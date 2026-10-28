import type { Metadata } from "next";
import Nav from "@/components/Nav";
import HeroCTA from "@/components/HeroCTA";
import ParallaxBand from "@/components/ParallaxBand";
import { CostsMorph, FeaturesSticky, StepsPan } from "@/components/landing/StorySections";
import TrustStrip from "@/components/landing/TrustStrip";
import { TutorialBand } from "@/components/landing/TutorialBand";
import {
  CoverageGutenberg,
  QuotesWall,
  Pricing,
  FaqSplit,
  FinalCta,
} from "@/components/landing/ProofSections";
import { BANDS, FOOTER, IMG, TUTORIAL_BANDS } from "@/components/landing/content";
import s from "@/components/landing/landing.module.scss";

export const metadata: Metadata = {
  title: "International Legal Partner: legal membership for Costa Rica",
  description:
    "A legal membership for North Americans in Costa Rica: US$79.99 a month plus a US$100 activation fee, up to three 20-minute video calls a month with a lawyer licensed in Costa Rica, and a free deadline check.",
};

/**
 * Homepage order (T1): why, how, what hero -> three facts -> the problem ->
 * demo: the free check -> photo band -> what members get -> demo: the member
 * home -> real situations -> demo: a call with your lawyer -> photo band ->
 * Costa Rica first -> example situations -> pricing -> demo: what you pay ->
 * questions -> final call to action -> footer.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroCTA />

        <TrustStrip />

        <CostsMorph />
        <TutorialBand band={TUTORIAL_BANDS.check} />

        <ParallaxBand
          image={IMG.people}
          alt={BANDS.clarity.alt}
          title={BANDS.clarity.title}
          body={BANDS.clarity.body}
          align="left"
        />

        <FeaturesSticky />
        <TutorialBand band={TUTORIAL_BANDS.home} tint />

        <StepsPan />
        <TutorialBand band={TUTORIAL_BANDS.call} />

        <ParallaxBand
          image={IMG.workspace}
          alt={BANDS.lawyers.alt}
          title={BANDS.lawyers.title}
          body={BANDS.lawyers.body}
          align="right"
        />

        <CoverageGutenberg />
        <QuotesWall />
        <Pricing />
        <TutorialBand band={TUTORIAL_BANDS.pricing} tint />
        <FaqSplit />
        <FinalCta />

        <footer className={s.footer}>
          <div className={s.wrap}>
            <p>{FOOTER}</p>
          </div>
        </footer>
      </main>
    </>
  );
}
