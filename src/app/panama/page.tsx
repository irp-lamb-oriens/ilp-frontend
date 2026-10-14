import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/14465475/pexels-photo-14465475.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People in a meeting reviewing documents",
  headline: "Panama obligations, organized and on time.",
  sub: "Corporate franchise tax, registered agent duties, residency renewals, and property obligations, watched for you by Panamanian professionals.",
  obligations: [
    { kicker: "Corporate", title: "Annual franchise tax", body: "Every corporation and foundation owes the tasa única each year. Pay late and you get extra fees, and the company can be shut down. We file it before it's due." },
    { kicker: "Registered agent", title: "Keep your agent and records current", body: "Your beneficial-owner details and accounting records must stay with your registered agent. If they don't, the company can be shut down. We watch the dates and the documents." },
    { kicker: "Residency", title: "Friendly Nations and pensionado renewals", body: "Residency cards renew on a set schedule. If you miss the window, you may have to start over. We remind you before it closes." },
    { kicker: "Property", title: "Property tax and exemption deadlines", body: "Tax exemptions expire. When one does, you get a bill you weren't expecting. We watch the dates so the exemption never runs out." },
  ],
  band: {
    image: IMG(3184296),
    alt: "A clean, modern workspace",
    eyebrow: "Local partners",
    title: "Panamanian professionals keep every rule current.",
    body: "Regulation changes land in your alerts after local review. When you need advice, book a partner in Panama City.",
  },
  glossary: {
    "tasa única": "Panama's yearly flat fee every corporation and foundation must pay.",
    "registered agent": "The local firm that holds your company's legal records and mail in Panama.",
    "beneficial-owner": "The real person or people who own and control a company.",
    "Friendly Nations": "Panama's residency visa for citizens of a list of friendly countries.",
    pensionado: "Panama's residency visa for retirees with a qualifying pension.",
  },
};

export default function PanamaPage() {
  return <CountryPage country="Panama" countryCode="PA" story={story} variant="pinned" />;
}