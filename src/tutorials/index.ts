/**
 * Every tutorial, in one list. Add a screen: create
 * src/tutorials/<role>/<screen>.ts exporting a Tutorial, then add it here.
 */
import type { Tutorial } from "../components/tutorial/types";

export const STAFF_TUTORIALS: Tutorial[] = [];
export const LAWYER_TUTORIALS: Tutorial[] = [];
export const CLIENT_TUTORIALS: Tutorial[] = [];

export const ALL_TUTORIALS: Tutorial[] = [...STAFF_TUTORIALS, ...LAWYER_TUTORIALS, ...CLIENT_TUTORIALS];

/** The routes that have a tutorial (checked against the portal route list in tests). */
export const TUTORIAL_ROUTES: string[] = ALL_TUTORIALS.map((t) => (typeof t.route === "string" ? t.route : String(t.route)));
