"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { submitLead } from "@/lib/clientDomain";
import { OPEN_LEAD_EVENT, type OpenLeadDetail } from "@/lib/leadEvents";
import { EASE_OUT_EXPO } from "@/components/motion/Motion";
import StepForm from "@/components/StepForm";
import NotificationPermissionSlide from "@/components/NotificationPermissionSlide";
import s from "./LeadModal.module.scss";

const COUNTRIES = [
  { value: "CR", label: "Costa Rica" },
  { value: "PA", label: "Panama" },
  { value: "MX", label: "Mexico" },
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Global lead-capture dialog. Mounted once in the root layout; any CTA opens
 * it via `openLeadForm({ country, topic })` so the form arrives pre-filled
 * with whatever the visitor was reading. Posts to the public /api/leads.
 */
export default function LeadModal() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showNotificationSlide, setShowNotificationSlide] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<string>("CR");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<OpenLeadDetail>).detail ?? {};
      if (d.topic) setTopic(d.topic);
      if (d.country) setCountry(d.country);
      setDone(false);
      setShowNotificationSlide(false);
      setError(null);
      setOpen(true);
    };
    window.addEventListener(OPEN_LEAD_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_LEAD_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => {
    if (!busy) setOpen(false);
  };

  const handleComplete = async () => {
    setBusy(true);
    setError(null);
    try {
      await submitLead({ name, email, country, topic });
      setShowNotificationSlide(true);
      setName("");
      setTopic("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const steps = [
    {
      title: "Who are you?",
      validate: () => {
        if (!email || !EMAIL_RE.test(email)) return "Enter a valid email to continue.";
        return null;
      },
      body: (
        <>
          <label htmlFor="lead-name">Name</label>
          <input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
          <label htmlFor="lead-email">Email</label>
          <input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </>
      ),
    },
    {
      title: "Where are you?",
      body: (
        <>
          <label htmlFor="lead-country">Country</label>
          <select id="lead-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </>
      ),
    },
    {
      title: "What do you need tracked?",
      body: (
        <>
          <label htmlFor="lead-topic">Topic</label>
          <input id="lead-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Residency renewal" />
        </>
      ),
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={s.backdrop}
          role="presentation"
          onClick={close}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className={s.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Start your membership"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          >
            <button type="button" className={s.close} aria-label="Close" onClick={close}>
              ×
            </button>

            {done ? (
              <div className={s.done}>
                <h2>You are in</h2>
                <p>Your first alerts will land in your inbox before each deadline.</p>
                <Link href="/status" className={s.primary} onClick={close}>
                  Track your matter
                </Link>
                <button type="button" className={s.secondary} onClick={close}>Done</button>
              </div>
            ) : showNotificationSlide ? (
              <NotificationPermissionSlide
                onDone={() => {
                  setShowNotificationSlide(false);
                  setDone(true);
                  setEmail("");
                }}
              />
            ) : (
              <>
                <h2 className={s.heading}>Start your membership</h2>
                {error && <p className={s.errorText} role="alert">{error}</p>}
                <StepForm
                  steps={steps}
                  onComplete={handleComplete}
                  submitLabel="Create my profile"
                  busy={busy}
                />
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}