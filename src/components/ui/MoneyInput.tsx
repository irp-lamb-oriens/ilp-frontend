"use client";

import { forwardRef, useEffect, useState, type InputHTMLAttributes } from "react";
import { Field, type FieldBaseProps } from "./Field";
import { cx } from "./cx";
import s from "./Input.module.scss";

export type MoneyInputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type" | "value" | "defaultValue" | "onChange" | "size"> & {
    /** Amount in integer US cents; null when empty. */
    valueCents: number | null | undefined;
    /** Called with integer cents, null when cleared, or undefined while the text is not a valid amount. */
    onChangeCents: (cents: number | null | undefined) => void;
    /** Text shown in front of the amount. */
    currencyLabel?: string;
    inputClassName?: string;
  };

/**
 * Parse what someone typed into integer cents. Accepts "1,250", "1250.5",
 * "US$1,250.50", "$ 99". Returns null for empty, undefined for anything that
 * is not a non-negative amount with at most two decimals. No floating point:
 * dollars and cents are parsed separately.
 */
export function parseMoneyToCents(text: string): number | null | undefined {
  const t = text.replace(/US\$|\$|,|\s/gi, "");
  if (t === "") return null;
  const m = /^(\d*)(?:\.(\d{0,2}))?$/.exec(t);
  if (!m || (m[1] === "" && !m[2])) return undefined;
  const dollars = Number(m[1] || "0");
  const cents = Number((m[2] ?? "").padEnd(2, "0") || "0");
  const total = dollars * 100 + cents;
  return Number.isSafeInteger(total) ? total : undefined;
}

/** Integer cents → "1,250.50" (no currency sign; the input shows "US$" in front). */
export function formatCentsPlain(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "";
  const neg = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rest = String(abs % 100).padStart(2, "0");
  return `${neg ? "-" : ""}${dollars}.${rest}`;
}

/** US$ amount input. Stores integer cents; formats on blur; never uses floats. */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  {
    label,
    hint,
    error,
    required,
    optional,
    hideLabel,
    className,
    inputClassName,
    id,
    valueCents,
    onChangeCents,
    currencyLabel = "US$",
    onBlur,
    onFocus,
    ...rest
  },
  ref,
) {
  const [text, setText] = useState(() => formatCentsPlain(valueCents));
  const [editing, setEditing] = useState(false);

  // Follow outside changes (reset, load) while the person is not typing.
  useEffect(() => {
    if (!editing) setText(formatCentsPlain(valueCents));
  }, [valueCents, editing]);

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} optional={optional} hideLabel={hideLabel} className={className}>
      {(control) => (
        <span className={s.affix}>
          <span className={s.prefix} aria-hidden="true">
            {currencyLabel}
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={cx(s.control, s.withPrefix, s.money, inputClassName)}
            value={text}
            onFocus={(e) => {
              setEditing(true);
              onFocus?.(e);
            }}
            onChange={(e) => {
              setText(e.target.value);
              onChangeCents(parseMoneyToCents(e.target.value));
            }}
            onBlur={(e) => {
              setEditing(false);
              const c = parseMoneyToCents(text);
              if (c !== undefined) setText(formatCentsPlain(c));
              onBlur?.(e);
            }}
            {...control}
            {...rest}
          />
        </span>
      )}
    </Field>
  );
});

export default MoneyInput;
