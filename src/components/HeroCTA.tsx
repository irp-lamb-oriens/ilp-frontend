"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { RevealTitle, Reveal } from "@/components/motion/Motion";
import { openLeadForm } from "@/lib/leadEvents";
import styles from "./HeroCTA.module.scss";

const HERO_IMAGE =
  "https://images.pexels.com/photos/5668777/pexels-photo-5668777.jpeg?auto=compress&cs=tinysrgb&w=2000";

/**
 * Landing hero: copy on the left over a full-bleed legal photo, and a glass
 * CTA card on the right that opens the global lead form (LeadModal). The
 * photo drifts down while the copy lifts and fades as the hero scrolls away.
 */
export default function HeroCTA() {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={heroRef} className={styles.hero}>
      <motion.div
        className={styles.heroBg}
        role="img"
        aria-label="Judge's gavel on a wooden desk"
        style={{
          backgroundImage: `url("${HERO_IMAGE}")`,
          ...(reduce ? {} : { y: bgY }),
        }}
      />
      <div className={styles.heroScrim} aria-hidden="true" />

      <motion.div
        className={styles.heroGrid}
        style={reduce ? undefined : { y: copyY, opacity: fade }}
      >
        <div className={styles.heroCopy}>
          <Reveal delay={0.05}>
            <p className={styles.eyebrow}>Smart Compliance Alerts</p>
          </Reveal>
          <RevealTitle
            as="h1"
            text="Know your legal deadlines before they know you."
            className={styles.headline}
            delay={0.15}
          />
          <Reveal delay={0.55}>
            <p className={styles.sub}>
              Tax, residency, corporate, and property obligations across five
              countries, mapped to your profile by local lawyers.
            </p>
          </Reveal>
        </div>

        <Reveal className={styles.heroAction} from="right" delay={0.7}>
          <p className={styles.cardKicker}>Free compliance check</p>
          <p className={styles.cardTitle}>
            See which deadlines apply to you, in under a minute.
          </p>
          <button
            type="button"
            className={styles.primary}
            onClick={() => openLeadForm({ topic: "Free compliance check" })}
          >
            Get alerted
          </button>
          <p className={styles.ctaHint}>No card required. Cancel anytime.</p>
        </Reveal>
      </motion.div>
    </section>
  );
}