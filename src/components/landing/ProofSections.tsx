"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/components/motion/Motion";
import { Eyebrow, RevealText, Stage, StageItem } from "@/components/motion/Story";
import PriceAnchor from "@/components/motion/PriceAnchor";
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

const COUNTRY_PAGES: Record<string, string> = {
  CO: "/colombia",
  CR: "/costa-rica",
  PA: "/panama",
  MX: "/mexico",
  ES: "/spain",
  PT: "/portugal",
};

/**
 * Coverage, as an index: one row per country (code, name, what the check
 * covers there, status), each row a link to the country page. It replaced a
 * zig-zag of six full-width rows that took about 2,200px of scroll for six
 * facts; the index reads in one screen. Each row stages in: code, name, note,
 * status. On pointer devices the hovered row tints and its arrow moves 4px.
 */
export function CoverageGutenberg() {
  return (
    <section id="countries" className={`${s.wrap} ${s.section}`} aria-labelledby="coverage-title">
      <SectionHead id="coverage-title" title={COVERAGE_HEAD.title} why={COVERAGE_HEAD.why} mark={COVERAGE_HEAD.mark} icon="globe" />
      <ul className={s.coverageIndex}>
        {COUNTRIES.map((c, i) => {
          const href = COUNTRY_PAGES[c.code];
          const inner = (
            <>
              <Eyebrow className={s.idxCode}>{c.code}</Eyebrow>
              <StageItem level="title" className={s.idxName}>
                {c.name}
              </StageItem>
              <StageItem level="body" className={s.idxNote}>
                {c.note}
              </StageItem>
              <StageItem level="eyebrow" className={s.idxEnd}>
                <span className={cx(s.coverageStatus, c.live && s.coverageOpen)}>{c.status}</span>
                {href && (
                  <svg className={s.idxArrow} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 10h11M11 5.5 15.5 10 11 14.5" />
                  </svg>
                )}
              </StageItem>
            </>
          );
          return (
            <li key={c.code} className={cx(!c.live && s.coverageLater)}>
              <Stage className={s.idxStage} amount={0.6} stagger={0.06} delay={i * 0.04}>
                {href ? (
                  <Link href={href} className={s.idxRow} aria-label={`${c.name}: ${c.status}. ${c.note}`}>
                    {inner}
                  </Link>
                ) : (
                  <div className={s.idxRow}>{inner}</div>
                )}
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

/**
 * Pricing: the free check and the one membership, with extra legal work
 * below. Each plan card rises, then its tagline (eyebrow), name, price (the
 * membership shows the PriceAnchor comparison), allowance and list.
 */
export function Pricing() {
  return (
    <section className={`${s.wrap} ${s.section}`} id="pricing" aria-labelledby="pricing-title">
      <SectionHead id="pricing-title" title={PRICING_HEAD.title} why={PRICING_HEAD.why} mark={PRICING_HEAD.mark} icon="price" />

      <div className={`${s.plansGrid} ${PLANS.length === 2 ? s.plansTwo : ""}`}>
        {PLANS.map((plan, i) => {
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
              {plan.highlight && priceValue(plan.price) !== null ? (
                <StageItem level="title">
                  <PriceAnchor size="md" />
                </StageItem>
              ) : (
                <StageItem level="title" className={s.planPrice}>
                  {plan.price}
                  {plan.unit && <span className={s.planUnit}> {plan.unit}</span>}
                </StageItem>
              )}
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
              {/* Every answer is in the server HTML (search engines and the
                  FAQPage data read it); closed answers are hidden, not removed. */}
              <motion.div
                id={panelId}
                hidden={open !== i}
                initial={false}
                animate={open === i ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              >
                <p className={s.faqAnswer}>{item.a}</p>
              </motion.div>
            </StageItem>
          );
        })}
      </Stage>
    </section>
  );
}

/**
 * Final call to action, as a split: the ask on the left (title, why, the one
 * button, the price line), and on the right the country picker built like
 * the hero ledger (HeroLedger.tsx): a mono label, hairline rows, one link per
 * country. The page opens and closes on the same object.
 */
export function FinalCta() {
  return (
    <section id="free-deadline-check" className={s.finalCta} aria-labelledby="final-title">
      <div className={cx(s.wrap, s.finalSplit)}>
        <Stage className={s.finalAsk} enter="visual" stagger={0.1} amount={0.4}>
          <StageItem as="h2" level="title" id="final-title" className={s.finalTitle}>
            {FINAL.title}
          </StageItem>
          <RevealText text={FINAL.sub} mark={FINAL.mark} className={s.finalSub} />
          <StageItem level="body">
            <Link href="/check" className={s.primary}>
              {CHECK_CTA}
            </Link>
          </StageItem>
          <StageItem as="p" level="body" className={s.finalHint}>
            {FINAL.hint}
          </StageItem>
        </Stage>
        <Stage className={s.finalPicker} enter="visual" stagger={0.06} amount={0.3} delay={0.15}>
          <StageItem level="eyebrow" className={s.pickerHead}>
            <h3 className={s.pickerLabel}>{FINAL.pick}</h3>
            <span className={s.pickerContext}>{COUNTRIES.filter((c) => c.live).length} open</span>
          </StageItem>
          <ul className={s.pickerRows}>
            {COUNTRIES.map((c) => (
              <StageItem as="li" level="body" key={c.code}>
                {c.live ? (
                  <Link href={`/check?country=${c.code}`} className={s.pickerRow}>
                    <span className={s.pickerCode}>{c.code}</span>
                    <span className={s.pickerName}>{c.name}</span>
                    <svg className={s.idxArrow} width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" />
                    </svg>
                  </Link>
                ) : (
                  <span className={cx(s.pickerRow, s.pickerSoon)} aria-disabled="true">
                    <span className={s.pickerCode}>{c.code}</span>
                    <span className={s.pickerName}>{c.name}</span>
                    <span className={s.coverageStatus}>{FINAL.soon}</span>
                  </span>
                )}
              </StageItem>
            ))}
          </ul>
        </Stage>
      </div>
    </section>
  );
}
