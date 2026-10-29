"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import CountUp from "@/components/motion/CountUp";
import { BeatStory } from "@/components/motion/BeatStory";
import { Eyebrow, Mark, RevealText, Stage, StageItem, useStoryLayout } from "@/components/motion/Story";
import { EASE_OUT_STRONG } from "@/components/ui/loadingTiming";
import { APPLY_HREF, LAWYER_BANDS, LAWYERS_HERO, LAWYERS_INTRO, LAWYERS_WHAT, SIGN_IN_HREF } from "./content";
import { HOW_BEATS, HOW_RANGES, HOW_SLOTS, HOW_TRACK_VH, WHY_BEATS, WHY_RANGES, WHY_SLOTS, WHY_TRACK_VH } from "./lawyersBeats";
import { HoursVisual, MemberVisual, MembersVisual, StepScreen } from "./LawyerVisuals";
import s from "./LawyersStory.module.scss";

/**
 * The top of /attorneys as four sections, one idea each:
 *
 *   1. LawyersHero: the six countries, the promise with its key phrase
 *      underlined word by word, and the two calls to action. Nothing else.
 *   2. WhyLawyersJoin: a pinned story of three statements (who the members
 *      are, the unpaid hours, what ILP members do), each with a picture.
 *   3. HowItWorksForYou: a pinned story of the four steps, each with an
 *      example lawyer-portal screen that plays its own short timeline.
 *   4. PartnershipClose: the membership facts in order of weight, then the
 *      calls to action again.
 *
 * The pinned stories use BeatStory (motion/BeatStory.tsx): one beat on stage
 * at a time, an empty gap between two, text and picture changing sides.
 * Every word is cut from LAWYERS_HERO (content.ts) without changes.
 */

const ease = [...EASE_OUT_STRONG] as [number, number, number, number];

/* ── 1. Hero ─────────────────────────────────────────────────── */

const WORD: Variants = {
  hidden: { opacity: 0, y: "0.45em" },
  show: { opacity: 1, y: "0em", transition: { duration: 0.6, ease } },
};
const FADE: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5, ease } } };
const LINE: Variants = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.45, ease, delay: 0.3 } } };
const STILL: Variants = { hidden: {}, show: {} };

export function LawyersHero() {
  const ref = useRef<HTMLElement>(null);
  const layout = useStoryLayout();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Wide screens: the hero lifts and fades as the next section comes up.
  const opacity = useTransform(scrollYProgress, [0.3, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -64]);
  const visibility = useTransform(opacity, (o) => (o > 0 ? "visible" : "hidden"));
  const pinned = layout === "pinned";
  const words = LAWYERS_INTRO.titleKey.split(" ");

  return (
    <section ref={ref} className={s.hero} aria-labelledby="lawyers-hero-title">
      <motion.div className={s.heroInner} style={pinned ? { opacity, y, visibility } : undefined}>
        <Stage className={s.heroStage} amount={0.1} stagger={0.16}>
          <Eyebrow className={s.heroEyebrow}>
            <span className={s.srOnly}>{LAWYERS_HERO.eyebrow}</span>
            <motion.span aria-hidden="true" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } } }}>
              {LAWYERS_INTRO.eyebrowLead}{" "}
              {LAWYERS_INTRO.countries.map((c, i) => (
                <span key={c}>
                  <motion.span className={s.heroCountry} variants={reduce ? FADE : WORD}>
                    {c}
                  </motion.span>
                  {i < LAWYERS_INTRO.countries.length - 1 ? " " : null}
                </span>
              ))}
            </motion.span>
          </Eyebrow>

          <h1 id="lawyers-hero-title" className={s.h1}>
            <span className={s.srOnly}>{LAWYERS_HERO.title}</span>
            <span aria-hidden="true">
              <StageItem as="span" level="title" className={s.h1Lead}>
                {LAWYERS_INTRO.titleLead}
              </StageItem>{" "}
              <motion.span className={s.h1Key} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}>
                {words.map((w, i) => (
                  <span key={i}>
                    <motion.span className={s.keyWord} variants={reduce ? FADE : WORD}>
                      {w}
                      <motion.span
                        className={i < words.length - 1 ? s.keyLine : `${s.keyLine} ${s.keyLineLast}`}
                        variants={reduce ? STILL : LINE}
                      />
                    </motion.span>
                    {i < words.length - 1 ? " " : null}
                  </span>
                ))}
              </motion.span>
            </span>
          </h1>

          <StageItem level="body" className={s.actions}>
            <Link href={APPLY_HREF} className={s.primary}>
              {LAWYERS_HERO.primary}
            </Link>
            <a href={`#${LAWYER_BANDS.day.anchor}`} className={s.secondary}>
              {LAWYERS_HERO.secondary}
            </a>
          </StageItem>
        </Stage>
      </motion.div>
    </section>
  );
}

