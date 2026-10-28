import type { Metadata } from "next";
import Nav from "@/components/Nav";
import HeroCTA from "@/components/HeroCTA";
import ParallaxBand from "@/components/ParallaxBand";
import { FeaturesSticky, StepsPan } from "@/components/landing/StorySections";
import { CostsStory } from "@/components/landing/CostsStory";
import { ProblemScroll, StepsScroll, WhatYouGet } from "@/components/landing/HeroStory";
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
  title: "International Legal Partner: legal membership in six countries",
  description:
    "A legal membership for North Americans in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain: US$79.99 a month plus a US$100 activation fee, up to three 20-minute video calls a month with a lawyer licensed in your country, and a free deadline check.",
};

/**
 * Homepage order (HERO, 2026-10-27): hero (title and the two actions, one
 * screen) -> the problem (pinned, phrase by phrase) -> how ILP works (pinned,
 * one step at a time, #how-it-works) -> what you get (price and terms) ->
 * what a missed date can cost you -> demo: the free check -> photo band ->
 * what the membership includes -> demo: the member home -> real situations ->
 * demo: a call with your lawyer -> photo band -> six countries -> example
 * situations -> pricing -> demo: what you pay -> questions -> final call to
 * action -> footer. The three-facts strip (TrustStrip) is no longer rendered:
 * "What you get" now says the same facts.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroCTA />
        <ProblemScroll />
        <StepsScroll />
        <WhatYouGet />

        <CostsStory />
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
