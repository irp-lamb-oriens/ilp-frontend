"use client";

import { ChipSelect, DateInput, RadioGroup, Select } from "@/components/ui";
import { type CountryAnswers, type CountryQuestion, DEFAULT_WHY, questionShown, visibleAnswers } from "@/lib/countryQuestions";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export interface CountryQuestionFieldsProps {
  questions: CountryQuestion[];
  answers: CountryAnswers;
  onChange: (next: CountryAnswers) => void;
  /** Field errors keyed "countryAnswers.<key>". */
  errors?: Partial<Record<string, string>>;
  /** Show the "why we ask" line under each question (default true). */
  showWhy?: boolean;
  idPrefix?: string;
}

/**
 * A country's situation questions as form fields (join form, member
 * profile). Follow-up questions appear only when their parent answer shows
 * them; changing a parent clears the hidden follow-ups.
 */
export function CountryQuestionFields({ questions, answers, onChange, errors = {}, showWhy = true, idPrefix = "cq" }: CountryQuestionFieldsProps) {
  const set = (key: string, value: string | string[] | undefined) => {
    const next = { ...answers };
    if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) delete next[key];
    else next[key] = value;
    onChange(visibleAnswers(questions, next));
  };
  return (
    <>
      {questions.filter((q) => questionShown(q, answers)).map((q) => {
        const err = errors[`countryAnswers.${q.key}`];
        const hint = [showWhy ? q.why ?? DEFAULT_WHY : "", q.help ?? ""].filter(Boolean).join(" ");
        const value = answers[q.key];
        const name = `${idPrefix}-${q.key}`;
        const required = !q.optional && q.type !== "date";
        return (
          <div key={q.key} data-field={`countryAnswers.${q.key}`}>
            {q.type === "date" ? (
              <DateInput label={q.question} hint={hint || undefined} value={typeof value === "string" ? value : ""} onChange={(e) => set(q.key, e.target.value)} error={err} optional />
            ) : q.type === "multi" ? (
              <ChipSelect label={q.question} hint={hint || undefined} options={q.options} value={Array.isArray(value) ? value : []} onChange={(v) => set(q.key, v)} error={err} required={required} />
            ) : q.type === "month" ? (
              <Select label={q.question} hint={hint || undefined} value={typeof value === "string" ? value : ""} onChange={(e) => set(q.key, e.target.value)} error={err} optional={!required} required={required} placeholder="Choose a month" options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))} />
            ) : q.options.length > 6 ? (
              <Select label={q.question} hint={hint || undefined} value={typeof value === "string" ? value : ""} onChange={(e) => set(q.key, e.target.value)} error={err} optional={!required} required={required} placeholder="Choose one" options={q.options.map((o) => ({ value: o.value, label: o.label }))} />
            ) : (
              <RadioGroup label={q.question} hint={hint || undefined} name={name} options={q.options.map((o) => ({ value: o.value, label: o.label }))} value={typeof value === "string" ? value : ""} onChange={(v) => set(q.key, v)} error={err} required={required} optional={!required} />
            )}
          </div>
        );
      })}
    </>
  );
}

export default CountryQuestionFields;
