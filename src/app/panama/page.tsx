import CountryPage, { type CountryStory } from "@/components/CountryPage";

const IMG = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2000`;

const story: CountryStory = {
  heroImage: "https://images.pexels.com/photos/14465475/pexels-photo-14465475.jpeg?auto=compress&cs=tinysrgb&w=1920",
  heroAlt: "People in a meeting reviewing documents",
  headline: "Panama obligations, organized and on time.",
  sub: "Corporate franchise tax, registered agent duties, residency renewals and property obligations: the dates people with a home or company in Panama keep track of.",
  obligations: [
    { kicker: "Corporate", title: "Annual franchise tax", body: "Every corporation and foundation owes the tasa única each year. Pay late and you get extra fees, and the company can be shut down." },
    { kicker: "Registered agent", title: "Keep your agent and records current", body: "Your beneficial-owner details and accounting records must stay with your registered agent. If they don't, the company can be shut down." },
    { kicker: "Residency", title: "Friendly Nations and pensionado renewals", body: "Residency cards renew on a set schedule. If you miss the window, you may have to start over." },
    { kicker: "Property", title: "Property tax and exemption deadlines", body: "Tax exemptions expire. When one does, you get a bill you weren't expecting." },
  ],
  band: {
    image: IMG(3184296),
    alt: "A clean, modern workspace",
    eyebrow: "Not open yet",
    title: "ILP is not open in Panama yet.",
    body: "ILP is open in Costa Rica now, and Panama is planned after Costa Rica.",
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