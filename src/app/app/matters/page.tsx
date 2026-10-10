import PortalShell from "@/components/PortalShell";
import s from "../portal.module.scss";

const MATTERS = [
  { title: "Real estate closing", meta: "Costa Rica · Attorney assigned", status: "In progress" },
  { title: "Residency filing", meta: "Panama · Documents under review", status: "In progress" },
  { title: "Due diligence", meta: "Mexico · Awaiting quote", status: "Scoping" },
];

export default function MattersPage() {
  return (
    <PortalShell title="Active matters & document vault">
      <div className={s.list}>
        {MATTERS.map((m) => (
          <div key={m.title} className={s.row}>
            <div>
              <div className={s.rowTitle}>{m.title}</div>
              <div className={s.rowMeta}>{m.meta}</div>
            </div>
            <span className={s.badge}>{m.status}</span>
          </div>
        ))}
      </div>
      <p className={s.empty}>
        Open, scoped legal projects with status, assigned attorneys, deadlines,
        and secure documents appear here.
      </p>
    </PortalShell>
  );
}