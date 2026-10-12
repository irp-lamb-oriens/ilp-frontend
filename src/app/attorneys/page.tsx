"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Nav from "@/components/Nav";
import ValueChain from "@/components/ValueChain";
import { Reveal, RevealTitle } from "@/components/motion/Motion";
import StepForm from "@/components/StepForm";
import { submitLead } from "@/lib/clientDomain";
import { openLeadForm } from "@/lib/leadEvents";
import s from "./page.module.scss";

const HERO_IMAGE =
  "https://images.pexels.com/photos/8112164/pexels-photo-8112164.jpeg";

export default function AttorneysPage() {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("CR");
  const [specialty, setSpecialty] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleComplete = async () => {
    setState("busy");
    try {
      await submitLead({ name, email, country, topic: `Attorney application: ${specialty}` });
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
          <label htmlFor="a-name">Full name</label>
          <input id="a-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <label htmlFor="a-email">Work email</label>
          <input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </>
      ),
    },
    {
      title: "Your jurisdiction",
      body: (
        <>
          <label htmlFor="a-country">Jurisdiction</label>
          <select id="a-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="CO">Colombia</option>
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
          <label htmlFor="a-specialty">Primary specialty</label>
          <input id="a-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Immigration, corporate" />
        </>
      ),
    },
  ];

  return (
    <>
      <Nav />
      <main>
        {/* Hero: headline + subheading left, CTA right */}
        <section
          ref={heroRef}
          className={s.hero}
          style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        >
          <motion.div
            className={s.heroGrid}
            style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
          >
            <div className={s.heroCopy}>
              <Reveal delay={0.05}>
                <p className={s.eyebrowLight}>For lawyers</p>
              </Reveal>
              <RevealTitle
                as="h1"
                text="You should focus on your career."
                className={s.heroTitle}
                delay={0.15}
              />
              <Reveal delay={0.4}>
                <p className={s.heroSub}>
                  We help you bring, organize, retain, reactivate, and nurture
                  your clients so you can 5x your career.
                </p>
              </Reveal>
            </div>
            <Reveal className={s.heroCta} from="right" delay={0.6}>
              <button
                type="button"
                className={s.primary}
                onClick={() => openLeadForm({ topic: "Attorney application" })}
              >
                Join the network
              </button>
            </Reveal>
          </motion.div>
        </section>

        {/* Value chain gallery */}
        <section className={s.chainSection}>
          <div className={s.wrap}>
            <div className={s.head}>
              <p className={s.eyebrowLight}>The lawyer value chain</p>
              <RevealTitle
                text="Everything that took too much time, handled."
                className={s.headingXl}
              />
            </div>
            <ValueChain />
          </div>
        </section>

        {/* Centered CTA */}
        <section className={s.ctaSection}>
          <div className={s.wrap}>
            <Reveal className={s.ctaInner}>
              <RevealTitle
                text="Ready to 5x your practice?"
                className={s.ctaTitle}
              />
              <p className={s.ctaSub}>
                Join a managed legal network where intake, reminders, and client
                organization run on our side.
              </p>
              <button
                type="button"
                className={s.primary}
                onClick={() => openLeadForm({ topic: "Attorney application" })}
              >
                Apply to join
              </button>
            </Reveal>
          </div>
        </section>

        {/* Application form */}
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