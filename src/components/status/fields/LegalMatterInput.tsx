"use client";

import { areaNode } from "./legalTree";
import s from "./field.module.scss";

/**
 * Legal matter selector: a tree-like input whose leaves depend on the chosen
 * legal area. When no area is selected, it shows a hint to pick an area
 * first. Each leaf is a selectable chip; the parent persists on save.
 */
export default function LegalMatterInput({
  areaId,
  value,
  onChange,
}: {
  areaId: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const area = areaNode(areaId);

  if (!area) {
    return (
      <p className={s.treeHint}>
        Choose a legal area first, then its matter appears here.
      </p>
    );
  }

  return (
    <div className={s.matterTree} role="radiogroup" aria-label="Legal matter">
      <div className={s.treeBranch}>
        <span className={s.treeParent}>{area.label}</span>
        <div className={s.treeChildren}>
          {area.children.map((c) => {
            const selected = value === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${s.matterChip} ${selected ? s.matterChipSelected : ""}`}
                onClick={() => onChange(c.id)}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}