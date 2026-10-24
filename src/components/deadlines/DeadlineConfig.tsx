"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCountries,
  fetchPriorities,
  fetchMyDeadlines,
  saveDeadline,
  removeDeadline,
  type CountryRef,
  type LegalPriority,
  type UserDeadline,
} from "@/lib/countries";
import { getUser } from "@/lib/auth";
import styles from "./deadlineConfig.module.scss";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * User-personalized legal deadlines. The user picks a country, sees the
 * priorities ILP can track there, and records a real date for each one they
 * care about. Dates are stored on their own profile; nothing is shared.
 */
export default function DeadlineConfig() {
  const user = getUser();
  const [countries, setCountries] = useState<CountryRef[]>([]);
  const [country, setCountry] = useState<string>("");
  const [priorities, setPriorities] = useState<LegalPriority[]>([]);
  const [deadlines, setDeadlines] = useState<Record<string, UserDeadline>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-priority draft date + save state.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  const signedIn = !!user && user.role === "customer";

  useEffect(() => {
    let active = true;
    fetchCountries()
      .then((rows) => active && setCountries(rows))
      .catch(() => {});
    if (signedIn) {
      fetchMyDeadlines()
        .then((rows) => active && setDeadlines(rows))
        .catch(() => {});
    }
    setLoading(false);
    return () => {
      active = false;
    };
  }, [signedIn]);

  useEffect(() => {
    if (!country) {
      setPriorities([]);
      return;
    }
    let active = true;
    fetchPriorities(country)
      .then((rows) => active && setPriorities(rows))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [country]);

  const selectCountry = useCallback((code: string) => {
    setCountry(code);
    setDrafts({});
    setSaveStates({});
    setError(null);
  }, []);

  const draftFor = (p: LegalPriority) => {
    const existing = deadlines[p.id];
    return drafts[p.id] ?? existing?.date ?? "";
  };

  const setDraft = (p: LegalPriority, value: string) => {
    setDrafts((prev) => ({ ...prev, [p.id]: value }));
    setSaveStates((prev) => ({ ...prev, [p.id]: "idle" }));
  };

  const save = async (p: LegalPriority) => {
    const date = draftFor(p);
    if (!date) return;
    setSaveStates((prev) => ({ ...prev, [p.id]: "saving" }));
    try {
      const res = await saveDeadline(p.id, date);
      setDeadlines((prev) => ({ ...prev, [p.id]: res.deadline }));
      setSaveStates((prev) => ({ ...prev, [p.id]: "saved" }));
    } catch (err) {
      setSaveStates((prev) => ({ ...prev, [p.id]: "error" }));
      setError(err instanceof Error ? err.message : "Failed to save.");
    }
  };

  const remove = async (p: LegalPriority) => {
    setSaveStates((prev) => ({ ...prev, [p.id]: "saving" }));
    try {
      await removeDeadline(p.id);
      setDeadlines((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      setSaveStates((prev) => ({ ...prev, [p.id]: "idle" }));
    } catch (err) {
      setSaveStates((prev) => ({ ...prev, [p.id]: "error" }));
      setError(err instanceof Error ? err.message : "Failed to remove.");
    }
  };

  const grouped = useMemo(() => {
    const order: LegalPriority["category"][] = [
      "Residency",
      "Tax",
      "Property",
      "Corporate",
      "Social security",
    ];
    const map = new Map<string, LegalPriority[]>();
    for (const p of priorities) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return order
      .filter((c) => map.has(c))
      .map((c) => ({ category: c, items: map.get(c)! }));
  }, [priorities]);

  if (loading) {
    return <p className={styles.empty}>Loading…</p>;
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="country">
        Country
      </label>
      <select
        id="country"
        className={styles.select}
        value={country}
        onChange={(e) => selectCountry(e.target.value)}
      >
        <option value="">Choose a country</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>

      {!signedIn && (
        <p className={styles.notice}>
          Sign in as a customer to save your deadlines.
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {grouped.map((group) => (
        <section key={group.category} className={styles.group}>
          <h3 className={styles.groupTitle}>{group.category}</h3>
          {group.items.map((p) => {
            const state = saveStates[p.id] ?? "idle";
            const hasDate = !!deadlines[p.id];
            return (
              <div key={p.id} className={styles.row}>
                <div className={styles.rowHead}>
                  <span className={styles.rowTitle}>{p.title}</span>
                  <span className={styles.rowDesc}>{p.description}</span>
                </div>
                <div className={styles.rowControls}>
                  <input
                    type="date"
                    className={styles.date}
                    value={draftFor(p)}
                    onChange={(e) => setDraft(p, e.target.value)}
                    aria-label={p.dateFieldLabel}
                    disabled={!signedIn}
                  />
                  <button
                    type="button"
                    className={styles.save}
                    onClick={() => save(p)}
                    disabled={!signedIn || !draftFor(p) || state === "saving"}
                  >
                    {state === "saving" ? "Saving…" : hasDate ? "Update" : "Save"}
                  </button>
                  {hasDate && (
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => remove(p)}
                      disabled={!signedIn || state === "saving"}
                    >
                      Clear
                    </button>
                  )}
                  {state === "saved" && (
                    <span className={styles.saved}>Saved</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}

      {country && priorities.length === 0 && (
        <p className={styles.empty}>No priorities for this country yet.</p>
      )}
    </div>
  );
}