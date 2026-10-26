"use client";

import { forwardRef, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { Field, type FieldBaseProps } from "./Field";
import { cx } from "./cx";
import s from "./Input.module.scss";

export type SearchInputProps = Omit<FieldBaseProps, "required" | "optional"> &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type" | "value" | "onChange" | "size"> & {
    value: string;
    onValueChange: (value: string) => void;
    /** Enter pressed. */
    onSearch?: (value: string) => void;
    inputClassName?: string;
  };

/**
 * Search box. The label is always rendered (pass hideLabel when a heading or
 * button already says what it searches). Esc or "Clear" empties it.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { label, hint, error, hideLabel, className, inputClassName, id, value, onValueChange, onSearch, onKeyDown, ...rest },
  ref,
) {
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      e.preventDefault();
      onSearch(value);
    } else if (e.key === "Escape" && value) {
      e.preventDefault();
      onValueChange("");
    }
    onKeyDown?.(e);
  };
  return (
    <Field id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} className={className}>
      {(control) => (
        <span className={s.affix}>
          <span className={s.searchIcon} aria-hidden="true" />
          <input
            ref={ref}
            type="search"
            autoComplete="off"
            className={cx(s.control, s.search, inputClassName)}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={onKey}
            {...control}
            {...rest}
          />
          {value && (
            <button type="button" className={s.clear} onClick={() => onValueChange("")} aria-label={`Clear ${typeof label === "string" ? label.toLowerCase() : "search"}`}>
              Clear
            </button>
          )}
        </span>
      )}
    </Field>
  );
});

export default SearchInput;
