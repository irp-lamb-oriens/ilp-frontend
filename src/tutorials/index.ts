/**
 * Every tutorial, in one list. Add a screen: create
 * src/tutorials/<role>/<screen>.ts exporting a Tutorial, then add it here.
 */
import type { Tutorial } from "../components/tutorial/types";
import { staffToday } from "./staff/today";
import { staffMembers } from "./staff/members";
import { staffMember } from "./staff/member";
import { staffPipeline } from "./staff/pipeline";
import { staffOpportunities } from "./staff/opportunities";
import { staffLawyers } from "./staff/lawyers";
import { staffFinance } from "./staff/finance";
import { staffReports } from "./staff/reports";
import { staffSettings } from "./staff/settings";
import { staffPrivacy } from "./staff/privacy";

import { lawyerToday } from "./lawyer/today";
import { lawyerBoard } from "./lawyer/board";
import { lawyerClients } from "./lawyer/clients";
import { lawyerCall } from "./lawyer/call";
import { lawyerFinance } from "./lawyer/finance";
import { lawyerAvailability } from "./lawyer/availability";
export const STAFF_TUTORIALS: Tutorial[] = [
  staffToday,
  staffMembers,
  staffMember,
  staffPipeline,
  staffOpportunities,
  staffLawyers,
  staffFinance,
  staffReports,
  staffSettings,
  staffPrivacy,
];
export const LAWYER_TUTORIALS: Tutorial[] = [
  lawyerToday,
  lawyerBoard,
  lawyerClients,
  lawyerCall,
  lawyerFinance,
  lawyerAvailability,
];
export const CLIENT_TUTORIALS: Tutorial[] = [];

export const ALL_TUTORIALS: Tutorial[] = [...STAFF_TUTORIALS, ...LAWYER_TUTORIALS, ...CLIENT_TUTORIALS];

/** The routes that have a tutorial (checked against the portal route list in tests). */
export const TUTORIAL_ROUTES: string[] = ALL_TUTORIALS.map((t) => (typeof t.route === "string" ? t.route : String(t.route)));
