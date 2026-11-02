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
  // Until the variant is known (at most 300 ms) the control holds the slot,
  // invisible, so nothing below it moves.
  const headline = useExperiment("hero-headline");
  const title = headline.isControl ? HERO.title : HERO.titleB;
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
        <motion.p className={styles.eyebrow} {...enter(0)}>
          {HERO.eyebrow}
        </motion.p>
        <div id="hero-title" className={headline.ready ? undefined : styles.titlePending}>
          <RevealTitle key={headline.ready ? title : "pending"} as="h1" text={headline.ready ? title : HERO.title} className={styles.title} immediate={!!reduce} />
        </div>
        <motion.p className={styles.lead} {...enter(0.35)}>
          {HERO.lead}
        </motion.p>
        <motion.div className={styles.actions} {...enter(0.5)}>
          <Link href="/check" className={styles.primary} onClick={() => track.click("home.hero.check")}>
            {CHECK_CTA}
          </Link>
          <a href={`#${HERO.howAnchor}`} className={styles.secondary} onClick={() => track.click("home.hero.how")}>
            {HERO.secondary}
          </a>
        </motion.div>
        <motion.ul className={styles.facts} {...enter(0.65)}>
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
