import type { ReactNode } from "react";

export type ShellRole = "client" | "lawyer" | "staff";

export interface NavItem {
  href: string;
  label: string;
  /** Short glyph or SVG. Shown alone when the side nav is collapsed. */
  icon?: ReactNode;
  /** Count shown after the label, e.g. open tasks. */
  badge?: number;
  /** "exact" for a role's root route (e.g. /dashboard); default "prefix". */
  match?: "exact" | "prefix";
}

export interface ShellUser {
  name?: string;
  email: string;
  /** Extra line in the user menu, e.g. "Customer Success Manager". */
  title?: string;
}

export interface Country {
  code: string;
  name: string;
  available: boolean;
}

/** A link in the user menu (e.g. "Your data and privacy", legal pages). */
export interface MenuLink {
  href: string;
  label: string;
}

