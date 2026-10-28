"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RevealTitle } from "@/components/motion/Motion";
import s from "./ValueChain.module.scss";

interface ValueStage {
  title: string;
  subtitle: string;
  /** Who does the work in this stage, shown as the tag. */
  tag: string;
  items: string[];
}

/**
 * What happens around one member call, in order (T2 rewrite: sentence case,
 * only facts from docs/PLAN.md and the lawyer portal).
 */
const STAGES: ValueStage[] = [
  {
    title: "Members book you",
    subtitle: "Calls inside your hours",
    tag: "ILP does this",
    items: [
      "Members are mostly North Americans living in your country or owning property there",
      "Their membership includes up to three 20-minute video calls a month",
      "They book inside the weekly hours you set, matched by legal area",
    ],
  },
  {
    title: "Each call is prepared",
    subtitle: "The brief",
    tag: "ILP does this",
    items: [
      "A one-screen brief before every call",
      "The member's question, written in their own words when they booked",
      "Facts from their legal profile: residency, property, companies, vehicles, family",
      "Legal dates coming up in the next 60 days",
    ],
  },
  {
    title: "You give your advice",
    subtitle: "The call",
    tag: "You do this",
    items: [
      "A 20-minute video call on Google Meet",
      "Recording only when the member agrees",
      "An AI-suggested summary that you correct and confirm",
    ],
  },
  {
    title: "The follow-up is handled",
    subtitle: "After the call",
    tag: "ILP does this",
    items: [
      "Your confirmed next steps go to the member and their customer success manager",
      "The customer success manager sends reminders and chases documents",
      "Work beyond the call is quoted separately, and the member accepts before it starts",
    ],
  },
  {
    title: "Your fees are tracked",
    subtitle: "Finance",
    tag: "In your portal",
    items: [
      "Your own fees for paid work, per matter",
      "What has been paid to you and what is pending, with payout dates",
      "How fees are set and paid is in the partner terms (draft, pending review by ILP's counsel)",
    ],
  },
];

/**
 * The lawyer value chain, rendered as a zig-zag. Each stage alternates left
 * and right so the eye travels down the reading diagonal. The tag (who does
 * the work) drops in on scroll, then the sub-items stagger beneath it.
 */
export default function ValueChain() {
  const reduce = useReducedMotion();

  return (
    <ol className={s.chain}>
      {STAGES.map((stage, i) => {
        const side = i % 2 === 0 ? "left" : "right";
        return (
          <li key={stage.title} className={`${s.stage} ${s[side]}`}>
            <div className={s.stageCard}>
              <div className={s.stageHead}>
                <span className={s.stageIndex}>{String(i + 1).padStart(2, "0")}</span>
                <RevealTitle as="h3" text={stage.title} className={s.stageTitle} />
                <span className={s.stageSubtitle}>{stage.subtitle}</span>
              </div>

              <motion.span
                className={s.noMore}
                initial={reduce ? false : { y: -24, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {stage.tag}
              </motion.span>

              <ul className={s.items}>
                {stage.items.map((item, j) => (
                  <motion.li
                    key={item}
                    className={s.item}
                    initial={reduce ? false : { y: 16, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1],
                      delay: j * 0.08,
                    }}
                  >
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
