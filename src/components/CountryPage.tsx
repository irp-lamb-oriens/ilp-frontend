"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import ParallaxBand from "@/components/ParallaxBand";
import GutenbergList, { type GutenbergItem } from "@/components/GutenbergList";
import { MorphStage, MorphItem, Reveal, RevealTitle } from "@/components/motion/Motion";
import { renderGlossary } from "@/components/Term";
import { fetchUpdates, type PublicUpdate } from "@/lib/public";
import { useRouter } from "next/navigation";
import { CLAIM, CHECK_CTA } from "@/components/landing/content";
import { COUNTRIES, isCountryCode } from "@/lib/contracts";
import { setCountryContext } from "@/lib/countryContext";
import s from "./CountryPage.module.scss";

export interface CountryStory {
  heroImage: string;
  heroAlt: string;
  headline: string;
  sub: string;
  obligations: GutenbergItem[];
  band: { image: string; alt: string; eyebrow: string; title: string; body: string };
  /** Country-specific terms and their plain-language glosses. */
  glossary?: Record<string, string>;
}

interface CountryPageProps {
  country: string;
  countryCode: string; // ISO alpha-2
  story: CountryStory;
  /** zigzag: Gutenberg cascade. pinned: obligations morph through a locked stage. */
  variant?: "zigzag" | "pinned";
}

export default function CountryPage({ country, countryCode, story, variant = "zigzag" }: CountryPageProps) {
  const [updates, setUpdates] = useState<PublicUpdate[] | null>(null);
  const router = useRouter();
  const info = isCountryCode(countryCode) ? COUNTRIES[countryCode] : null;

  useEffect(() => {
    let active = true;
    fetchUpdates(countryCode).then((rows) => {
      if (active) setUpdates((rows ?? []).slice(0, 6));
    });
    return () => {
      active = false;
    };
  }, [countryCode]);

  // COUNTRIES: every country is open; the check starts on this country's questions.
  const start = () => {
    setCountryContext(countryCode);
    router.push(`/check?country=${countryCode}`);
  };

  return (
    <>
      <Nav />
      <main>
        <section className={`${s.hero} ${variant === "pinned" ? s.heroRight : ""}`}>
          <div className={s.heroBg} role="img" aria-label={story.heroAlt} style={{ backgroundImage: `url("${story.heroImage}")` }} />
          <div className={s.heroInner}>
            <Reveal className={s.heroGlass} from={variant === "pinned" ? "right" : "left"}>
              <p className={s.eyebrow}>{countryCode} · {country}</p>
              <RevealTitle as="h1" text={story.headline} className={s.headline} glossary={story.glossary} />
              <p className={s.claim}>{CLAIM}</p>
              <p className={s.sub}>{renderGlossary(story.sub, story.glossary)}</p>
              <button type="button" className={s.primary} onClick={start}>
                {CHECK_CTA}
              </button>
            </Reveal>
          </div>
        </section>

        {variant === "zigzag" ? (
          <section className={s.section}>
            <div className={s.wrap}>
              <div className={s.sectionHead}>
                <p className={s.eyebrowDark}>{`What we track in ${country}`}</p>
                <RevealTitle text={`The ${country} obligations that cost people most.`} className={s.headingXl} />
              </div>
              <GutenbergList items={story.obligations} rhythm="zigzag" glossary={story.glossary} />
            </div>
          </section>
        ) : (
          <PinnedObligations items={story.obligations} country={country} glossary={story.glossary} />
        )}

        <ParallaxBand {...story.band} align={variant === "pinned" ? "left" : "right"} />

        {info && (
          <section className={s.section} aria-labelledby="country-facts">
            <div className={s.wrap}>
              <div className={s.sectionHead}>
                <p className={s.eyebrowDark}>Good to know</p>
                <RevealTitle text={`${country} at a glance`} className={s.headingXl} />
              </div>
              <ul className={s.updatesList} id="country-facts">
                {[
                  ["Currency", info.currency.name],
                  ["Languages", info.languages.join(", ")],
                  [info.timeZones.length > 1 ? "Time zones" : "Time zone", info.timeZones.map((z) => z.label).join("; ")],
                  ["IDs you may deal with", info.foreignerIds.join(", ")],
                  ["Local company forms", info.companyForms.join(", ")],
                  ["Who licenses lawyers", info.lawyerBody.name],
                  ["Notaries", info.notaryBody.name],
                ].map(([label, value], i) => (
                  <li key={label}>
                    <Reveal className={s.update} delay={i * 0.04}>
                      <span className={s.updateTitle}>{value}</span>
                      <span className={s.updateCategory}>{label}</span>
                    </Reveal>
                  </li>
                ))}
              </ul>
              <p className={s.closeHint}>
                Every date we list for {country} comes from our research of official sources and is marked as something that may require review. Partner lawyers licensed in {country} confirm what applies to you.
              </p>
            </div>
          </section>
        )}

        {updates && updates.length > 0 && (
          <section className={s.section}>
            <div className={s.wrap}>
              <div className={s.sectionHead}>
                <p className={s.eyebrowDark}>Legal updates</p>
                <RevealTitle text={`Latest legal updates in ${country}`} className={s.headingXl} />
              </div>
              <ul className={s.updatesList}>
                {updates.map((u, i) => (
                  <li key={u.id}>
                    <Reveal className={s.update} delay={i * 0.06}>
                      <span className={s.updateTitle}>{u.title ?? "Legal update"}</span>
                      {u.category && <span className={s.updateCategory}>{u.category}</span>}
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className={s.close}>
          <div className={s.wrap}>
            <Reveal className={s.closeInner}>
              <RevealTitle text={`Your next ${country} deadline, on your calendar first.`} className={s.closeTitle} />
              <button type="button" className={s.primary} onClick={start}>
                {CHECK_CTA}
              </button>
              <p className={s.closeHint}>The check is free and takes about two minutes. You do not need an account.</p>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}

/** Panama choreography: each obligation slides in, holds, and exits sideways. */
function PinnedObligations({
  items,
  country,
  glossary,
}: {
  items: GutenbergItem[];
  country: string;
  glossary?: Record<string, string>;
}) {
  const slice = 1 / items.length;
  return (
    <section className={s.pinned} aria-label={`Dates to know in ${country}`}>
      <MorphStage heightVh={90 * items.length}>
        {(progress, reduce) => (
          <div className={s.pinnedInner}>
            <p className={s.pinnedKicker}>Dates to know in {country}</p>
            <div className={reduce ? s.pinnedStatic : s.pinnedLayer}>
              {items.map((it, i) => {
                const a = i * slice;
                return (
                  <MorphItem
                    key={it.title}
                    progress={progress}
                    reduce={reduce}
                    axis="x"
                    range={[a, a + slice * 0.3, a + slice * 0.75, i === items.length - 1 ? 1 : a + slice]}
                    className={reduce ? s.pinnedCardStatic : s.pinnedCard}
                  >
                    <span className={s.pinnedIndex}>{it.kicker ?? String(i + 1).padStart(2, "0")}</span>
                    <h3>{renderGlossary(it.title, glossary)}</h3>
                    <p>{renderGlossary(it.body, glossary)}</p>
                  </MorphItem>
                );
              })}
            </div>
          </div>
        )}
      </MorphStage>
    </section>
  );
}