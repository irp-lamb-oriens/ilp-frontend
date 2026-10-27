"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
import { cx } from "./cx";
import { IconClose, IconCopy, IconPlus } from "./icons";
import { Switch } from "./Switch";
import { TimeRangeInput } from "./TimeRangeInput";
import { formatRange12, nextWindow, slotCount, timeToMinutes, validateWindows, weeklySlotTotal } from "./timeUtils";
import s from "./WeeklyHoursEditor.module.scss";

/** One window of weekly hours. Same shape as contracts WeeklyWindow (0 = Sunday). */
export interface WeeklyWindowValue {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start: string;
  end: string;
}

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MON_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;
const WEEKDAYS = [1, 2, 3, 4, 5] as const;

export interface WeeklyHoursEditorProps {
  value: WeeklyWindowValue[];
  onChange: (next: WeeklyWindowValue[]) => void;
  /** Day order; Monday first by default. */
  days?: readonly WeeklyWindowValue["day"][];
  dayNames?: readonly string[];
  /** Call length; ranges count whole calls and must fit at least one. Default 20. */
  slotMinutes?: number;
  stepMinutes?: number;
  /** Caps each day's count in the weekly total (the booking engine stops there). */
  maxPerDay?: number;
  /** Hours a day gets when switched on for the first time. */
  defaultWindow?: { start: string; end: string };
  disabled?: boolean;
  /** Prefix for element ids, when two editors share a page. */
  idPrefix?: string;
  className?: string;
}

/**
 * Weekly hours: one row per weekday with an on/off switch and its time
 * ranges. Remove a range with the × button, add one after the last with
 * "Add hours", copy a day to every weekday, and see overlaps inline. The
 * weekly call total updates as you edit. Validate before saving with
 * `validateWindows(value)` (an empty map means valid).
 */
