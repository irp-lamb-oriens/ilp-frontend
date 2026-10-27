"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { describedBy, FieldError, FieldHint, useFieldIds } from "./Field";
import { cx } from "./cx";
import s from "./Switch.module.scss";

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "className" | "role" | "type" | "children"> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The accessible name; shown next to the track unless hideLabel. */
  label: ReactNode;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  /** Label left of the track (a settings row) instead of right of it. */
  labelFirst?: boolean;
  className?: string;
};

/**
 * On/off toggle (role="switch"). Space or Enter flips it; the label and the
 * track are one 44px target. Use it for settings that apply at once, such as
 * "available on Monday"; use Checkbox inside forms that are submitted.
 */
export function Switch({ checked, onChange, label, hideLabel, hint, error, labelFirst, className, id: idProp, disabled, onClick, ...rest }: SwitchProps) {
  const ids = useFieldIds(idProp);
  return (
    <div className={cx(s.wrap, className)}>
      <button
        type="button"
        role="switch"
        id={ids.id}
        aria-checked={checked}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, hint, error)}
        disabled={disabled}
        className={cx(s.switch, labelFirst && s.labelFirst)}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) onChange(!checked);
        }}
        {...rest}
      >
        <span className={s.track} aria-hidden="true">
          <span className={s.thumb} />
        </span>
        <span className={cx(s.label, hideLabel && s.srOnly)}>{label}</span>
      </button>
      {(hint || error) && (
        <div className={s.below}>
          <FieldHint id={ids.hintId}>{hint}</FieldHint>
          <FieldError id={ids.errorId}>{error}</FieldError>
        </div>
      )}
    </div>
  );
}

export default Switch;
