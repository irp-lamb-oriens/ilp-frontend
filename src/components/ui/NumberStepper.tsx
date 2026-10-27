"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Field, type FieldBaseProps } from "./Field";
import { cx } from "./cx";
import { IconMinus, IconPlus } from "./icons";
import s from "./NumberStepper.module.scss";

export type NumberStepperProps = FieldBaseProps & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Change per press. Default 1. Ignored when presets are given. */
  step?: number;
  /** Values the buttons and arrow keys jump between (e.g. 2, 4, 12, 24 hours). Any whole number in range can still be typed. */
  presets?: readonly number[];
  /** Unit after the number, singular and plural: ["hour", "hours"]. */
  unit?: [singular: string, plural: string];
  disabled?: boolean;
  id?: string;
  name?: string;
};

const clampTo = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * Whole-number field with − and + buttons ("6 calls"). The input is a
 * spinbutton: ArrowUp/ArrowDown step, PageUp/PageDown step ×10, Home/End go
 * to min/max. Typed values are clamped to the range on blur or Enter. The
 * buttons stay out of the Tab order (the keys do the same job) but are 44px
 * targets for touch.
 */
export function NumberStepper({
  label,
  hint,
  error,
  required,
  optional,
  hideLabel,
  className,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  presets,
  unit,
  disabled,
  id,
  name,
}: NumberStepperProps) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);

  const set = (n: number) => {
    const next = clampTo(Math.round(n), min, max);
    setEditing(false);
    setText(String(next));
    if (next !== value) onChange(next);
  };

  const move = (dir: 1 | -1, times = 1) => {
    if (presets?.length) {
      const sorted = [...presets].sort((a, b) => a - b);
      let target = value;
      for (let k = 0; k < times; k++) {
        const found = dir > 0 ? sorted.find((p) => p > target) : [...sorted].reverse().find((p) => p < target);
        if (found === undefined) break;
        target = found;
      }
      set(target);
    } else set(value + dir * step * times);
  };

  const commitText = () => {
    const n = Number(text.trim());
    if (text.trim() === "" || !Number.isFinite(n)) {
      setEditing(false);
      setText(String(value));
    } else set(n);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const keys: Record<string, () => void> = {
      ArrowUp: () => move(1),
      ArrowDown: () => move(-1),
      PageUp: () => move(1, 10),
      PageDown: () => move(-1, 10),
      Home: () => set(min),
      End: () => set(max),
      Enter: commitText,
    };
    const fn = keys[e.key];
    if (fn && !(e.key === "End" && max === Number.MAX_SAFE_INTEGER)) {
      e.preventDefault();
      fn();
    }
  };

  const unitText = unit ? (value === 1 ? unit[0] : unit[1]) : "";
  const name_ = typeof label === "string" ? label.toLowerCase() : "value";

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} optional={optional} hideLabel={hideLabel} className={className}>
      {(control) => (
        <div className={cx(s.box, !!error && s.invalid, disabled && s.disabled)}>
          <button
            type="button"
            tabIndex={-1}
            className={s.btn}
            onClick={() => move(-1)}
            disabled={disabled || value <= min}
            aria-label={`Decrease ${name_}`}
            aria-controls={control.id}
          >
            <IconMinus />
          </button>
          <span className={s.valueWrap}>
            <input
              {...control}
              type="text"
              role="spinbutton"
              inputMode="numeric"
              autoComplete="off"
              name={name}
              className={s.input}
              value={text}
              disabled={disabled}
              aria-valuenow={value}
              aria-valuemin={min}
              aria-valuemax={max === Number.MAX_SAFE_INTEGER ? undefined : max}
              aria-valuetext={unit ? `${value} ${unitText}` : undefined}
              size={Math.max(2, String(max === Number.MAX_SAFE_INTEGER ? value : max).length)}
              onChange={(e) => {
                setEditing(true);
                setText(e.target.value.replace(/[^\d-]/g, ""));
              }}
              onBlur={commitText}
              onKeyDown={onKeyDown}
            />
            {unit && <span className={s.unit} aria-hidden="true">{unitText}</span>}
          </span>
          <button
            type="button"
            tabIndex={-1}
            className={s.btn}
            onClick={() => move(1)}
            disabled={disabled || value >= max}
            aria-label={`Increase ${name_}`}
            aria-controls={control.id}
          >
            <IconPlus />
          </button>
        </div>
      )}
    </Field>
  );
}

export default NumberStepper;
