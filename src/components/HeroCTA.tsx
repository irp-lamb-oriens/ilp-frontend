"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { RevealTitle, Reveal } from "@/components/motion/Motion";
import { openLeadForm } from "@/lib/leadEvents";
import styles from "./HeroCTA.module.scss";

const HERO_IMAGE =
  "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1600";

/**
 * Landing hero: calm, light, and direct. Navy headline on a white/mist
 * canvas, a light-blue CTA, and a real-people photo on the right. The photo
 * drifts gently while the copy lifts as the hero scrolls away.
 */
export default function HeroCTA() {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  return (
    <section ref={heroRef} className={styles.hero}>
      <motion.div
        className={styles.heroGrid}
        style={reduce ? undefined : { y: copyY }}
      >
        <div className={styles.heroCopy}>
          <Reveal delay={0.05}>
            <p className={styles.eyebrow}>Trusted legal support for your life abroad</p>
          </Reveal>
          <RevealTitle
            as="h1"
            text="Your legal life abroad, organized."
            className={styles.headline}
            delay={0.15}
          />
          <Reveal delay={0.5}>
            <p className={styles.sub}>
              Clear, calm guidance for living, investing, and doing business in
              Costa Rica, Panama, and Mexico. One profile, real professionals,
              ongoing support.
            </p>
          </Reveal>
          <Reveal delay={0.7}>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => openLeadForm({ topic: "Free compliance check" })}
              >
                Start free
              </button>
              <a href="#pricing" className={styles.secondary}>
                See plans
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal className={styles.heroMedia} from="right" delay={0.4}>
          <motion.div
            className={styles.mediaFrame}
            style={reduce ? undefined : { y: imgY }}
          >
            <Image
              src={HERO_IMAGE}
              alt="People reviewing documents together at a table"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={styles.mediaImg}
              priority
            />
          </motion.div>
        </Reveal>
      </motion.div>
    </section>
  );
}