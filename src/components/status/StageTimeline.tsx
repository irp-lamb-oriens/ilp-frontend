"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_OUT_QUART } from "@/components/motion/Motion";
import type { StageDetail } from "@/lib/status";
import styles from "./stageTimeline.module.scss";

interface StageRatingValue {
  rating: 1 | 2 | 3 | 4 | 5;
}

interface StageTimelineProps {
  stages: string[];
  stageLabels: Array<{ id: string; label: string }>;
  stageDetails?: StageDetail[];
  currentStage: string;
  stageRatings: Record<string, StageRatingValue>;
  viewerIsPrincipal: boolean;
  ratingBusy: string | null;
  onRate: (stageKey: string, rating: number) => void;
}

/**
 * Vertical docket timeline for the client status portal. Each stage carries a
 * description drawn from the admin stage config; clicking a stage toggles the
 * description open (drop-down) and accordion-closes the others.
 */
export default function StageTimeline({
  stages,
  stageLabels,
  stageDetails = [],
  currentStage,
  stageRatings,
  viewerIsPrincipal,
  ratingBusy,
  onRate,
}: StageTimelineProps) {
  const currentIdx = stages.indexOf(currentStage);
  const label = (id: string) => stageLabels.find((l) => l.id === id)?.label ?? id;
  const description = (id: string) => stageDetails.find((d) => d.id === id)?.description ?? "";
  const progress = currentIdx < 0 ? 0 : (currentIdx / Math.max(1, stages.length - 1)) * 100;

  const [openStage, setOpenStage] = useState<string | null>(null);

  return (
    <div className={styles.timeline}>
      <div className={styles.railTrack}>
        <motion.div
          className={styles.railFill}
          initial={{ height: 0 }}
          animate={{ height: `${progress}%` }}
          transition={{ duration: 0.8, ease: EASE_OUT_QUART }}
        />
      </div>

      <div className={styles.steps}>
        {stages.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const existing = stageRatings[stage];
          const desc = description(stage);
          const isOpen = openStage === stage;
          const cls = [
            styles.step,
            active ? styles.stepActive : "",
            done ? styles.stepDone : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={stage} className={cls}>
              <button
                type="button"
                className={styles.stepToggle}
                onClick={() => setOpenStage(isOpen ? null : stage)}
                aria-expanded={isOpen}
              >
                <span className={styles.marker}>
                  {done ? "✓" : active ? "•" : i + 1}
                </span>
                <span className={styles.stepLabel}>{label(stage)}</span>
                {desc && (
                  <span className={styles.chevron} aria-hidden="true">
                    {isOpen ? "▾" : "▸"}
                  </span>
                )}
              </button>

              {viewerIsPrincipal && (done || active) && (
                <span className={styles.stars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.star} ${
                        existing && existing.rating >= n ? styles.starFilled : ""
                      }`}
                      onClick={() => onRate(stage, n)}
                      disabled={ratingBusy === stage}
                      aria-label={`Rate ${label(stage)} ${n} stars`}
                    >
                      ★
                    </button>
                  ))}
                </span>
              )}

              <AnimatePresence initial={false}>
                {isOpen && desc && (
                  <motion.div
                    key="desc"
                    className={styles.stageDesc}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
                  >
                    <p className={styles.stageDescText}>{desc}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}