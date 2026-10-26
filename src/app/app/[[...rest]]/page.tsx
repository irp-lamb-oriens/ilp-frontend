import { redirect } from "next/navigation";

/**
 * The old /app/* customer stubs were folded into the member home (/status).
 * Keep their links working: profile → Profile, book → booking, the rest →
 * Overview (calls, matters and reminders all live there now).
 */
const TARGET: Record<string, string> = {
  profile: "/status/profile",
  book: "/status/book",
  consultations: "/status",
  matters: "/status",
  reminders: "/status",
};

export default async function LegacyAppRedirect({ params }: { params: Promise<{ rest?: string[] }> }) {
  const { rest } = await params;
  redirect(TARGET[rest?.[0] ?? ""] ?? "/status");
}
