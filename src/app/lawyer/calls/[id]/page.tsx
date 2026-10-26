import CallView from "@/components/lawyer/CallView";

export default async function LawyerCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CallView consultationId={decodeURIComponent(id)} />;
}
