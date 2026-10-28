"use client";

/**
 * The country the signed-in person is looking at (COUNTRIES). Staff: "" means
 * all six countries, a code filters Members and Pipeline. Members and lawyers:
 * the country that sets the context of links such as the free check.
 * Kept per browser in localStorage (a view preference, not data), shared by
 * every component through a small subscribe/notify store.
 */
import { useCallback, useSyncExternalStore } from "react";
import { COUNTRIES, COUNTRY_CODES, type CountryCode, isCountryCode } from "./contracts";

const KEY = "ilp_country";
const EVENT = "ilp-country-change";

function read(): string {
  try {
    const v = window.localStorage.getItem(KEY) ?? "";
    return isCountryCode(v) ? v : "";
  } catch {
    return "";
  }
}

function subscribe(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function setCountryContext(code: string): void {
  try {
    if (code && isCountryCode(code)) window.localStorage.setItem(KEY, code);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Private mode: the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** [country code or "" for all, setter]. */
export function useCountryContext(): [string, (code: string) => void] {
  const value = useSyncExternalStore(subscribe, read, () => "");
  const set = useCallback((code: string) => setCountryContext(code), []);
  return [value, set];
}

/** The six countries in display order, as { code, name, slug }. */
export const COUNTRY_LIST = COUNTRY_CODES.map((code) => ({ code, name: COUNTRIES[code].name, slug: COUNTRIES[code].slug }));

export const countryNameOf = (code: string | undefined | null): string =>
  code && isCountryCode(code) ? COUNTRIES[code as CountryCode].name : "";
