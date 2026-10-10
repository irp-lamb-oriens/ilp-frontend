import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: IMG(3183150),
  heroAlt: "People reviewing documents at a table",
  headline: "Mexico obligations, organized and on time.",
  sub: "SAT filings, temporary and permanent residency timelines, and property obligations, mapped to your situation by local professionals.",
  obligations: [
    { kicker: "Tax", title: "SAT filings on schedule", body: "Residents and business owners have recurring tax obligations. We track the dates so nothing is missed." },
    { kicker: "Residency", title: "Temporary and permanent renewals", body: "Residency cards renew on fixed cycles. We remind you before the window closes." },
    { kicker: "Property", title: "Predial and local obligations", body: "Property tax and municipal duties vary by state. We map yours to the right dates." },
    { kicker: "Business", title: "Corporate and registry duties", body: "Annual filings and registry requirements each have their own deadline." },
  ],
  band: {
    image: IMG(3183197),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Mexican professionals keep the rules current.",
    body: "When a rule changes, your alerts change with it. When you need advice, book a partner who practices where you live.",
  },
};

export default function MexicoPage() {
  return <CountryPage country="Mexico" countryCode="MX" story={story} variant="zigzag" />;
}