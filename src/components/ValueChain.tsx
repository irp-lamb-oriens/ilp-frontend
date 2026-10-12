"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RevealTitle } from "@/components/motion/Motion";
import s from "./ValueChain.module.scss";

interface ValueStage {
  title: string;
  subtitle: string;
  items: string[];
}

const STAGES: ValueStage[] = [
  {
    title: "Bring",
    subtitle: "Marketing & Client Acquisition",
    items: [
      "Pre-Screened International Client Inflow",
      "Specialty Match & Jurisdiction Routing",
      "Network Authority & Channel Exposure",
    ],
  },
  {
    title: "Organize",
    subtitle: "Administration & Context",
    items: [
      "1-Page Pre-Consultation Client Briefs",
      "Automated Calendar & Time-Zone Booking",
      "AI Call Transcription & Structured Summaries",
      "Living Client Legal Profile & Document Vault Access",
    ],
  },
  {
    title: "Nurture & Retain",
    subtitle: "Commercial Management",
    items: [
      "Dedicated Customer Success Manager (CSM) Sales Support",
      "Post-Consultation Proposal & Scope Closing",
      "Long-Term Client Relationship Management",
    ],
  },
  {
    title: "Reactivate",
    subtitle: "Automated Compliance Engine",
    items: [
      "Smart Compliance Milestone Alerts (DIMEX, Corporate Tax, Marchamo, Property Tax)",
      "Automated Client Re-Engagement Triggers",
    ],
  },
  {
    title: "Business Infrastructure",
    subtitle: "Billing & Protection",
    items: [
      "Automated Platform Invoicing & Payment Collection",
      "Structured Project Fee Payouts",
      "Planned Professional Liability Protection Layer",
      "ILP Quality & Reputation Awards System",
    ],
  },
];

/**
 * The lawyer value chain, rendered as a zig-zag. Each stage alternates left
 * and right so the eye travels down the reading diagonal. The "No more" tag
 * drops in on scroll, then the sub-items stagger beneath it.
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
                No more
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
