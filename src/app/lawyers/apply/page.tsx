import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import Nav from "@/components/Nav";
import ApplyIntro from "@/components/lawyers/ApplyIntro";
import ApplyForm from "@/components/lawyers/ApplyForm";
import s from "@/components/lawyers/apply.module.scss";

export const metadata: Metadata = pageMetadata("/lawyers/apply");

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
