"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { getUser } from "@/lib/auth";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
import { fetchProviders, type PublicProvider } from "@/lib/public";
import {
  fetchMyAlerts,
  fetchSlots,
  bookConsultation,
  respondToAlert,
  type MyAlert,
  type CalendarSlot,
} from "@/lib/clientDomain";
import styles from "./page.module.scss";

type RespondAction = "paid" | "not_paid" | "need_help" | "incorrect_deadline";

const RESPOND_ACTIONS: Array<{ value: RespondAction; label: string }> = [
  { value: "paid", label: "Paid" },
  { value: "not_paid", label: "Not paid" },
  { value: "need_help", label: "Need help" },
  { value: "incorrect_deadline", label: "Wrong deadline" },
];

export default function AlertsPage() {
  const [user] = useState(() => getUser());
  const [alerts, setAlerts] = useState<MyAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [providerId, setProviderId] = useState<string>("");
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [slot, setSlot] = useState<CalendarSlot | null>(null);
  const [topic, setTopic] = useState("");
  const [booking, setBooking] = useState<{ id: string } | null>(null);

  useEffect(() => {
    if (!user || user.role !== "customer") {
      setError("Sign in as a member to see your deadline alerts.");
      return;
    }
    let active = true;
    fetchMyAlerts()
      .then((rows) => active && setAlerts(rows))
      .catch((err) => active && setError(err.message));
    fetchProviders()
      .then((rows) => active && setProviders(rows ?? []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  const loadSlots = async (id: string) => {
    setProviderId(id);
    setSlots([]);
    setSlot(null);
    setBooking(null);
    const rows = await fetchSlots(id);
    setSlots(rows ?? []);
  };

  const submitBooking = async () => {
    if (!providerId || !slot) return;
    setBusy("booking");
    try {
      const result = await bookConsultation({
        providerId,
        slot,
        source: "alerts_page",
        topic,
      });
      setBooking(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The booking did not go through. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const respond = async (id: string, action: RespondAction) => {
    setBusy(id);
    try {
      await respondToAlert(id, action);
      setAlerts((prev) =>
        (prev ?? []).map((a) =>
          a.id === id
            ? { ...a, status: action === "need_help" ? "needs_help" : "responded" }
            : a,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your answer was not saved. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <RevealTitle as="h1" text="Your deadline alerts" className={styles.headline} />

        {error && <p className={styles.error}>{error}</p>}

        {user?.role === "customer" && alerts && (
          <section className={styles.alerts}>
            {alerts.length === 0 ? (
              <p className={styles.empty}>
                No alerts yet. An alert appears here when a date that may apply
                to you comes up.
              </p>
            ) : (
              <ul className={styles.list}>
                {alerts.map((a, i) => (
                  <li key={a.id}>
                    <Reveal
                      from={i % 2 === 0 ? "left" : "right"}
                      delay={Math.min(i, 5) * 0.06}
                      className={i % 2 === 0 ? styles.alert : `${styles.alert} ${styles.alertFlip}`}
                    >
                    <div className={styles.alertBody}>
                      <span className={styles.alertTitle}>
                        {a.title ?? "Obligation"}
                      </span>
                      <span className={styles.alertMeta}>
                        {[a.country, a.deadlineLabel].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <div className={styles.actions}>
                      {RESPOND_ACTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={styles.action}
                          disabled={busy === a.id || a.status === "responded" || a.status === "needs_help"}
                          onClick={() => respond(a.id, opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className={styles.booking}>
          <RevealTitle text="Book a call with a lawyer" className={styles.subhead} />
          <p className={styles.sub}>
            Choose a lawyer and a time. The call is confirmed once the lawyer
            accepts it.
          </p>

          <label htmlFor="provider" className={styles.label}>
            Lawyer
          </label>
          <select
            id="provider"
            className={styles.select}
            value={providerId}
            onChange={(e) => loadSlots(e.target.value)}
          >
            <option value="">Choose a lawyer</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? p.id}
              </option>
            ))}
          </select>

          {slots.length > 0 && (
            <>
              <label className={styles.label}>Time</label>
              <div className={styles.slots}>
                {slots.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    className={
                      slot?.start === s.start ? styles.slotActive : styles.slot
                    }
                    onClick={() => setSlot(s)}
                  >
                    {new Date(s.start).toLocaleString()}
                  </button>
                ))}
              </div>
            </>
          )}

          <label htmlFor="topic" className={styles.label}>
            Topic (optional)
          </label>
          <input
            id="topic"
            className={styles.input}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Residency renewal"
          />

          <button
            type="button"
            className={styles.primary}
            disabled={!providerId || !slot || busy === "booking"}
            onClick={submitBooking}
          >
            Request this call
          </button>

          {booking && (
            <p className={styles.success}>
              Call requested (reference {booking.id}). The lawyer will confirm it.
            </p>
          )}
        </section>
      </main>
    </>
  );
}