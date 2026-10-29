import ExperimentResultsView from "@/components/dashboard/journeys/ExperimentResultsView";

export default async function ExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExperimentResultsView id={decodeURIComponent(id)} />;
}
