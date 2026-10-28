/**
 * Public tutorials: no sign-in, no route. Marketing pages play them inline
 * with <TutorialEmbed tutorialId="public.…"> or open them from a PageIntro's
 * "Watch how it works". This file loads on its own, so a public page never
 * downloads the portal tutorials.
 */
import type { Tutorial } from "../../components/tutorial/types";
import { publicCheck } from "./check";

export const PUBLIC_TUTORIALS: Tutorial[] = [publicCheck];
