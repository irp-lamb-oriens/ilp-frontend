"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal, RevealTitle, EASE_OUT_EXPO } from "@/components/motion/Motion";
import { openLeadForm } from "@/lib/leadEvents";
import { COUNTRIES, QUOTES, PLANS, ADDONS, FAQ } from "./content";
import s from "./landing.module.scss";

const ALIGN = ["alignStart", "alignEnd", "alignCenter"] as const;
const COUNTRY_PAGES: Record<string, string> = {
  CR: "/costa-rica",
  PA: "/panama",
  MX: "/mexico",
  ES: "/spain",
  PT: "/portugal",
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
        <RevealTitle text="Live in five countries." className={s.headingXl} />
      </div>
      <ul className={s.coverage}>
        {COUNTRIES.map((c, i) => {
          const align = ALIGN[i % ALIGN.length];
          const from = align === "alignEnd" ? "right" : align === "alignStart" ? "left" : "bottom";
          const href = c.live ? COUNTRY_PAGES[c.code] : undefined;
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

/** Membership pricing: three tiers, flagship highlighted, with add-ons below. */
export function Pricing() {
  return (
    <section className={`${s.wrap} ${s.section}`} id="pricing">
      <div className={`${s.sectionHead} ${s.centerHead}`}>
        <p className={s.eyebrow}>Membership</p>
        <RevealTitle text="Three plans. Real professionals. Ongoing support." className={s.headingXl} />
      </div>

      <div className={s.plansGrid}>
        {PLANS.map((plan, i) => (
          <Reveal
            key={plan.id}
            className={`${s.planCard} ${plan.highlight ? s.planHighlight : ""}`}
            delay={i * 0.1}
          >
            <div className={s.planTagline}>{plan.tagline}</div>
            <div className={s.planName}>{plan.name}</div>
            <div className={s.planPrice}>
              {plan.price}
              <span className={s.planUnit}>{plan.unit}</span>
            </div>
            <div className={s.planPerDay}>{plan.activation}</div>

            <div className={s.allowance}>
              <strong>{plan.allowance}</strong>
              <span>{plan.allowanceDetail}</span>
            </div>

            <ul className={s.planFeatures}>
              {plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>

            <button
              type="button"
              className={plan.highlight ? s.primary : s.ghost}
              onClick={() => openLeadForm({ topic: plan.topic })}
            >
              {plan.cta}
            </button>
          </Reveal>
        ))}
      </div>

      <div className={s.addons}>
        {ADDONS.map((a, i) => (
          <Reveal key={a.title} className={s.addon} delay={i * 0.1}>
            <h3>{a.title}</h3>
            <p>{a.body}</p>
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
          <p className={s.finalSub}>Pick your country. We open your membership check with it already selected.</p>
          <div className={s.finalChips}>
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                className={c.live ? s.chip : `${s.chip} ${s.chipSoon}`}
                onClick={() => c.live && openLeadForm({ country: c.code, topic: c.note })}
              >
                {c.name}
                {!c.live && <span className={s.chipSoonTag}>Soon</span>}
              </button>
            ))}
          </div>
          <p className={s.finalHint}>Plans from $0. Core Membership is $79.99 a month plus a one-time $100 activation.</p>
        </Reveal>
      </div>
    </section>
  );
}
