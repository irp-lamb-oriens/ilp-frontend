"use client";

import { LEGAL_AREA_TREE } from "./legalTree";
import s from "./field.module.scss";

/**
 * Legal area selector: a vertical list of area cards. Each card shows the
 * area label and a short description. Selecting one highlights it; the parent
 * persists on save.
 */
export default function LegalAreaInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className={s.areaList} role="radiogroup" aria-label="Legal area">
      {LEGAL_AREA_TREE.map((a) => {
        const selected = value === a.id;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${s.areaCard} ${selected ? s.areaCardSelected : ""}`}
            onClick={() => onChange(a.id)}
          >
            <span className={s.areaLabel}>{a.label}</span>
            <span className={s.areaDesc}>{a.description}</span>
          </button>
        );
      })}
    </div>
  );
}