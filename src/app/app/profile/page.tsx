import PortalShell from "@/components/PortalShell";
import s from "../portal.module.scss";

const SECTIONS = [
  { title: "Identity", body: "Name, contact, and citizenship details." },
  { title: "Family", body: "Dependents and household members." },
  { title: "Residency", body: "Current status, permits, and renewal dates." },
  { title: "Property", body: "Real estate holdings and titles." },
  { title: "Corporations", body: "Companies, foundations, and structures." },
  { title: "Vehicles", body: "Registered vehicles and inspection dates." },
];

export default function ProfilePage() {
  return (
    <PortalShell title="Legal profile">
      <div className={s.grid}>
        {SECTIONS.map((sec) => (
          <div key={sec.title} className={s.card}>
            <h2 className={s.cardTitle}>{sec.title}</h2>
            <p className={s.cardBody}>{sec.body}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}