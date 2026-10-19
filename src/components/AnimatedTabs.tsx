"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import styles from "./tabs.module.scss";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
}

/**
 * Reusable animated tab group.
 *
 * - A sliding pill indicator animates between tabs (framer-motion layoutId).
 * - Panels are stacked in a single grid cell and cross-fade + slide on switch,
 *   so each panel keeps its own state (no unmount/remount, no re-fetch).
 * - Inactive panels are inert (not focusable, not clickable) and hidden from
 *   assistive tech.
 */
export default function AnimatedTabs({ tabs, defaultTab }: AnimatedTabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");
  const indicatorId = useId();

  return (
    <div className={styles.wrap}>
      <div className={styles.bar} role="tablist" aria-label="Sections">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => setActive(t.id)}
            >
              {isActive && (
                <motion.span
                  layoutId={indicatorId}
                  className={styles.indicator}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className={styles.tabLabel}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.panels}>
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <motion.div
              key={t.id}
              className={styles.panel}
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                y: isActive ? 0 : 12,
                scale: isActive ? 1 : 0.995,
              }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{ pointerEvents: isActive ? "auto" : "none" }}
              aria-hidden={!isActive}
              inert={!isActive}
            >
              {t.content}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}