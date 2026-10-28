import MoneyView from "@/components/status/MoneyView";
import MembershipBilling from "@/components/status/MembershipBilling";
import MemberIntro from "@/components/status/MemberIntro";
import { PLAN_STANDARD } from "@/lib/contracts";
import s from "./money.module.scss";

const MONTHLY = `US$${(PLAN_STANDARD.monthlyCents / 100).toFixed(2)}`;

export default function MoneyPage() {
  return (
    <>
      <MemberIntro
        screen="money"
        title="Money"
        what="What you owe, what you have paid, and any proposals for legal work beyond your membership."
        how={[
          "Check the balance due at the top.",
          "Read a proposal, then accept it or ask your team a question first.",
          "See your membership plan and its renewal date at the bottom.",
        ]}
        why={`Your membership is ${MONTHLY} a month. Other legal work, such as drafting or filings, is quoted separately, and nothing starts until you accept it.`}
        tutorialId="client.money"
      />
      <div className={s.stack}>
        <MoneyView />
        <MembershipBilling />
      </div>
    </>
  );
}