/* ── 2. Why lawyers join ─────────────────────────────────────── */

const WHY_VISUALS = [MembersVisual, HoursVisual, MemberVisual];

export function WhyLawyersJoin() {
  return (
    <BeatStory
      id="why-lawyers-join"
      heading={LAWYERS_HERO.labels.why}
      beats={WHY_BEATS}
      ranges={WHY_RANGES}
      slots={WHY_SLOTS}
      trackVh={WHY_TRACK_VH}
      statement
      tone="canvas"
      visual={(i, t) => {
        const V = WHY_VISUALS[i];
        return <V t={t} />;
      }}
    />
  );
}

/* ── 3. How it works for you ─────────────────────────────────── */

export function HowItWorksForYou() {
  return (
    <BeatStory
      id="how-it-works-for-lawyers"
      heading={LAWYERS_HERO.labels.how}
      beats={HOW_BEATS}
      ranges={HOW_RANGES}
      slots={HOW_SLOTS}
      trackVh={HOW_TRACK_VH}
      wideVisual
      tone="accent"
      visual={(i, t, layout) => <StepScreen index={i} t={t} layout={layout} />}
    />
  );
}

/* ── 4. What the partnership is ──────────────────────────────── */

const formatPrice = (v: number) => `US$${v.toFixed(2)}`;

export function PartnershipClose() {
  const w = LAWYERS_WHAT;
  return (
    <section className={s.what} aria-labelledby="lawyers-what-title">
      <Stage className={s.whatInner} amount={0.25} stagger={0.14}>
        <StageItem as="h2" level="title" id="lawyers-what-title" className={s.whatHeading}>
          {LAWYERS_HERO.labels.what}
        </StageItem>
        <RevealText text={w.lead} bare className={s.whatLead} />
        <div className={s.whatGrid}>
          <StageItem level="visual" className={s.priceBlock}>
            <p className={s.price}>
              <Mark className={s.priceMark}>
                <CountUp value={w.price} formatter={formatPrice} duration={0.9} className={s.priceFigure} />
              </Mark>
            </p>
            <RevealText text={w.calls} mark={w.callsMark} bare className={s.calls} />
          </StageItem>
          <div className={s.whatLines}>
            <StageItem level="body" className={s.whatLine}>
              <RevealText text={w.partners} bare className={s.whatText} />
            </StageItem>
            <StageItem level="body" className={s.whatLine}>
              <RevealText text={w.extra} mark={w.extraMark} bare className={s.whatText} />
            </StageItem>
          </div>
        </div>
        <StageItem level="body" className={s.actions}>
          <Link href={APPLY_HREF} className={s.primary}>
            {LAWYERS_HERO.primary}
          </Link>
          <a href={`#${LAWYER_BANDS.day.anchor}`} className={s.secondary}>
            {LAWYERS_HERO.secondary}
          </a>
          <Link href={SIGN_IN_HREF} className={s.textLink}>
            {LAWYERS_HERO.signIn}
          </Link>
        </StageItem>
      </Stage>
    </section>
  );
}
