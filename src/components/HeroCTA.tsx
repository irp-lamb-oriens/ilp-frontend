"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { RevealTitle, Reveal, EASE_OUT_EXPO } from "@/components/motion/Motion";
import { openLeadForm } from "@/lib/leadEvents";
import { CLAIM, CHECK_CTA } from "@/components/landing/content";
import HeroChat from "@/components/HeroChat";
import styles from "./HeroCTA.module.scss";

const HERO_IMAGE =
  "https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg";

const VALUE_STACK = [
  "Smart Compliance Alert",
  "legal advice on a membership",
  "Vetted International attorneys",
  "Legal customer support",
];

/**
 * Animated checkmark: the stroke draws in on a cubic-bezier curve while the
 * mark scales in on a spring, so it "draws then bounces". Staggered per line
 * via `index`.
 */
function CheckMark({ index }: { index: number }) {
  const reduce = useReducedMotion();
  const drawDelay = 0.35 + index * 0.16;

  return (
    <motion.svg
      className={styles.valueCheck}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      initial={reduce ? false : { scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        scale: { type: "spring", stiffness: 280, damping: 13, delay: drawDelay },
        opacity: { duration: 0.2, delay: drawDelay },
      }}
    >
      <circle cx="12" cy="12" r="10.5" className={styles.checkCircle} />
      <motion.path
        d="M7.2 12.4 L10.4 15.6 L16.8 8.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { delay: drawDelay, duration: 0.55, ease: [0.65, 0, 0.35, 1] },
          opacity: { delay: drawDelay, duration: 0.01 },
        }}
      />
    </motion.svg>
  );
}

/**
 * Landing hero: slogan + subheading on the left, a right-justified value stack
 * with the primary CTA beneath it on the right. Navy headline on a white/mist
 * canvas with a light-blue CTA. The copy lifts gently as the hero scrolls away.
 */
export default function HeroCTA() {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
    >
      <motion.div
        className={styles.heroGrid}
        style={reduce ? undefined : { y: copyY }}
      >
        <div className={styles.heroCopy}>
          <Reveal delay={0.05}>
            <p className={styles.eyebrow}>For You</p>
          </Reveal>
          <RevealTitle
            as="h1"
            text={CLAIM}
            className={styles.headline}
            delay={0.15}
          />
          <Reveal delay={0.4}>
            <p className={styles.sub}>
              Get a free check that shows every renewal, filing, and payment before your deadlines arrive.
            </p>
          </Reveal>
        </div>

        <Reveal className={styles.heroCta} from="right" delay={0.2}>
          <ul className={styles.valueStack}>
            {VALUE_STACK.map((item, i) => (
              <motion.li
                key={item}
                className={styles.valueItem}
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.65, ease: EASE_OUT_EXPO, delay: 0.25 + i * 0.15 }}
              >
                <span className={styles.valueLabel}>{item}</span>
                <CheckMark index={i} />
              </motion.li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.primary}
            onClick={() => openLeadForm({ topic: "Free deadline check" })}
          >
            {CHECK_CTA}
          </button>
          <a href="#pricing" className={styles.secondary}>
            See what is included
          </a>
          <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-start" }}>
            <HeroChat />
          </div>
        </Reveal>
      </motion.div>
    </section>
  );
}