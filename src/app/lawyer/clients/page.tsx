import { Suspense } from "react";
import ClientsView from "@/components/lawyer/ClientsView";

export default function LawyerClientsPage() {
  return (
    <Suspense>
      <ClientsView />
    </Suspense>
  );
}
