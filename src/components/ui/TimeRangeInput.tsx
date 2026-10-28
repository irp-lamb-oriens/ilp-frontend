"use client";

import type { ReactNode } from "react";
import { describedBy, FieldError, FieldHint, FieldMarker, useFieldIds } from "./Field";
import { cx } from "./cx";
import { TimeField } from "./TimeInput";
import { formatDuration, rangeError, slotCount, timeToMinutes } from "./timeUtils";
import s from "./TimeRangeInput.module.scss";

export interface TimeRange {
  /** "HH:MM", 24-hour. */
  start: string;
  /** "HH:MM", 24-hour; "24:00" means until midnight. */
  end: string;
}

export interface TimeRangeInputProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  /** Accessible name of the pair (the group); visible unless hideLabel. */
  label: ReactNode;
  hideLabel?: boolean;
  hint?: ReactNode;
  /** Error from outside (e.g. "Overlaps 9:00 AM to 12:00 PM"); wins over the built-in check. */
  error?: ReactNode;
  required?: boolean;
  /** Length of one call; the hint counts how many fit. Default 20. */
  slotMinutes?: number;
  /** Shortest allowed range. Default slotMinutes. */
  minMinutes?: number;
  stepMinutes?: number;
  /** Show "10 calls" next to the pair. Default true. */
  showSlots?: boolean;
  /** Word for one slot in the hint. Default "call". */
  slotNoun?: [singular: string, plural: string];
  /** Names of the two fields for screen readers. Default "From" / "Until". */
  startLabel?: string;
  endLabel?: string;
  /** Hidden inputs `${name}Start` / `${name}End` for plain form posts. */
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Rendered after the box on the same row (e.g. a remove button). */
  trailing?: ReactNode;
}

/**
 * From–until pair as one segmented control: "8:30 AM to 12:00 PM".
 * Checks that the end is after the start and that the range fits at least
 * one call, and shows how many calls it yields. Both halves are TimeFields,
 * so arrow keys, type-ahead and the time list all work.
 */
export function TimeRangeInput({
  value,
  onChange,
  label,
  hideLabel,
  hint,
  error,
  required,
  slotMinutes = 20,
  minMinutes,
  stepMinutes = 15,
  showSlots = true,
  slotNoun = ["call", "calls"],
  startLabel = "From",
  endLabel = "Until",
  name,
  disabled,
  id,
  className,
  trailing,
}: TimeRangeInputProps) {
  const ids = useFieldIds(id);
  const labelId = `${ids.id}-label`;
  const slotsId = `${ids.id}-slots`;
  const own = rangeError(value.start, value.end, minMinutes ?? slotMinutes);
  const shown = error ?? own;
  const n = slotCount(value.start, value.end, slotMinutes);
  const by = describedBy(ids, hint, shown, showSlots && !shown ? slotsId : undefined);
  const startMin = timeToMinutes(value.start);

  return (
    <div className={cx(s.wrap, className)}>
      <div className={cx(s.labelRow, hideLabel && s.srOnly)} id={labelId}>
        <span>{label}</span>
        <FieldMarker required={required} />
      </div>
      <FieldHint id={ids.hintId}>{hint}</FieldHint>
      <div className={s.row}>
        <div
          role="group"
          aria-labelledby={labelId}
          className={cx(s.box, !!shown && s.invalid, disabled && s.disabled)}
        >
          <TimeField
            id={`${ids.id}-start`}
            appearance="bare"
            aria-label={startLabel}
            aria-describedby={by}
            aria-invalid={shown ? true : undefined}
            required={required}
            value={value.start}
            onChange={(start) => onChange({ ...value, start })}
            stepMinutes={stepMinutes}
            name={name ? `${name}Start` : undefined}
            disabled={disabled}
          />
          <span className={s.sep} aria-hidden="true">to</span>
          <TimeField
            id={`${ids.id}-end`}
            appearance="bare"
            noIcon
            aria-label={endLabel}
            aria-describedby={by}
            aria-invalid={shown ? true : undefined}
            required={required}
            value={value.end}
            onChange={(end) => onChange({ ...value, end })}
            stepMinutes={stepMinutes}
            allowEndOfDay
            optionHint={(v) => (Number.isFinite(startMin) ? formatDuration(timeToMinutes(v) - startMin) : null)}
            name={name ? `${name}End` : undefined}
            disabled={disabled}
          />
        </div>
        {showSlots && !shown && (
          <span id={slotsId} className={s.slots}>
            {n} {n === 1 ? slotNoun[0] : slotNoun[1]}
          </span>
        )}
        {trailing}
      </div>
      <FieldError id={ids.errorId}>{shown}</FieldError>
    </div>
  );
}

export default TimeRangeInput;