export function WeeklyHoursEditor({
  value,
  onChange,
  days = MON_FIRST,
  dayNames = WEEKDAY_NAMES,
  slotMinutes = 20,
  stepMinutes = 15,
  maxPerDay,
  defaultWindow = { start: "09:00", end: "17:00" },
  disabled,
  idPrefix = "hours",
  className,
}: WeeklyHoursEditorProps) {
  const errors = useMemo(() => validateWindows(value, slotMinutes), [value, slotMinutes]);
  const total = weeklySlotTotal(value, slotMinutes, maxPerDay);
  const uncapped = weeklySlotTotal(value, slotMinutes);
  const [announce, setAnnounce] = useState("");
  // Ranges a day had before it was switched off, so switching back restores them.
  const parked = useRef(new Map<number, { start: string; end: string }[]>());
  const focusNext = useRef<string | null>(null);

  useEffect(() => {
    if (!focusNext.current) return;
    const el = document.getElementById(focusNext.current);
    focusNext.current = null;
    el?.focus();
  });

  const byDay = (day: number) =>
    value
      .map((w, i) => ({ w, i }))
      .filter((x) => x.w.day === day)
      .sort((a, b) => timeToMinutes(a.w.start) - timeToMinutes(b.w.start));

  const rangeId = (day: number, k: number) => `${idPrefix}-d${day}-r${k}`;

  const toggleDay = (day: WeeklyWindowValue["day"], on: boolean) => {
    const name = dayNames[day];
    if (on) {
      const restore = parked.current.get(day) ?? [defaultWindow];
      parked.current.delete(day);
      onChange([...value, ...restore.map((r) => ({ day, ...r }))]);
      setAnnounce(`${name} available, ${restore.map((r) => formatRange12(r.start, r.end)).join(" and ")}.`);
    } else {
      parked.current.set(day, byDay(day).map(({ w }) => ({ start: w.start, end: w.end })));
      onChange(value.filter((w) => w.day !== day));
      setAnnounce(`${name} not available.`);
    }
  };

  const add = (day: WeeklyWindowValue["day"]) => {
    const rows = byDay(day);
    const next = nextWindow(rows.map((r) => r.w), defaultWindow.start);
    if (!next) return;
    focusNext.current = `${rangeId(day, rows.length)}-start`;
    onChange([...value, { day, ...next }]);
  };

  const remove = (day: WeeklyWindowValue["day"], i: number) => {
    const w = value[i];
    const left = byDay(day).length - 1;
    focusNext.current = left > 0 ? `${idPrefix}-d${day}-add` : `${idPrefix}-d${day}-switch`;
    onChange(value.filter((_, j) => j !== i));
    setAnnounce(`Removed ${formatRange12(w.start, w.end)} on ${dayNames[day]}.`);
  };

  const copyToWeekdays = (day: WeeklyWindowValue["day"]) => {
    const src = byDay(day).map(({ w }) => ({ start: w.start, end: w.end }));
    const targets = WEEKDAYS.filter((d) => d !== day);
    const kept = value.filter((w) => !targets.includes(w.day as (typeof WEEKDAYS)[number]));
    onChange([...kept, ...targets.flatMap((d) => src.map((r) => ({ day: d, ...r })))]);
    const names = targets.map((d) => dayNames[d]);
    setAnnounce(`Copied ${dayNames[day]}'s hours to ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}.`);
  };

  const setRange = (i: number, r: { start: string; end: string }) => onChange(value.map((w, j) => (j === i ? { ...w, ...r } : w)));

  return (
    <div className={cx(s.root, className)}>
      <p className={s.total} aria-live="polite" aria-atomic="true">
        <strong className={s.totalN}>~{total}</strong> call slots a week
        {maxPerDay && uncapped > total ? <span className={s.totalNote}> (your limit of {maxPerDay} a day applies)</span> : null}
      </p>
      <ul className={s.days}>
        {days.map((day) => {
          const rows = byDay(day);
          const on = rows.length > 0;
          const name = dayNames[day];
          const daySlots = rows.reduce((n, { w }) => n + slotCount(w.start, w.end, slotMinutes), 0);
          const canAdd = nextWindow(rows.map((r) => r.w)) !== null;
          return (
            <li key={day} className={s.day}>
              <div className={s.head}>
                <Switch id={`${idPrefix}-d${day}-switch`} checked={on} onChange={(v) => toggleDay(day, v)} label={name} disabled={disabled} className={s.switch} />
                {on ? (
                  <span className={s.daySlots}>{maxPerDay ? Math.min(daySlots, maxPerDay) : daySlots} calls</span>
                ) : (
                  <span className={s.off}>Not available</span>
                )}
                {on && (
                  <button
                    type="button"
                    className={s.textBtn}
                    onClick={() => copyToWeekdays(day)}
                    disabled={disabled}
                    aria-label={`Copy to all weekdays: ${name}'s hours`}
                  >
                    <IconCopy />
                    <span className={s.textBtnLabel}>Copy to all weekdays</span>
                  </button>
                )}
              </div>
              {on && (
                <div className={s.ranges}>
                  {rows.map(({ w, i }, k) => (
                    <TimeRangeInput
                      key={i}
                      id={rangeId(day, k)}
                      label={`${name}, hours ${k + 1} of ${rows.length}`}
                      hideLabel
                      value={{ start: w.start, end: w.end }}
                      onChange={(r) => setRange(i, r)}
                      error={errors.get(i)}
                      slotMinutes={slotMinutes}
                      stepMinutes={stepMinutes}
                      disabled={disabled}
                      trailing={
                        <button
                          type="button"
                          className={s.iconBtn}
                          onClick={() => remove(day, i)}
                          disabled={disabled}
                          aria-label={`Remove ${formatRange12(w.start, w.end)} on ${name}`}
                        >
                          <IconClose />
                        </button>
                      }
                    />
                  ))}
                  <Button
                    id={`${idPrefix}-d${day}-add`}
                    variant="ghost"
                    size="sm"
                    icon={<IconPlus />}
                    onClick={() => add(day)}
                    disabled={disabled || !canAdd}
                    className={s.add}
                    aria-label={`Add hours on ${name}`}
                  >
                    Add hours
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className={s.srOnly} role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

export default WeeklyHoursEditor;
