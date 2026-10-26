"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MeasurementChoice from "./MeasurementChoice";
import { LEGAL_DOCS } from "./versions";
import s from "./SiteLegal.module.scss";

/** App areas with their own shell; legal links live in their menus instead. */
const APP_PREFIXES = ["/dashboard", "/lawyer", "/status", "/ui"];

/**
 * Legal links and the measurement-id notice under every public page (P6).
 * Rendered once from the root layout, in the page flow (no overlay), and
 * hidden inside the signed-in app shells.
 */
export default function SiteLegal() {
  const path = usePathname() ?? "/";
  if (APP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return null;

  return (
    <footer className={s.footer}>
      <div className={s.wrap}>
        <MeasurementChoice compact />
        <nav aria-label="Legal">
          <ul className={s.links}>
            {LEGAL_DOCS.map((d) => (
              <li key={d.href}>
                <Link href={d.href}>{d.short}</Link>
              </li>
            ))}
            <li>
              <Link href="/status/privacy">Your data</Link>
            </li>
          </ul>
        </nav>
        <p className={s.note}>
          International Legal Partner is a membership service, not a law firm. Information on this site is general
          information, not legal advice.
        </p>
      </div>
    </footer>
  );
}
