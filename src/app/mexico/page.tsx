import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/7772191/pexels-photo-7772191.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People reviewing documents at a table",
  headline: "Mexico obligations, organized and on time.",
  sub: "SAT filings, temporary and permanent residency timelines, and property obligations, mapped to your situation by local professionals.",
  obligations: [
    { kicker: "Tax", title: "SAT filings on schedule", body: "Residents and business owners owe the SAT regular reports. Fall behind and renewals and other filings can be blocked. We watch every date." },
    { kicker: "Residency", title: "Temporary and permanent renewals", body: "Residency cards renew on a set schedule. If you miss the window, you may have to start over. We remind you before it closes." },
    { kicker: "Property", title: "Predial and local obligations", body: "Property tax and local duties change from state to state, and a fideicomiso adds a yearly trust fee. We match yours to the right dates." },
    { kicker: "Business", title: "Corporate and registry duties", body: "Yearly filings and registry requirements each have their own due date. We keep them on your calendar." },
  ],
  band: {
    image: IMG(3183197),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Mexican professionals keep the rules current.",
    body: "When a rule changes, your alerts change with it. When you need advice, book a partner who practices where you live.",
  },
  glossary: {
    SAT: "Mexico's tax authority, which you file your returns with.",
    predial: "The yearly property tax paid to your local government in Mexico.",
    fideicomiso: "A bank trust that lets foreigners own property near Mexico's coast and border.",
  },
};

export default function MexicoPage() {
  return <CountryPage country="Mexico" countryCode="MX" story={story} variant="zigzag" />;
}