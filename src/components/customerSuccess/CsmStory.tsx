"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { BeatStory } from "@/components/motion/BeatStory";
import { Eyebrow, RevealText, Stage, StageItem, useStoryLayout } from "@/components/motion/Story";
import { EASE_OUT_STRONG } from "@/components/ui/loadingTiming";
import { track } from "@/lib/journey";
import { CONTACT_HREF, CSM_BANDS, CSM_HERO, CSM_INTRO, CSM_WHAT, SIGN_IN_HREF } from "./content";
import { HOW_BEATS, HOW_RANGES, HOW_SLOTS, HOW_TRACK_VH, WHY_BEATS, WHY_RANGES, WHY_SLOTS, WHY_TRACK_VH } from "./csmBeats";
import { CsmStepScreen, CsmWhyVisual } from "./CsmVisuals";
import s from "@/components/lawyers/LawyersStory.module.scss";

/**
 * The top of /customer-success as four sections, one idea each, on the same
 * primitives and styles as /attorneys (LawyersStory.tsx):
 *
 *   1. CsmHero: the six countries, the promise with its key phrase
 *      underlined word by word, and the calls to action. Nothing else.
 *   2. WhyTheRoleMatters: a pinned story of three statements (who the
 *      members are, where they get lost between calls, what a CSM does),
 *      each with a picture.
 *   3. HowYourDayWorks: a pinned story of four steps, each with an example
 *      CSM portal screen (Today, My book, a playbook email, My KPIs) that
 *      plays its own short timeline.
 *   4. RoleClose: that each member has one CSM in large type, then the
 *      boundaries of the role, then the calls to action.
 *
 * The pinned stories use BeatStory (motion/BeatStory.tsx): one beat on stage
 * at a time, an empty gap between two, text and picture changing sides.
 * Tablets get unpinned blocks that play once; phones and reduced motion a
 * single fade. Every word is cut from CSM_HERO (content.ts) without changes.
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

export function CsmHero() {
  const ref = useRef<HTMLElement>(null);
  const layout = useStoryLayout();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Wide screens: the hero lifts and fades as the next section comes up.
  const opacity = useTransform(scrollYProgress, [0.3, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -64]);
  const visibility = useTransform(opacity, (o) => (o > 0 ? "visible" : "hidden"));
  const pinned = layout === "pinned";
  const words = CSM_INTRO.titleKey.split(" ");

  return (
    <section ref={ref} className={s.hero} aria-labelledby="csm-hero-title">
      <motion.div className={s.heroInner} style={pinned ? { opacity, y, visibility } : undefined}>
        <Stage className={s.heroStage} amount={0.1} stagger={0.16}>
          <Eyebrow className={s.heroEyebrow}>
            <motion.span variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } } }}>
              {CSM_INTRO.eyebrowLead}{" "}
              {CSM_INTRO.countries.map((c, i) => (
                <span key={c}>
                  <motion.span className={s.heroCountry} variants={reduce ? FADE : WORD}>
                    {c}
                  </motion.span>
                  {i < CSM_INTRO.countries.length - 1 ? " " : null}
                </span>
              ))}
            </motion.span>
          </Eyebrow>

          <h1 id="csm-hero-title" className={s.h1}>
            <span>
              <StageItem as="span" level="title" className={s.h1Lead}>
                {CSM_INTRO.titleLead}
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
            <a href={CONTACT_HREF} className={s.primary} onClick={() => track.click("csm_landing.hero.contact")}>
              {CSM_HERO.primary}
            </a>
            <a href={`#${CSM_BANDS.day.anchor}`} className={s.secondary}>
              {CSM_HERO.secondary}
            </a>
            <Link href={SIGN_IN_HREF} className={s.textLink}>
              {CSM_HERO.signIn}
            </Link>
          </StageItem>
        </Stage>
      </motion.div>
    </section>
  );
}

/* ── 2. Why the role matters ─────────────────────────────────── */

export function WhyTheRoleMatters() {
  return (
    <BeatStory
      id="why-the-role-matters"
      heading={CSM_HERO.labels.why}
      beats={WHY_BEATS}
      ranges={WHY_RANGES}
      slots={WHY_SLOTS}
      trackVh={WHY_TRACK_VH}
      statement
      tone="canvas"
      visual={(i, t, layout) => <CsmWhyVisual index={i} t={t} layout={layout} />}
    />
  );
}

/* ── 3. How your day works ───────────────────────────────────── */

export function HowYourDayWorks() {
  return (
    <BeatStory
      id="how-your-day-works"
      heading={CSM_HERO.labels.how}
      beats={HOW_BEATS}
      ranges={HOW_RANGES}
      slots={HOW_SLOTS}
      trackVh={HOW_TRACK_VH}
      wideVisual
      tone="accent"
      visual={(i, t, layout) => <CsmStepScreen index={i} t={t} layout={layout} />}
    />
  );
}

/* ── 4. What the role is ─────────────────────────────────────── */

export function RoleClose() {
  const w = CSM_WHAT;
  return (
    <section className={s.what} aria-labelledby="csm-what-title">
      <Stage className={s.whatInner} amount={0.25} stagger={0.14}>
        <StageItem as="h2" level="title" id="csm-what-title" className={s.whatHeading}>
          {CSM_HERO.labels.what}
        </StageItem>
        <RevealText text={w.lead} bare className={s.whatLead} />
        <div className={s.whatGrid}>
          <StageItem level="visual" className={s.freeBlock}>
            <RevealText text={w.big} mark={w.bigMark} bare className={s.free} />
            <RevealText text={w.bigDetail} bare className={s.freeDetail} />
          </StageItem>
          <div className={s.whatLines}>
            {w.lines.map((line) => (
              <StageItem key={line.text} level="body" className={s.whatLine}>
                <RevealText text={line.text} mark={line.mark} bare className={s.whatText} />
              </StageItem>
            ))}
          </div>
        </div>
        <StageItem level="body" className={s.actions}>
          <a href={CONTACT_HREF} className={s.primary} onClick={() => track.click("csm_landing.story.contact")}>
            {CSM_HERO.primary}
          </a>
          <a href={`#${CSM_BANDS.day.anchor}`} className={s.secondary}>
            {CSM_HERO.secondary}
          </a>
          <Link href={SIGN_IN_HREF} className={s.textLink}>
            {CSM_HERO.signIn}
          </Link>
        </StageItem>
      </Stage>
    </section>
  );
}
