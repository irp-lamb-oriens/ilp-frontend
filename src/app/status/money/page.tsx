import MoneyView from "@/components/status/MoneyView";
import MembershipBilling from "@/components/status/MembershipBilling";
import s from "./money.module.scss";

export default function MoneyPage() {
  return (
    <div className={s.stack}>
      <MoneyView />
      <MembershipBilling />
    </div>
  );
}
