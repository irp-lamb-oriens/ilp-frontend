/**
 * Public tutorials: no sign-in, no route. Marketing pages play them inline
 * with <TutorialEmbed tutorialId="public.…"> or open them from a PageIntro's
 * "Watch how it works". This file loads on its own, so a public page never
 * downloads the portal tutorials.
 *
 * The homepage plays the first four, in this order, between its sections.
 * The lawyers landing (/attorneys) plays the three lawyer ones (T2).
 */
import type { Tutorial } from "../../components/tutorial/types";
import { publicCall } from "./call";
import { publicCheck } from "./check";
import { publicLawyerCall } from "./lawyerCall";
import { publicLawyerDay } from "./lawyerDay";
import { publicLawyerHours } from "./lawyerHours";
import { publicMemberHome } from "./memberHome";
import { publicPricing } from "./pricing";

export const PUBLIC_TUTORIALS: Tutorial[] = [publicCheck, publicMemberHome, publicCall, publicPricing, publicLawyerDay, publicLawyerCall, publicLawyerHours];

/** Ids the homepage embeds (tests check each one exists). */
export const HOMEPAGE_TUTORIAL_IDS = ["public.check", "public.member-home", "public.call", "public.pricing"] as const;

/** Ids the lawyers landing embeds, in page order (tests check each one exists). */
export const LAWYERS_TUTORIAL_IDS = ["public.lawyer-day", "public.lawyer-call", "public.lawyer-hours"] as const;
