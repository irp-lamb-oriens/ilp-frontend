"use client";

import { Reveal } from "@/components/motion/Motion";
import s from "./landing.module.scss";

const ITEMS = [
  { value: "5 countries, one profile", label: "Costa Rica, Panama, Mexico, Spain, Portugal" },
  { value: "Lawyer-maintained rules", label: "Reviewed by local legal teams" },
  { value: "Before the due date", label: "Advance + deadline-day reminders" },
];

/**
 * First beat after the hero: a dark proof strip whose stats stagger up the
 * moment it enters, so there is no empty scroll between the hero and the
 * signature morph. Uses a gentle reduce delay on mobile.
 */
export default function TrustStrip() {
  return (
    <section className={s.trustBar} aria-label="At a glance">
      <div className={s.trustInner}>
        <div className={s.trustStats}>
          {ITEMS.map((it, i) => (
            <Reveal key={it.value} className={s.stat} delay={i * 0.09}>
              <span className={s.statValue}>{it.value}</span>
              <span className={s.statLabel}>{it.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}