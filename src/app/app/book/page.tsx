"use client";

import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import { fetchProviders, type PublicProvider } from "@/lib/public";
import { fetchSlots, bookConsultation, type CalendarSlot } from "@/lib/clientDomain";
import s from "../portal.module.scss";

export default function BookPage() {
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [providerId, setProviderId] = useState("");
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [slot, setSlot] = useState<CalendarSlot | null>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders().then((rows) => setProviders(rows ?? [])).catch(() => {});
  }, []);

  const loadSlots = async (id: string) => {
    setProviderId(id);
    setSlots([]);
    setSlot(null);
    setDone(null);
    const rows = await fetchSlots(id);
    setSlots(rows ?? []);
  };

  const submit = async () => {
    if (!providerId || !slot) return;
    setBusy(true);
    setError(null);
    try {
      const result = await bookConsultation({ providerId, slot, source: "portal", topic });
      setDone(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell title="Book a consultation">
      <div className={s.card}>
        <h2 className={s.cardTitle}>Choose a specialist</h2>
        <select
          value={providerId}
          onChange={(e) => loadSlots(e.target.value)}
          style={{ padding: "0.75rem", borderRadius: 10, border: "1px solid #d9e1e6" }}
        >
          <option value="">Select a specialist</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name ?? p.id}</option>
          ))}
        </select>
      </div>

      {slots.length > 0 && (
        <div className={s.card}>
          <h2 className={s.cardTitle}>Pick a time</h2>
          <div className={s.grid}>
            {slots.map((sl) => (
              <button
                key={sl.start}
                type="button"
                onClick={() => setSlot(sl)}
                className={s.row}
                style={{
                  cursor: "pointer",
                  border: slot?.start === sl.start ? "2px solid #5cccf7" : undefined,
                }}
              >
                <span className={s.rowTitle}>{new Date(sl.start).toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={s.card}>
        <h2 className={s.cardTitle}>What would you like to discuss?</h2>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Residency renewal"
          style={{ padding: "0.75rem", borderRadius: 10, border: "1px solid #d9e1e6" }}
        />
      </div>

      {error && <p className={s.empty} style={{ color: "#c0392b" }}>{error}</p>}
      {done && <p className={s.empty} style={{ color: "#1f7a5c" }}>Consultation requested (id {done}).</p>}

      <button
        type="button"
        className={s.primary}
        disabled={!providerId || !slot || busy}
        onClick={submit}
      >
        {busy ? "Requesting…" : "Request consultation"}
      </button>
    </PortalShell>
  );
}