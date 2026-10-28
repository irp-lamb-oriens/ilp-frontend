"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO, RevealTitle } from "@/components/motion/Motion";
import { CHECK_CTA, HERO } from "@/components/landing/content";
import styles from "./HeroCTA.module.scss";

/**
 * Homepage hero, first viewport only: eyebrow, title, one supporting line and
 * the two actions. The problem, the four steps and what you get follow as
 * their own scroll sections (landing/HeroStory.tsx), so this screen stays
 * quiet. Primary: the free deadline check. Secondary: scroll to the steps.
 */
export default function HeroCTA() {
  const reduce = useReducedMotion();
  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, ease: EASE_OUT_EXPO, delay },
        };

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.inner}>
        <motion.p className={styles.eyebrow} {...enter(0)}>
          {HERO.eyebrow}
        </motion.p>
        <div id="hero-title">
          <RevealTitle as="h1" text={HERO.title} className={styles.title} immediate={!!reduce} />
        </div>
        <motion.p className={styles.lead} {...enter(0.35)}>
          {HERO.lead}
        </motion.p>
        <motion.div className={styles.actions} {...enter(0.5)}>
          <Link href="/check" className={styles.primary}>
            {CHECK_CTA}
          </Link>
          <a href={`#${HERO.howAnchor}`} className={styles.secondary}>
            {HERO.secondary}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
