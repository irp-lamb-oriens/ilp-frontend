"use client";

import type { ReactNode } from "react";
import s from "./field.module.scss";

/**
 * Shared shell for an editable matter field: label, custom input slot, a
 * dynamic implication line explaining what changing the value does, and a save
 * button with busy state. Keeps every field visually consistent while each
 * input stays a dedicated, modular component.
 */
export default function FieldShell({
  label,
  hint,
  implication,
  busy,
  onSave,
  children,
}: {
  label: string;
  hint?: string;
  implication?: string;
  busy: boolean;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <div className={s.shell}>
      <div className={s.head}>
        <span className={s.label}>{label}</span>
        {hint && <span className={s.hint}>{hint}</span>}
      </div>
      <div className={s.body}>
        {children}
        <button
          type="button"
          className={s.save}
          disabled={busy}
          onClick={onSave}
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {implication && <p className={s.implication}>{implication}</p>}
    </div>
  );
}