"use client";

import { motion } from "framer-motion";
import { EASE_OUT_QUART } from "@/components/motion/Motion";
import styles from "./stageTimeline.module.scss";

interface StageRatingValue {
  rating: 1 | 2 | 3 | 4 | 5;
}

interface StageTimelineProps {
  stages: string[];
  stageLabels: Array<{ id: string; label: string }>;
  currentStage: string;
  stageRatings: Record<string, StageRatingValue>;
  viewerIsPrincipal: boolean;
  ratingBusy: string | null;
  onRate: (stageKey: string, rating: number) => void;
}

/**
 * Vertical docket timeline for the client status portal. Stages descend in
 * order with a connecting rail; completed stages are checked, the active stage
 * is highlighted, and upcoming stages sit dimmed. Principal viewers may rate
 * completed and active stages inline.
 */
export default function StageTimeline({
  stages,
  stageLabels,
  currentStage,
  stageRatings,
  viewerIsPrincipal,
  ratingBusy,
  onRate,
}: StageTimelineProps) {
  const currentIdx = stages.indexOf(currentStage);
  const label = (id: string) => stageLabels.find((l) => l.id === id)?.label ?? id;
  const progress = currentIdx < 0 ? 0 : (currentIdx / Math.max(1, stages.length - 1)) * 100;

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
          const cls = [
            styles.step,
            active ? styles.stepActive : "",
            done ? styles.stepDone : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={stage} className={cls}>
              <span className={styles.marker}>
                {done ? "✓" : active ? "•" : i + 1}
              </span>
              <span className={styles.stepLabel}>{label(stage)}</span>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

