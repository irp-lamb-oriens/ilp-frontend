"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { RevealTitle, Reveal } from "@/components/motion/Motion";
import { openLeadForm } from "@/lib/leadEvents";
import styles from "./HeroCTA.module.scss";

const VALUE_STACK = [
  "Living Legal Profile",
  "Better Local Attorneys",
  "Customer Success Lawyer",
  "Smart Compliance Alerts",
];

/**
 * Landing hero: slogan + subheading + value stack on the left, the primary
 * CTA on the right. Navy headline on a white/mist canvas with a light-blue
 * CTA. The copy lifts gently as the hero scrolls away.
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
    <section ref={heroRef} className={styles.hero}>
      <motion.div
        className={styles.heroGrid}
        style={reduce ? undefined : { y: copyY }}
      >
        <div className={styles.heroCopy}>
          <Reveal delay={0.05}>
            <p className={styles.eyebrow}>The ILP operating system</p>
          </Reveal>
          <RevealTitle
            as="h1"
            text="Live with Confidence"
            className={styles.headline}
            delay={0.15}
          />
          <Reveal delay={0.4}>
            <p className={styles.sub}>
              {"That's Your Legal Life Abroad Solved"}
            </p>
          </Reveal>
          <Reveal delay={0.55}>
            <ul className={styles.valueStack}>
              {VALUE_STACK.map((item) => (
                <li key={item} className={styles.valueItem}>
                  <span className={styles.valueCheck} aria-hidden="true">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className={styles.heroCta} from="right" delay={0.7}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => openLeadForm({ topic: "Membership plan" })}
          >
            Start your membership
          </button>
          <a href="#pricing" className={styles.secondary}>
            See what is included
          </a>
        </Reveal>
      </motion.div>
    </section>
  );
}