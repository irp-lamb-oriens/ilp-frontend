"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import ParallaxBand from "@/components/ParallaxBand";
import GutenbergList from "@/components/GutenbergList";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      await submitLead({ name, email, country, topic: `Lawyer application: ${specialty}` });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your application.");
      setState("error");
    }
  };

  return (
    <>
      <Nav />
      <main>
        <ParallaxBand
          image={IMG(5668790)}
          alt="Lawyer working at a desk with legal books"
          eyebrow="For legal partners"
          title="Vetted clients, routed to your specialty."
          body="Join a managed legal network. ILP handles intake, reminders, and client organization so your time goes to the work only a lawyer can do."
          align="left"
        />

        <section className={s.dark}>
          <div className={s.wrap}>
            <div className={s.head}>
              <p className={s.eyebrow}>Why partners join</p>
              <RevealTitle text="Less admin. Better-prepared clients." className={s.headingXl} />
            </div>
            <GutenbergList items={POINTS} rhythm="stair" tone="dark" />
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
                <form className={s.form} onSubmit={submit}>
                  <label htmlFor="l-name">Full name</label>
                  <input id="l-name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  <label htmlFor="l-email">Work email</label>
                  <input id="l-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  <label htmlFor="l-country">Jurisdiction</label>
                  <select id="l-country" value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="CR">Costa Rica</option>
                    <option value="PA">Panama</option>
                    <option value="MX">Mexico</option>
                    <option value="ES">Spain</option>
                    <option value="PT">Portugal</option>
                  </select>
                  <label htmlFor="l-specialty">Primary specialty</label>
                  <input id="l-specialty" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Immigration, corporate" />
                  {state === "error" && <p className={s.error} role="alert">{error}</p>}
                  <button type="submit" className={s.primary} disabled={state === "busy"}>
                    {state === "busy" ? "Sending…" : "Submit application"}
                  </button>
                </form>
              )}
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}