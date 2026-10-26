"use client";

import { useId } from "react";
import { cx } from "../ui/cx";
import { COUNTRIES } from "./navConfig";
import type { Country } from "./types";
import { usePopover } from "./usePopover";
import s from "./RoleShell.module.scss";

export interface CountrySwitcherProps {
  value?: string;
  countries?: Country[];
  onChange?: (code: string) => void;
}

/** Country switcher stub: Costa Rica active, the rest listed as coming soon. */
export function CountrySwitcher({ value = "CR", countries = COUNTRIES, onChange }: CountrySwitcherProps) {
  const menuId = useId();
  const { open, toggle, close, rootRef, triggerRef } = usePopover();
  const current = countries.find((c) => c.code === value) ?? countries[0];

  return (
    <div className={s.popRoot} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={s.topButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
      >
        <span className={s.srOnly}>Country: </span>
        {current.name}
        <span className={s.caret} aria-hidden="true">▾</span>
      </button>
      <div id={menuId} role="menu" className={cx(s.menu, s.menuRight, open && s.menuOpen)} aria-hidden={!open}>
        {countries.map((c) => (
          <button
            key={c.code}
            type="button"
            role="menuitemradio"
            aria-checked={c.code === current.code}
            disabled={!c.available}
            className={s.menuItem}
            onClick={() => {
              onChange?.(c.code);
              close();
            }}
          >
            <span>{c.name}</span>
            <span className={s.menuMeta}>{c.available ? (c.code === current.code ? "Active" : "") : "Coming soon"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CountrySwitcher;
