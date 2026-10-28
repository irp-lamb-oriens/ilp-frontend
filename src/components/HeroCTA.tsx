"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { PageIntro } from "@/components/ui";
import { EASE_OUT_EXPO } from "@/components/motion/Motion";
import { CHECK_CTA, HERO, MEMBERSHIP, TUTORIAL_BANDS } from "@/components/landing/content";
import styles from "./HeroCTA.module.scss";

const HERO_IMAGE =
  "https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=1400";

/**
 * Check mark for the "included" list: the mark scales in on a spring, one line
 * after another. Transform and opacity only; reduced motion shows it at rest.
 */
function CheckMark({ index }: { index: number }) {
  const reduce = useReducedMotion();
  const delay = 0.45 + index * 0.12;
  return (
    <motion.svg
      className={styles.valueCheck}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      initial={reduce ? false : { scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        scale: { type: "spring", stiffness: 280, damping: 15, delay },
        opacity: { duration: 0.2, delay },
      }}
    >
      <circle cx="12" cy="12" r="10.5" className={styles.checkCircle} />
      <path d="M7.2 12.4 L10.4 15.6 L16.8 8.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

/** The right-hand side of the hero: a photo and what the membership includes. */
function HeroArt() {
  const reduce = useReducedMotion();
  return (
    <div className={styles.art}>
      <div className={styles.photo} role="img" aria-label={HERO.imageAlt} style={{ backgroundImage: `url("${HERO_IMAGE}")` }} />
      <div className={styles.included}>
        <h2 className={styles.includedTitle}>{HERO.includedTitle}</h2>
        <ul className={styles.valueStack}>
          {HERO.included.map((item, i) => (
            <motion.li
              key={item}
              className={styles.valueItem}
              initial={reduce ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.3 + i * 0.12 }}
            >
              <CheckMark index={i} />
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
        <p className={styles.price}>
          <span className={styles.priceFigure}>{MEMBERSHIP.price}</span> {MEMBERSHIP.unit}, {MEMBERSHIP.activation}.
        </p>
        <a href="#pricing" className={styles.pricingLink}>
          {HERO.pricingLink}
        </a>
      </div>
    </div>
  );
}

/**
 * Homepage hero in Golden Circle order (copy-rules.md): why (the reader's
 * problem), how (four steps), what (the membership and its price). Primary
 * action: the free deadline check. Secondary: scroll to the first demo.
 */
export default function HeroCTA() {
  return (
    <div className={styles.hero}>
      <div className={styles.inner}>
        <PageIntro
          order="why-how-what"
          eyebrow={HERO.eyebrow}
          title={HERO.title}
          why={HERO.why}
          how={HERO.how}
          what={HERO.what}
          labels={HERO.labels}
          className={styles.intro}
          illustration={<HeroArt />}
          actions={
            <>
              <Link href="/check" className={styles.primary}>
                {CHECK_CTA}
              </Link>
              <a href={`#${TUTORIAL_BANDS.check.anchor}`} className={styles.secondary}>
                {HERO.secondary}
              </a>
            </>
          }
        />
      </div>
    </div>
  );
}
