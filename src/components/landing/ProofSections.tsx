"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal, EASE_OUT_EXPO } from "@/components/motion/Motion";
import {
  COUNTRIES,
  COVERAGE_HEAD,
  SCENARIOS,
  SCENARIOS_HEAD,
  PLANS,
  PRICING_HEAD,
  ADDONS,
  FAQ,
  FAQ_HEAD,
  FINAL,
  CHECK_CTA,
} from "./content";
import { SectionHead } from "./SectionHead";
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
 * Coverage: each country row takes the justification opposite to the row
 * above it (Gutenberg zig-zag). Costa Rica is open; the others say plainly
 * that they are not available yet.
 */
export function CoverageGutenberg() {
  return (
    <section className={`${s.wrap} ${s.section}`} aria-label={COVERAGE_HEAD.title}>
      <SectionHead title={COVERAGE_HEAD.title} why={COVERAGE_HEAD.why} icon="globe" />
      <ul className={s.coverage}>
        {COUNTRIES.map((c, i) => {
          const align = ALIGN[i % ALIGN.length];
          const from = align === "alignEnd" ? "right" : align === "alignStart" ? "left" : "bottom";
          const href = COUNTRY_PAGES[c.code];
          return (
            <li key={c.code} className={`${s.coverageRow} ${s[align]} ${c.live ? "" : s.coverageLater}`}>
              <Reveal from={from}>
                <span className={s.coverageCode}>{c.code}</span>
                {href ? (
                  <Link href={href} className={s.coverageName}>{c.name}</Link>
                ) : (
                  <span className={s.coverageName}>{c.name}</span>
                )}
                <span className={c.live ? `${s.coverageStatus} ${s.coverageOpen}` : s.coverageStatus}>{c.status}</span>
                <p className={s.coverageNote}>{c.note}</p>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Example situations in an offset wall. These replaced three quotes from
 * named people who were not real members: every card is labelled "Example".
 */
export function QuotesWall() {
  return (
    <section className={`${s.wrap} ${s.section}`} aria-label={SCENARIOS_HEAD.title}>
      <SectionHead title={SCENARIOS_HEAD.title} why={SCENARIOS_HEAD.why} icon="example" />
      <div className={s.quoteWall}>
        {SCENARIOS.map((sc, i) => (
          <Reveal key={sc.title} className={s.quote} delay={i * 0.12}>
            <p className={s.scenarioTags}>
              <span className={s.scenarioLabel}>{SCENARIOS_HEAD.label}</span>
              <span className={s.scenarioTag}>{sc.tag}</span>
            </p>
            <h3 className={s.scenarioTitle}>{sc.title}</h3>
            <p className={s.scenarioBody}>{sc.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Pricing: the free check and the one membership, with extra legal work below. */
export function Pricing() {
  return (
    <section className={`${s.wrap} ${s.section}`} id="pricing" aria-label={PRICING_HEAD.title}>
      <SectionHead title={PRICING_HEAD.title} why={PRICING_HEAD.why} icon="price" />

      <div className={`${s.plansGrid} ${PLANS.length === 2 ? s.plansTwo : ""}`}>
        {PLANS.map((plan, i) => (
          <Reveal
            key={plan.id}
            className={`${s.planCard} ${plan.highlight ? s.planHighlight : ""}`}
            delay={i * 0.1}
          >
            <div className={s.planTagline}>{plan.tagline}</div>
            <h3 className={s.planName}>{plan.name}</h3>
            <div className={s.planPrice}>
              {plan.price}
              {plan.unit && <span className={s.planUnit}> {plan.unit}</span>}
            </div>
            <div className={s.planPerDay}>{plan.activation}</div>

            <div className={s.allowance}>
              <strong>{plan.allowance}</strong>
              <span>{plan.allowanceDetail}</span>
            </div>

            <ul className={s.planFeatures}>
              {plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>

            <Link href={plan.href} className={plan.highlight ? s.primary : s.ghost}>
              {plan.cta}
            </Link>
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
  const uid = useId();
  return (
    <section className={`${s.wrap} ${s.sticky}`} aria-label={FAQ_HEAD.title}>
      <div className={s.stickyHead}>
        <SectionHead title={FAQ_HEAD.title} why={FAQ_HEAD.why} icon="question" />
      </div>
      <div className={s.faqList}>
        {FAQ.map((item, i) => {
          const panelId = `${uid}-faq-${i}`;
          return (
            <div key={item.q} className={s.faqItem}>
              <h3 className={s.faqHeading}>
                <button
                  type="button"
                  className={s.faqButton}
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  aria-controls={panelId}
                >
                  {item.q}
                  <span className={open === i ? `${s.faqIcon} ${s.faqIconOpen}` : s.faqIcon} aria-hidden="true">+</span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    id={panelId}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  >
                    <p className={s.faqAnswer}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Final call to action: the free check, with the countries that are open. */
export function FinalCta() {
  return (
    <section className={s.finalCta} aria-label={FINAL.title}>
      <div className={s.wrap}>
        <Reveal className={s.finalGlass}>
          <h2 className={s.finalTitle}>{FINAL.title}</h2>
          <p className={s.finalSub}>{FINAL.sub}</p>
          <p className={s.finalPick}>{FINAL.pick}</p>
          <div className={s.finalChips}>
            {COUNTRIES.map((c) =>
              c.live ? (
                <Link key={c.code} href="/check" className={s.chip}>
                  {c.name}
                </Link>
              ) : (
                <span key={c.code} className={`${s.chip} ${s.chipSoon}`} aria-disabled="true">
                  {c.name}
                  <span className={s.chipSoonTag}>{FINAL.soon}</span>
                </span>
              ),
            )}
          </div>
          <Link href="/check" className={s.primary}>
            {CHECK_CTA}
          </Link>
          <p className={s.finalHint}>{FINAL.hint}</p>
        </Reveal>
      </div>
    </section>
  );
}
