"use client";

import { Reveal } from "@/components/motion/Motion";
import { TRUST } from "./content";
import s from "./landing.module.scss";

/**
 * First beat after the hero: three plain facts about the offer (the free
 * check, the price, the calls). Only facts from docs/PLAN.md, no counts or
 * ratings.
 */
export default function TrustStrip() {
  return (
    <section className={s.trustBar} aria-label="ILP at a glance">
      <div className={s.trustInner}>
        <ul className={s.trustStats}>
          {TRUST.map((it, i) => (
            <li key={it.value}>
              <Reveal className={s.stat} delay={i * 0.09}>
                <span className={s.statValue}>{it.value}</span>
                <span className={s.statLabel}>{it.label}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
