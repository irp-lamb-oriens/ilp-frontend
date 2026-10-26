"use client";

import s from "./field.module.scss";

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
];

/**
 * Jurisdiction selector: a grid of country cards with flag, name, and code.
 * Selecting a card highlights it; the parent persists on save.
 */
export default function JurisdictionInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className={s.countryGrid} role="radiogroup" aria-label="Jurisdiction">
      {COUNTRIES.map((c) => {
        const selected = value === c.name;
        return (
          <button
            key={c.code}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${s.countryCard} ${selected ? s.countryCardSelected : ""}`}
            onClick={() => onChange(c.name)}
          >
            <span className={s.countryFlag} aria-hidden="true">
              {c.flag}
            </span>
            <span className={s.countryName}>{c.name}</span>
            <span className={s.countryCode}>{c.code}</span>
          </button>
        );
      })}
    </div>
  );
}