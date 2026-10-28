"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/components/motion/Motion";
import { Eyebrow, Mark, RevealText, Stage, StageItem } from "@/components/motion/Story";
import CountUp from "@/components/motion/CountUp";
import { cx } from "@/components/ui/cx";
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
  CO: "/colombia",
  CR: "/costa-rica",
  PA: "/panama",
  MX: "/mexico",
  ES: "/spain",
  PT: "/portugal",
};

/**
 * Coverage: each country row takes the justification opposite to the row
 * above it (Gutenberg zig-zag). Each row stages in: the country code as an
 * eyebrow, the name, the status, then the note.
 */
export function CoverageGutenberg() {
  return (
    <section className={`${s.wrap} ${s.section}`} aria-labelledby="coverage-title">
      <SectionHead id="coverage-title" title={COVERAGE_HEAD.title} why={COVERAGE_HEAD.why} mark={COVERAGE_HEAD.mark} icon="globe" />
      <ul className={s.coverage}>
        {COUNTRIES.map((c, i) => {
          const align = ALIGN[i % ALIGN.length];
          const href = COUNTRY_PAGES[c.code];
          return (
            <li key={c.code} className={cx(s.coverageRow, s[align], !c.live && s.coverageLater)}>
              <Stage className={s.coverageBody} amount={0.5} stagger={0.1}>
                <Eyebrow className={s.coverageCode}>{c.code}</Eyebrow>
                <StageItem level="title">
                  {href ? (
                    <Link href={href} className={s.coverageName}>{c.name}</Link>
                  ) : (
                    <span className={s.coverageName}>{c.name}</span>
                  )}
                </StageItem>
                <StageItem level="eyebrow">
                  <span className={c.live ? `${s.coverageStatus} ${s.coverageOpen}` : s.coverageStatus}>{c.status}</span>
                </StageItem>
                <RevealText text={c.note} className={s.coverageNote} />
              </Stage>
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
 * Each card rises, then its labels, title and body stage in.
 */
export function QuotesWall() {
  return (
    <section className={`${s.wrap} ${s.section}`} aria-labelledby="scenarios-title">
      <SectionHead id="scenarios-title" title={SCENARIOS_HEAD.title} why={SCENARIOS_HEAD.why} mark={SCENARIOS_HEAD.mark} icon="example" />
      <div className={s.quoteWall}>
        {SCENARIOS.map((sc, i) => (
          <Stage key={sc.title} className={s.quote} enter="visual" delay={i * 0.1} amount={0.35}>
            <StageItem level="eyebrow" as="p" className={s.scenarioTags}>
              <span className={s.scenarioLabel}>{SCENARIOS_HEAD.label}</span>
              <span className={s.scenarioTag}>{sc.tag}</span>
            </StageItem>
            <StageItem as="h3" level="title" className={s.scenarioTitle}>
              {sc.title}
            </StageItem>
            <RevealText text={sc.body} className={s.scenarioBody} />
          </Stage>
        ))}
      </div>
    </section>
  );
}

/** "US$79.99" -> 79.99; null for a free plan or a price that is not a figure. */
function priceValue(price: string): number | null {
  const v = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(v) && v > 0 ? v : null;
}

const formatUsd = (v: number) => `US$${v.toFixed(2)}`;

/**
 * Pricing: the free check and the one membership, with extra legal work
 * below. Each plan card rises, then its tagline (eyebrow), name, price (the
 * membership figure counts up and is underlined), allowance and list.
 */
export function Pricing() {
  return (
    <section className={`${s.wrap} ${s.section}`} id="pricing" aria-labelledby="pricing-title">
      <SectionHead id="pricing-title" title={PRICING_HEAD.title} why={PRICING_HEAD.why} mark={PRICING_HEAD.mark} icon="price" />

      <div className={`${s.plansGrid} ${PLANS.length === 2 ? s.plansTwo : ""}`}>
        {PLANS.map((plan, i) => {
          const value = priceValue(plan.price);
          return (
            <Stage
              key={plan.id}
              className={`${s.planCard} ${plan.highlight ? s.planHighlight : ""}`}
              enter="visual"
              delay={i * 0.12}
              stagger={0.08}
              amount={0.25}
            >
              <Eyebrow className={s.planTagline}>{plan.tagline}</Eyebrow>
              <StageItem as="h3" level="title" className={s.planName}>
                {plan.name}
              </StageItem>
              <StageItem level="title" className={s.planPrice}>
                {value !== null && plan.highlight ? (
                  <Mark className={s.priceMark}>
                    <CountUp value={value} formatter={formatUsd} duration={0.9} />
                  </Mark>
                ) : (
                  plan.price
                )}
                {plan.unit && <span className={s.planUnit}> {plan.unit}</span>}
              </StageItem>
              <StageItem level="body" className={s.planPerDay}>
                {plan.activation}
              </StageItem>

              <StageItem level="body" className={s.allowance}>
                <strong>{plan.allowance}</strong>
                <span>{plan.allowanceDetail}</span>
              </StageItem>

              <ul className={s.planFeatures}>
                {plan.features.map((f) => (
                  <StageItem as="li" level="body" key={f}>
                    {f}
                  </StageItem>
                ))}
              </ul>

              <StageItem level="body" className={s.planAction}>
                <Link href={plan.href} className={plan.highlight ? s.primary : s.ghost}>
                  {plan.cta}
                </Link>
              </StageItem>
            </Stage>
          );
        })}
      </div>

      <div className={s.addons}>
        {ADDONS.map((a, i) => (
          <Stage key={a.title} className={s.addon} enter="visual" delay={i * 0.1}>
            <StageItem as="h3" level="title">
              {a.title}
            </StageItem>
            <RevealText text={a.body} className={s.addonBody} />
          </Stage>
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
    <section className={`${s.wrap} ${s.sticky}`} aria-labelledby="faq-title">
      <div className={s.stickyHead}>
        <SectionHead id="faq-title" title={FAQ_HEAD.title} why={FAQ_HEAD.why} mark={FAQ_HEAD.mark} icon="question" />
      </div>
      <Stage className={s.faqList} stagger={0.06} amount={0.15}>
        {FAQ.map((item, i) => {
          const panelId = `${uid}-faq-${i}`;
          return (
            <StageItem key={item.q} level="body" className={s.faqItem}>
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
            </StageItem>
          );
        })}
      </Stage>
    </section>
  );
}

/** Final call to action: the free check, with the countries that are open. */
export function FinalCta() {
  return (
    <section className={s.finalCta} aria-labelledby="final-title">
      <div className={s.wrap}>
        <Stage className={s.finalGlass} enter="visual" stagger={0.1} amount={0.4}>
          <StageItem as="h2" level="title" id="final-title" className={s.finalTitle}>
            {FINAL.title}
          </StageItem>
          <RevealText text={FINAL.sub} mark={FINAL.mark} className={s.finalSub} />
          <Eyebrow className={s.finalPick}>{FINAL.pick}</Eyebrow>
          <StageItem level="body" className={s.finalChips}>
            {COUNTRIES.map((c) =>
              c.live ? (
                <Link key={c.code} href={`/check?country=${c.code}`} className={s.chip}>
                  {c.name}
                </Link>
              ) : (
                <span key={c.code} className={`${s.chip} ${s.chipSoon}`} aria-disabled="true">
                  {c.name}
                  <span className={s.chipSoonTag}>{FINAL.soon}</span>
                </span>
              ),
            )}
          </StageItem>
          <StageItem level="body">
            <Link href="/check" className={s.primary}>
              {CHECK_CTA}
            </Link>
          </StageItem>
          <StageItem as="p" level="body" className={s.finalHint}>
            {FINAL.hint}
          </StageItem>
        </Stage>
      </div>
    </section>
  );
}
