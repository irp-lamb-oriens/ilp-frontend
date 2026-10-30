import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import Nav from "@/components/Nav";
import HeroCTA from "@/components/HeroCTA";
import ParallaxBand from "@/components/ParallaxBand";
import { FeaturesSticky, SituationsList } from "@/components/landing/StorySections";
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
import { BANDS, FAQ, FOOTER, IMG, TUTORIAL_BANDS } from "@/components/landing/content";
import JsonLd from "@/components/seo/JsonLd";
import { faqLd, membershipLd, organizationLd, websiteLd } from "@/lib/seo/jsonLd";
import s from "@/components/landing/landing.module.scss";
import Narrator from "@/components/narration/Narrator";

export const metadata: Metadata = pageMetadata("/", { ownOgImage: true });

/**
 * Homepage order (STORY, 2026-10-28): hero (title and the two actions, one
 * screen) -> the problem (pinned, phrase by phrase) -> how ILP works (pinned,
 * one step at a time, #how-it-works) -> what you get (price and terms) ->
 * what a missed date can cost you (pinned three-beat story, #costs) -> demo:
 * the free check -> photo band -> what the membership includes -> demo: the
 * member home -> real situations (staged rows, no longer pinned) -> demo: a
 * call with your lawyer -> photo band -> six countries -> example situations
 * -> pricing -> demo: what you pay -> questions -> final call to action ->
 * footer. Pinned stories: the hero story and the costs story; every other
 * section stages eyebrow, title and body as it enters (motion/Story.tsx).
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
          mark={BANDS.clarity.mark}
          align="left"
        />

        <FeaturesSticky />
        <TutorialBand band={TUTORIAL_BANDS.home} tint />

        <SituationsList />
        <TutorialBand band={TUTORIAL_BANDS.call} />

        <ParallaxBand
          image={IMG.workspace}
          alt={BANDS.lawyers.alt}
          title={BANDS.lawyers.title}
          body={BANDS.lawyers.body}
          mark={BANDS.lawyers.mark}
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
      <Narrator page="home" />
      <JsonLd data={[organizationLd(), websiteLd(), membershipLd(), faqLd(FAQ)]} />
    </>
  );
}
