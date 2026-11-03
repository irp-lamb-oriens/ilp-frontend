"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO, RevealTitle } from "@/components/motion/Motion";
import { CHECK_CTA, HERO, TRUST } from "@/components/landing/content";
import HeroLedger from "@/components/landing/HeroLedger";
import { memberLedger } from "@/components/landing/ledgers";
import { track, useExperiment } from "@/lib/journey";
import styles from "./HeroCTA.module.scss";

/**
 * Homepage hero, first viewport only: eyebrow, title, one supporting line and
 * the two actions. The problem, the four steps and what you get follow as
 * their own scroll sections (landing/HeroStory.tsx), so this screen stays
 * quiet. Primary: the free deadline check. Secondary: scroll to the steps.
 *
 * Wide screens split 7/5: the words on the left, the hero ledger on the
 * right (an example member's dates with the today rule, landing/ledgers.ts).
 * Under the actions, the three plain facts of the offer (TRUST) in one line.
 * Phones stack: words, actions, facts, then the ledger.
 */
export default function HeroCTA() {
  const reduce = useReducedMotion();
  // JOURNEYS experiment "hero-headline": A is HERO.title, B is HERO.titleB.
  // The control is painted from the server HTML at once and swapped for B
  // only when the variant says so (QA round 1, LCP 4.0 s: the title used to
  // stay invisible until hydration and then fade in word by word, so the
  // largest paint waited for JavaScript). Only visitors who allowed the
  // measurement id are in the experiment; the rest never swap.
  const headline = useExperiment("hero-headline");
  const title = headline.ready && !headline.isControl ? HERO.titleB : HERO.title;
  const ledger = useMemo(() => memberLedger(), []);

  useEffect(() => {
    track.step("landing_view");
  }, []);
  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, ease: EASE_OUT_EXPO, delay },
        };

  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
        {/* Eyebrow, title and lead are the largest paint: no entrance fade. */}
        <p className={styles.eyebrow}>{HERO.eyebrow}</p>
        <div id="hero-title">
          <RevealTitle key={title} as="h1" text={title} className={styles.title} immediate />
        </div>
        <p className={styles.lead}>{HERO.lead}</p>
        <motion.div className={styles.actions} {...enter(0.15)}>
          <Link href="/check" className={styles.primary} onClick={() => track.click("home.hero.check")}>
            {CHECK_CTA}
          </Link>
          <a href={`#${HERO.howAnchor}`} className={styles.secondary} onClick={() => track.click("home.hero.how")}>
            {HERO.secondary}
          </a>
        </motion.div>
        <motion.ul className={styles.facts} {...enter(0.3)}>
          {TRUST.map((f) => (
            <li key={f.value} className={styles.fact}>
              <span className={styles.factValue}>{f.value}</span>
              <span className={styles.factLabel}>{f.label}</span>
            </li>
          ))}
        </motion.ul>
        </div>
        <HeroLedger data={ledger} className={styles.ledger} />
      </div>
    </section>
  );
}
