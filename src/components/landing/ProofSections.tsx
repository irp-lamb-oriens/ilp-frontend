"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal, RevealTitle, EASE_OUT_EXPO } from "@/components/motion/Motion";
import { openLeadForm } from "@/lib/leadEvents";
import { COUNTRIES, QUOTES, PLANS, FAQ } from "./content";
import s from "./landing.module.scss";

const ALIGN = ["alignStart", "alignEnd", "alignCenter"] as const;
const COUNTRY_PAGES: Record<string, string> = {
  CR: "/costa-rica",
  PA: "/panama",
  MX: "/mexico",
};

/**
 * Gutenberg coverage: each country row takes the justification opposite to
 * the row above it, so the eye zig-zags down the reading gravity diagonal.
 */
export function CoverageGutenberg() {
  return (
    <section className={`${s.wrap} ${s.section}`}>
      <div className={s.sectionHead}>
        <p className={s.eyebrow}>Coverage</p>
        <RevealTitle text="Three countries. One set of eyes on every deadline." className={s.headingXl} />
      </div>
      <ul className={s.coverage}>
        {COUNTRIES.map((c, i) => {
          const align = ALIGN[i % ALIGN.length];
          const from = align === "alignEnd" ? "right" : align === "alignStart" ? "left" : "bottom";
          const href = COUNTRY_PAGES[c.code];
          return (
            <li key={c.code} className={`${s.coverageRow} ${s[align]}`}>
              <Reveal from={from}>
                <span className={s.coverageCode}>{c.code}</span>
                {href ? (
                  <Link href={href} className={s.coverageName}>{c.name}</Link>
                ) : (
                  <span className={s.coverageName}>{c.name}</span>
                )}
                <p className={s.coverageNote}>{c.note}</p>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Offset quote wall: columns drift at different heights instead of a row. */
export function QuotesWall() {
  return (
    <section className={`${s.wrap} ${s.section}`}>
      <div className={s.sectionHead}>
        <p className={s.eyebrow}>From members</p>
        <RevealTitle text="People stop missing deadlines." className={s.headingXl} />
      </div>
      <div className={s.quoteWall}>
        {QUOTES.map((q, i) => (
          <Reveal key={q.name} className={s.quote} delay={i * 0.12}>
            <blockquote>&ldquo;{q.quote}&rdquo;</blockquote>
            <div className={s.attribution}>
              <span className={s.avatar} aria-hidden="true">
                {q.name.split(" ").map((n) => n[0]).join("")}
              </span>
              <div>
                <div className={s.attributionName}>{q.name}</div>
                <div className={s.attributionRole}>{q.role}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Anchored pricing: the recommended plan sits in the middle, raised. */
export function Pricing() {
  return (
    <section className={`${s.wrap} ${s.section}`} id="pricing">
      <div className={`${s.sectionHead} ${s.centerHead}`}>
        <p className={s.eyebrow}>Pricing</p>
        <RevealTitle text="Start free. Upgrade when you need more." className={s.headingXl} />
      </div>
      <div className={s.pricingGrid}>
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.1} className={p.hero ? `${s.plan} ${s.planHero}` : s.plan}>
            {p.hero && <span className={s.planFlag}>Most chosen</span>}
            <div className={s.planName}>{p.name}</div>
            <div>
              <div className={s.planPrice}>
                {p.price}
                {p.hero && <span className={s.planUnit}> / year</span>}
              </div>
              <div className={s.planPerDay}>{p.perDay}</div>
            </div>
            <ul className={s.planFeatures}>
              {p.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <button
              type="button"
              className={p.hero ? s.primary : s.ghost}
              onClick={() => openLeadForm({ topic: p.topic })}
            >
              {p.cta}
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** FAQ split: the heading stays pinned while answers expand on the right. */
export function FaqSplit() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className={`${s.wrap} ${s.sticky}`}>
      <div className={s.stickyHead}>
        <p className={s.eyebrow}>Questions</p>
        <RevealTitle text="Before you sign up." className={s.headingXl} />
      </div>
      <div className={s.faqList}>
        {FAQ.map((item, i) => (
          <div key={item.q} className={s.faqItem}>
            <button
              type="button"
              className={s.faqButton}
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              {item.q}
              <span className={open === i ? `${s.faqIcon} ${s.faqIconOpen}` : s.faqIcon} aria-hidden="true">+</span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                  style={{ overflow: "hidden" }}
                >
                  <p className={s.faqAnswer}>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Final CTA: the visitor picks their country and the form opens pre-filled. */
export function FinalCta() {
  return (
    <section className={s.finalCta}>
      <div className={s.wrap}>
        <Reveal className={s.finalGlass}>
          <p className={s.finalKicker}>Trusted legal support for your life abroad</p>
          <RevealTitle text="Your legal life abroad, organized." className={s.finalTitle} />
          <p className={s.finalSub}>Pick your country. We open your free check with it already selected.</p>
          <div className={s.finalChips}>
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                className={s.chip}
                onClick={() => openLeadForm({ country: c.code, topic: c.note })}
              >
                {c.name}
              </button>
            ))}
          </div>
          <p className={s.finalHint}>Free for one country. No card required.</p>
        </Reveal>
      </div>
    </section>
  );
}
