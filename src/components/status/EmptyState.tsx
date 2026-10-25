"use client";

import { type ReactNode } from "react";
import s from "./emptyState.module.scss";

interface EmptyStateProps {
  title: string;
  explain: string;
  steps: string[];
  children?: ReactNode;
}

/**
 * Empty-state card: explains what will appear, shows a ghost preview of the
 * example markup, and lists a short tutorial. Replaces the bare "No X yet"
 * lines across the status portal.
 */
export default function EmptyState({ title, explain, steps, children }: EmptyStateProps) {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyStateHead}>
        <h3 className={s.emptyStateTitle}>{title}</h3>
        <p className={s.emptyStateExplain}>{explain}</p>
      </div>

      {children && (
        <div className={s.emptyStatePreview} aria-hidden="true">
          {children}
        </div>
      )}

      <ol className={s.emptyStateSteps}>
        {steps.map((step, i) => (
          <li key={i} className={s.emptyStateStep}>
            <span className={s.emptyStateStepNum}>{i + 1}</span>
            <span className={s.emptyStateStepText}>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}