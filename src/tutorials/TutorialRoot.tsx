"use client";

/**
 * Mounts the tutorial engine for the whole app. The configs load on first
 * use (a role shell or the /ui gallery asks for them), so marketing pages
 * never download them.
 */
import type { ReactNode } from "react";
import { TutorialProvider } from "@/components/tutorial/TutorialProvider";

const loadTutorials = () => import("./index").then((m) => m.ALL_TUTORIALS);

export default function TutorialRoot({ children }: { children: ReactNode }) {
  return <TutorialProvider load={loadTutorials}>{children}</TutorialProvider>;
}
