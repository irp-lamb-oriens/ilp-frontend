import LegalPage from "@/components/LegalPage";

export default function LiabilityProtectionPage() {
  return (
    <LegalPage
      title="Professional Liability Protection Terms"
      updated="October 2026"
      sections={[
        {
          heading: "What it is",
          body: [
            "ILP plans to provide conditional professional liability protection of up to $100,000 for eligible covered services, as part of the membership offering.",
          ],
        },
        {
          heading: "Eligibility",
          body: [
            "Coverage applies only to eligible covered services performed by vetted legal professionals through the platform. It does not apply to services outside the platform or to individualized legal projects scoped and paid separately.",
          ],
        },
        {
          heading: "Conditions and exclusions",
          body: [
            "Coverage is conditional and subject to the terms of the underlying policy, including exclusions, limits, and deductibles. It is not a guarantee of any particular outcome.",
          ],
        },
        {
          heading: "Status",
          body: [
            "This protection layer is planned and not yet active. Members will be notified when it becomes available, and the full policy terms will be provided at that time.",
          ],
        },
      ]}
    />
  );
}