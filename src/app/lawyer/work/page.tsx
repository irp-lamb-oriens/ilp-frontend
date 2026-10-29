import WorkOffersView from "@/components/lawyer/WorkOffersView";
import LawyerIntro from "@/components/lawyer/LawyerIntro";

export default function LawyerWorkPage() {
  return (
    <>
      <LawyerIntro screen="work" />
      <WorkOffersView />
    </>
  );
}
