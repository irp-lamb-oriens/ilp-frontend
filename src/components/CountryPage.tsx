"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import ParallaxBand from "@/components/ParallaxBand";
import GutenbergList, { type GutenbergItem } from "@/components/GutenbergList";
import { MorphStage, MorphItem, Reveal, RevealTitle } from "@/components/motion/Motion";
import { fetchUpdates, type PublicUpdate } from "@/lib/public";
import { openLeadForm } from "@/lib/leadEvents";
import s from "./CountryPage.module.scss";

export interface CountryStory {
  heroImage: string;
  heroAlt: string;
  headline: string;
  sub: string;
  obligations: GutenbergItem[];
  band: { image: string; alt: string; eyebrow: string; title: string; body: string };
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

  useEffect(() => {
    let active = true;
    fetchUpdates(countryCode).then((rows) => {
      if (active) setUpdates((rows ?? []).slice(0, 6));
    });
    return () => {
      active = false;
    };
  }, [countryCode]);

  const start = () => openLeadForm({ country: countryCode, topic: `${country} obligations` });

  return (
    <>
      <Nav />
      <main>
        <section className={`${s.hero} ${variant === "pinned" ? s.heroRight : ""}`}>
          <div className={s.heroBg} role="img" aria-label={story.heroAlt} style={{ backgroundImage: `url("${story.heroImage}")` }} />
          <div className={s.heroScrim} aria-hidden="true" />
          <div className={s.heroInner}>
            <Reveal className={s.heroGlass} from={variant === "pinned" ? "right" : "left"}>
              <p className={s.eyebrow}>{countryCode} · {country}</p>
              <RevealTitle as="h1" text={story.headline} className={s.headline} />
              <p className={s.sub}>{story.sub}</p>
              <button type="button" className={s.primary} onClick={start}>
                Start free {country} alerts
              </button>
            </Reveal>
          </div>
        </section>

        {variant === "zigzag" ? (
          <section className={s.section}>
            <div className={s.wrap}>
              <div className={s.sectionHead}>
                <p className={s.eyebrowDark}>What we track in {country}</p>
                <RevealTitle text={`The ${country} obligations that cost people most.`} className={s.headingXl} />
              </div>
              <GutenbergList items={story.obligations} rhythm="zigzag" />
            </div>
          </section>
        ) : (
          <PinnedObligations items={story.obligations} country={country} />
        )}

        <ParallaxBand {...story.band} align={variant === "pinned" ? "left" : "right"} />

        {updates && updates.length > 0 && (
          <section className={s.section}>
            <div className={s.wrap}>
              <div className={s.sectionHead}>
                <p className={s.eyebrowDark}>Reviewed this season</p>
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
                Check my {country} deadlines
              </button>
              <p className={s.closeHint}>Free for one country. No card required.</p>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}

/** Panama choreography: each obligation slides in, holds, and exits sideways. */
function PinnedObligations({ items, country }: { items: GutenbergItem[]; country: string }) {
  const slice = 1 / items.length;
  return (
    <section className={s.pinned} aria-label={`What we track in ${country}`}>
      <MorphStage heightVh={90 * items.length}>
        {(progress, reduce) => (
          <div className={s.pinnedInner}>
            <p className={s.pinnedKicker}>What we track in {country}</p>
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
                    <h3>{it.title}</h3>
                    <p>{it.body}</p>
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