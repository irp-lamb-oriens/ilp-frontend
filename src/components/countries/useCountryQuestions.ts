"use client";

import { useEffect, useState } from "react";
import { type CountryCode, isCountryCode } from "@/lib/contracts";
import { API_URL } from "@/lib/api";
import type { CountryQuestion } from "@/lib/countryQuestions";

const cache = new Map<string, Promise<CountryQuestion[]>>();

/** Questions for one country (cached per page load). `stage` limits to the check or the profile ones. */
export function fetchCountryQuestions(country: CountryCode, stage?: CountryQuestion["stage"]): Promise<CountryQuestion[]> {
  const key = `${country}:${stage ?? "all"}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`${API_URL}/api/countries/${country}/questions${stage ? `?stage=${stage}` : ""}`, { credentials: "omit" })
      .then(async (res) => {
        if (!res.ok) throw new Error("The questions for this country could not be loaded. Please try again.");
        const body = (await res.json()) as { questions?: CountryQuestion[] };
        return body.questions ?? [];
      })
      .catch((err) => {
        cache.delete(key);
        throw err;
      });
    cache.set(key, p);
  }
  return p;
}


/** The situation questions of one country; null while loading or with no country yet. */
export function useCountryQuestions(country: string | null | undefined, stage?: CountryQuestion["stage"]) {
  const [questions, setQuestions] = useState<CountryQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setQuestions(null);
    setError(null);
    if (!country || !isCountryCode(country)) return;
    let live = true;
    fetchCountryQuestions(country as CountryCode, stage)
      .then((q) => live && setQuestions(q))
      .catch((e) => live && setError(e instanceof Error ? e.message : "The questions could not be loaded."));
    return () => {
      live = false;
    };
  }, [country, stage, attempt]);
  return { questions, error, retry: () => setAttempt((n) => n + 1) };
}
