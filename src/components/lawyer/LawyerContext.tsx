"use client";

import { createContext, useContext } from "react";
import type { LawyerMe } from "./lawyerApi";

export const LawyerContext = createContext<LawyerMe | null>(null);

/** The signed-in lawyer. Only available under /lawyer once the gate has passed. */
export function useLawyer(): LawyerMe {
  const me = useContext(LawyerContext);
  if (!me) throw new Error("useLawyer must be used inside LawyerGate.");
  return me;
}
