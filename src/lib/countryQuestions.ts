/**
 * Country situation questions (COUNTRIES): the free check's and the member
 * profile's questions for one of the six countries, as served by
 * GET /api/countries/:code/questions (server API/countries/rules, generated
 * from docs/research). Pure helpers, no React, so tests can import them.
 */

export interface QuestionOption {
  value: string;
  label: string;
  sets?: Record<string, string | string[]>;
}

export interface CountryQuestion {
  key: string;
  stage: "check" | "profile";
  question: string;
  why?: string;
  help?: string;
  type: "choice" | "multi" | "date" | "month";
  options: QuestionOption[];
  showIf?: Record<string, string[]>;
  optional?: boolean;
  source: "research" | "ilp";
}

export type CountryAnswers = Record<string, string | string[]>;

/** Shown when every showIf answer matches (same rule as the server). */
export function questionShown(q: Pick<CountryQuestion, "showIf">, answers: CountryAnswers): boolean {
  if (!q.showIf) return true;
  return Object.entries(q.showIf).every(([k, allowed]) => {
    const v = answers[k];
    const vals = Array.isArray(v) ? v : v === undefined ? [] : [v];
    return vals.some((x) => allowed.includes(x));
  });
}

/** Only the answers to questions that are shown (a changed parent answer hides its follow-ups). */
export function visibleAnswers(questions: CountryQuestion[], answers: CountryAnswers): CountryAnswers {
  const out: CountryAnswers = {};
  for (let pass = 0; pass < 2; pass++) {
    for (const q of questions) if (answers[q.key] !== undefined && answers[q.key] !== "") out[q.key] = answers[q.key];
    for (const q of questions) if (out[q.key] !== undefined && !questionShown(q, out)) delete out[q.key];
  }
  return out;
}

/** Keys of shown, required questions (choice, multi or month) that have no answer. */
export function missingAnswers(questions: CountryQuestion[], answers: CountryAnswers, stage: CountryQuestion["stage"] = "check"): string[] {
  const visible = visibleAnswers(questions, answers);
  return questions
    .filter((q) => q.stage === stage && !q.optional && q.type !== "date" && questionShown(q, visible))
    .filter((q) => {
      const v = visible[q.key];
      return v === undefined || (Array.isArray(v) && v.length === 0);
    })
    .map((q) => q.key);
}

/** Plain "why we ask" when the question has none. */
export const DEFAULT_WHY = "Your answer decides which dates in the list apply to you.";
