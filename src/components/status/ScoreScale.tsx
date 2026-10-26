"use client";

import s from "./ScoreScale.module.scss";

/** A row of numbered choices (1-5 or 0-10) with a caption for the ends. Radio semantics. */
export default function ScoreScale({
  min,
  max,
  value,
  onChange,
  label,
  lowLabel,
  highLabel,
  name,
}: {
  min: number;
  max: number;
  value: number | null;
  onChange: (n: number) => void;
  label: string;
  lowLabel: string;
  highLabel: string;
  name: string;
}) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <fieldset className={s.set}>
      <legend className={s.legend}>{label}</legend>
      <div className={max - min > 5 ? s.wide : s.row}>
        {values.map((n) => (
          <label key={n} className={value === n ? `${s.choice} ${s.on}` : s.choice}>
            <input className={s.input} type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
            <span>{n}</span>
          </label>
        ))}
      </div>
      <p className={s.ends}>
        <span>
          {min} = {lowLabel}
        </span>
        <span>
          {max} = {highLabel}
        </span>
      </p>
    </fieldset>
  );
}
