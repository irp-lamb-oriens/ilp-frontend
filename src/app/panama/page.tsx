import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: IMG(3184636),
  heroAlt: "People in a meeting reviewing documents",
  headline: "Panama obligations, organized and on time.",
  sub: "Corporate franchise tax, registered agent duties, residency renewals, and property obligations, watched for you by Panamanian professionals.",
  obligations: [
    { kicker: "Corporate", title: "Annual franchise tax", body: "Every Panamanian corporation and foundation owes a yearly fee. Late payment brings surcharges and can suspend the entity." },
    { kicker: "Registered agent", title: "Keep your agent and records current", body: "Beneficial-owner information and accounting records must stay with your registered agent, on time." },
    { kicker: "Residency", title: "Friendly Nations and pensionado renewals", body: "Provisional and permanent residency cards renew on fixed cycles. We remind you before the window closes." },
    { kicker: "Property", title: "Property tax and exemption deadlines", body: "Exemptions expire. We track the dates so a lapsed exemption never turns into a surprise bill." },
  ],
  band: {
    image: IMG(3184296),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Panamanian professionals keep every rule current.",
    body: "Regulation changes land in your alerts after local review. When you need advice, book a partner in Panama City.",
  },
};

export default function PanamaPage() {
  return <CountryPage country="Panama" countryCode="PA" story={story} variant="pinned" />;
}