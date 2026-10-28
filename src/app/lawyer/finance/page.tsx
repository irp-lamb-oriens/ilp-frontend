import FinanceView from "@/components/lawyer/FinanceView";
import LawyerIntro from "@/components/lawyer/LawyerIntro";

export default function LawyerFinancePage() {
  return (
    <>
      <LawyerIntro screen="finance" />
      <FinanceView />
    </>
  );
}
