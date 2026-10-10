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
          image={IMG.justice}
          alt="Lady Justice statue holding scales"
          eyebrow="The stakes"
          title="A missed deadline is never a surprise to the state."
          body="Late fees, lapsed permits, and compound interest all start the same way: no reminder and no plan. ILP makes sure you see each one coming."
          align="left"
        />

        <FeaturesSticky />
        <StepsPan />

        <ParallaxBand
          image={IMG.scales}
          alt="Scales of justice on a lawyer's desk"
          eyebrow="Vetted partners"
          title="Legal judgment when you need it. Reminders when you do not."
          body="Lawyers in each country maintain the rules. When an alert needs a human, book a partner vetted for your specialty and language."
          align="right"
        />

        <CoverageGutenberg />
        <QuotesWall />
        <Pricing />
        <FaqSplit />
        <FinalCta />

        <footer className={s.footer}>
          <div className={s.wrap}>
            <p>International Legal Partner. Compliance reminders, not legal advice.</p>
          </div>
        </footer>
      </main>
    </>
  );
}