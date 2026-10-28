"use client";

/**
 * Mounts the tutorial engine for the whole app. The configs load on first
 * use (a role shell or the /ui gallery asks for them), so marketing pages
 * never download them. Public tutorials load on their own and need no
 * session, so a marketing page can play one inline.
 */
import type { ReactNode } from "react";
import { TutorialProvider } from "@/components/tutorial/TutorialProvider";

const loadTutorials = () =>
  Promise.all([import("./index"), import("./public")]).then(([portal, pub]) => [...portal.ALL_TUTORIALS, ...pub.PUBLIC_TUTORIALS]);
/** Public tutorials only (TutorialEmbed, "Watch how it works" on marketing pages). */
const loadPublic = () => import("./public").then((m) => m.PUBLIC_TUTORIALS);

export default function TutorialRoot({ children }: { children: ReactNode }) {
  return <TutorialProvider load={loadTutorials} loadPublic={loadPublic}>{children}</TutorialProvider>;
}
