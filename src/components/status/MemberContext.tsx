"use client";

import { createContext, useContext } from "react";
import type { MatterView, MemberHome } from "./api";

export interface MemberContextValue {
  home: MemberHome;
  /** Re-fetch the home bundle after a change (booking, profile, ask). */
  refresh: () => Promise<void>;
  matterId: string | null;
  setMatterId: (id: string) => void;
  matter: MatterView | null;
  /** First visit after joining (?welcome=1). */
  welcome: boolean;
}

export const MemberContext = createContext<MemberContextValue | null>(null);

export function useMember(): MemberContextValue {
  const v = useContext(MemberContext);
  if (!v) throw new Error("useMember must be used inside the /status layout");
  return v;
}
