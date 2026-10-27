"use client";

/** "?" in the shell top bar: plays the tutorial for the current page. Hidden when the page has none. */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cx } from "../ui/cx";
import { useTutorialOptional } from "./context";
import type { TutorialRole } from "./types";
import s from "./HelpButton.module.scss";

export function HelpButton({ role, className }: { role: TutorialRole; className?: string }) {
  const api = useTutorialOptional();
  const pathname = usePathname();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !pathname) return;
    let off = false;
    void api.ensureLoaded().then((reg) => {
      if (!off) setId(reg.forRoute(pathname, role)?.id ?? null);
    });
    return () => {
      off = true;
    };
    // api identity changes on every store update; the route lookup only needs the path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, role, !!api]);

  if (!api || !id) return null;
  return (
    <button
      type="button"
      className={cx(s.help, className)}
      aria-label="Tutorial for this page"
      title="Tutorial for this page"
      onClick={() => void api.start(id)}
      data-tour="help"
    >
      <span aria-hidden="true">?</span>
    </button>
  );
}

export default HelpButton;
