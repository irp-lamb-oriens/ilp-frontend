import { Suspense } from "react";
import ClientsView from "@/components/lawyer/ClientsView";
import LawyerIntro from "@/components/lawyer/LawyerIntro";

export default function LawyerClientsPage() {
  return (
    <>
      <LawyerIntro screen="clients" />
      <Suspense>
        <ClientsView />
      </Suspense>
    </>
  );
}
