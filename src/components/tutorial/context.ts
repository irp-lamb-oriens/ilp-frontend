"use client";

import { createContext, useContext } from "react";
import type { TutorialRegistry } from "./registry";
import type { Scene, Tutorial, TutorialRole } from "./types";

export type CloseReason = "done" | "skip";

export interface ActiveTutorial {
  tutorial: Tutorial;
  step: number;
  /** Started by the first-visit rule (not by the viewer). */
  auto: boolean;
  /** One-off scene (startScene): not in the registry, never stored as seen. */
  adhoc?: boolean;
}

export interface TutorialApi {
  /** Null until the configs load (they load on first use). */
  registry: TutorialRegistry | null;
  active: ActiveTutorial | null;
  /** Loads the configs if needed, then opens the tutorial. */
  start(id: string, opts?: { step?: number; stepId?: string; auto?: boolean }): Promise<boolean>;
  /**
   * Play one mock scene in the tutorial modal, outside any tutorial (a
   * Notice's "Show me"). Nothing is stored as seen.
   */
  startScene(scene: Scene, title: string, body?: string): void;
  next(): void;
  back(): void;
  goTo(step: number): void;
  /** "done" on the last step; "skip" otherwise. dontShow marks it dismissed. */
  close(reason?: CloseReason, dontShow?: boolean): void;
  isSeen(id: string): boolean;
  /** First-visit rule for this id (store state, viewer preference, session skips). */
  shouldAutoStart(id: string): boolean;
  reset(id?: string): void;
  autoStartEnabled: boolean;
  setAutoStartEnabled(on: boolean): void;
  /** Make sure the configs are loaded (HelpButton, auto-start). */
  ensureLoaded(): Promise<TutorialRegistry>;
  /** Open the "Tutorials" list for a role (user menu). */
  openList(role: TutorialRole): void;
  /** Highlight a data-tour target on the live page, with the step's text. */
  spotlight(target: string): void;
}

export const TutorialContext = createContext<TutorialApi | null>(null);

/** The tutorial API. Throws outside <TutorialProvider>. */
export function useTutorial(): TutorialApi {
  const v = useContext(TutorialContext);
  if (!v) throw new Error("useTutorial() needs <TutorialProvider> in the root layout");
  return v;
}

/** Same, or null when there is no provider (embedded shells, tests). */
export function useTutorialOptional(): TutorialApi | null {
  return useContext(TutorialContext);
}
