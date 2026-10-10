import Nav from "@/components/Nav";
import HeroCTA from "@/components/HeroCTA";
import ParallaxBand from "@/components/ParallaxBand";
import { CostsMorph, FeaturesSticky, StepsPan } from "@/components/landing/StorySections";
import TrustStrip from "@/components/landing/TrustStrip";
import {
  CoverageGutenberg,
  QuotesWall,
  Pricing,
  FaqSplit,
  FinalCta,
} from "@/components/landing/ProofSections";
import { IMG } from "@/components/landing/content";
import s from "@/components/landing/landing.module.scss";

/**
 * Narrative order: hook (hero) -> proof strip -> pain (pinned morph) ->
 * stakes (glass band) -> offer (sticky features) -> ease (horizontal steps)
 * -> trust (glass band) -> reach (Gutenberg coverage) -> social proof ->
 * anchored pricing -> objections -> country-contextual close.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroCTA />

        <TrustStrip />

        <CostsMorph />

        <ParallaxBand
          image={IMG.people}
          alt="People in a meeting reviewing documents"
          eyebrow="Clarity"
          title="Know what applies to you, before it matters."
          body="Your profile maps the obligations that touch your life abroad, so nothing is a surprise. Ask before you act."
          align="left"
        />

        <FeaturesSticky />
        <StepsPan />

        <ParallaxBand
          image={IMG.workspace}
          alt="A clean, modern workspace"
          eyebrow="Vetted partners"
          title="Real professionals, when you need them."
          body="Local professionals maintain the rules in each country. When a decision needs judgment, book a partner matched to your situation and language."
          align="right"
        />

        <CoverageGutenberg />
        <QuotesWall />
        <Pricing />
        <FaqSplit />
        <FinalCta />

        <footer className={s.footer}>
          <div className={s.wrap}>
            <p>International Legal Partner. Trusted legal support for your life abroad.</p>
          </div>
        </footer>
      </main>
    </>
  );
}