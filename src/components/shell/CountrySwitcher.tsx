"use client";

import { useId } from "react";
import { cx } from "../ui/cx";
import { COUNTRIES } from "./navConfig";
import type { Country } from "./types";
import { usePopover } from "./usePopover";
import s from "./RoleShell.module.scss";

export interface CountrySwitcherProps {
  /** A country code, or "" for all countries (only with `allowAll`). */
  value?: string;
  countries?: Country[];
  onChange?: (code: string) => void;
  /** Staff: offer "All countries" first. */
  allowAll?: boolean;
}

/** Country switcher: all six countries are open and selectable. */
export function CountrySwitcher({ value = "", countries = COUNTRIES, onChange, allowAll = false }: CountrySwitcherProps) {
  const menuId = useId();
  const { open, toggle, close, rootRef, triggerRef } = usePopover();
  const current = countries.find((c) => c.code === value);
  const options: Country[] = allowAll ? [{ code: "", name: "All countries", available: true }, ...countries] : countries;
  const label = current?.name ?? (allowAll ? "All countries" : countries[0]?.name ?? "");
  const selected = current?.code ?? (allowAll ? "" : countries[0]?.code);

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
        {label}
        <span className={s.caret} aria-hidden="true">▾</span>
      </button>
      <div id={menuId} role="menu" className={cx(s.menu, s.menuRight, open && s.menuOpen)} aria-hidden={!open}>
        {options.map((c) => (
          <button
            key={c.code || "all"}
            type="button"
            role="menuitemradio"
            aria-checked={c.code === selected}
            className={s.menuItem}
            onClick={() => {
              onChange?.(c.code);
              close();
            }}
          >
            <span>{c.name}</span>
            <span className={s.menuMeta}>{c.code === selected ? "Selected" : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CountrySwitcher;
