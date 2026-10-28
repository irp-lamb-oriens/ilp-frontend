import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ApplyIntro from "@/components/lawyers/ApplyIntro";
import ApplyForm from "@/components/lawyers/ApplyForm";
import s from "@/components/lawyers/apply.module.scss";

export const metadata: Metadata = {
  title: "Apply as a partner lawyer | ILP",
  description: "Apply to take 20-minute video calls with ILP members as a partner lawyer licensed in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain.",
  robots: { index: true, follow: true },
};

/** Partner lawyer application (T2). /attorneys/apply redirects here. */
export default function LawyerApplyPage() {
  return (
    <>
      <Nav />
      <main className={s.page}>
        <div className={s.wrap}>
          <ApplyIntro />
          <ApplyForm />
        </div>
      </main>
    </>
  );
}
