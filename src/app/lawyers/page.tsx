"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import ParallaxBand from "@/components/ParallaxBand";
import GutenbergList from "@/components/GutenbergList";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
import StepForm from "@/components/StepForm";
import { submitLead } from "@/lib/clientDomain";
import s from "./page.module.scss";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const POINTS = [
  { kicker: "Intake", title: "Clients arrive briefed", body: "Every consultation comes with the client's country, obligation, deadline, and history. No discovery call needed." },
  { kicker: "Fit", title: "Routed to your specialty", body: "We match by practice area, jurisdiction, and language, so you only see matters you want." },
  { kicker: "Operations", title: "We handle the follow-up", body: "Reminders, scheduling, and document chasing run on our side. You spend the hour on legal judgment." },
  { kicker: "Reputation", title: "Quality tracked, not guessed", body: "Response time, punctuality, and client satisfaction are measured and shared with you." },
];

export default function LawyersPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("CR");
  const [specialty, setSpecialty] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleComplete = async () => {
    setState("busy");
    try {
      await submitLead({ name, email, country, topic: `Lawyer application: ${specialty}` });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your application.");
      setState("error");
    }
  };

  const steps = [
    {
      title: "Your details",
      validate: () => {
        if (!name.trim()) return "Enter your full name.";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid work email.";
        return null;
      },
      body: (
        <>
          <label htmlFor="l-name">Full name</label>
          <input id="l-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <label htmlFor="l-email">Work email</label>
          <input id="l-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </>
      ),
    },
    {
      title: "Your jurisdiction",
      body: (
        <>
          <label htmlFor="l-country">Jurisdiction</label>
          <select id="l-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="CR">Costa Rica</option>
            <option value="PA">Panama</option>
            <option value="MX">Mexico</option>
          </select>
        </>
      ),
    },
    {
      title: "Your specialty",
      validate: () => {
        if (!specialty.trim()) return "Enter your primary specialty.";
        return null;
      },
      body: (
        <>
          <label htmlFor="l-specialty">Primary specialty</label>
          <input id="l-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Immigration, corporate" />
        </>
      ),
    },
  ];

  return (
    <>
      <Nav />
      <main>
        <ParallaxBand
          image={IMG(3184325)}
          alt="A clean, modern workspace"
          eyebrow="For legal partners"
          title="Vetted clients, routed to your specialty."
          body="Join a managed legal network. ILP handles intake, reminders, and client organization so your time goes to the work only a professional can do."
          align="left"
        />

        <section className={s.light}>
          <div className={s.wrap}>
            <div className={s.head}>
              <p className={s.eyebrowLight}>Why partners join</p>
              <RevealTitle text="Less admin. Better-prepared clients." className={s.headingXl} />
            </div>
            <GutenbergList items={POINTS} rhythm="stair" />
          </div>
        </section>

        <section className={s.apply} id="apply">
          <div className={s.applyGrid}>
            <div className={s.applyCopy}>
              <p className={s.eyebrowLight}>Apply</p>
              <RevealTitle text="Join the partner network." className={s.headingXl} />
              <p className={s.sub}>We review every application and reply within five business days.</p>
            </div>
            <Reveal className={s.formCard} from="right">
              {state === "done" ? (
                <div className={s.done} role="status">
                  <h3>Application received</h3>
                  <p>Thank you. Our partnerships team will be in touch shortly.</p>
                </div>
              ) : (
                <>
                  {state === "error" && <p className={s.error} role="alert">{error}</p>}
                  <StepForm
                    steps={steps}
                    onComplete={handleComplete}
                    submitLabel="Submit application"
                    busy={state === "busy"}
                  />
                </>
              )}
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}