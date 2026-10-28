"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { RevealTitle, Reveal } from "@/components/motion/Motion";
import s from "./ParallaxBand.module.scss";

interface ParallaxBandProps {
  image: string;
  alt: string;
  /** Optional mono label. At most one eyebrow per three sections (rules.md). */
  eyebrow?: string;
  title: string;
  body: string;
  align?: "left" | "right" | "center";
}

/**
 * Full-bleed legal-imagery band. The photo is a CSS background on an
 * oversized layer that parallaxes slower than the page; a frosted-glass panel
 * floats over it. The image is decorative (role=img + aria-label for the
 * subject), motion is transform/opacity only and collapses under reduced
 * motion, and the glass becomes solid under reduced transparency.
 */
export default function ParallaxBand({
  image,
  alt,
  eyebrow,
  title,
  body,
  align = "left",
}: ParallaxBandProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-14%", "14%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.04, 1.12]);

  return (
    <section ref={ref} className={`${s.band} ${s[align]}`}>
      <motion.div
        className={s.bg}
        role="img"
        aria-label={alt}
        style={{
          backgroundImage: `url("${image}")`,
          ...(reduce ? {} : { y, scale }),
        }}
      />
      <div className={s.inner}>
        <Reveal className={s.glass} from={align === "right" ? "right" : "left"}>
          {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
          <RevealTitle text={title} className={s.title} />
          <p className={s.body}>{body}</p>
        </Reveal>
      </div>
    </section>
  );
}