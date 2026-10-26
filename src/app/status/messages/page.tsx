import MessagesThread from "@/components/status/MessagesThread";
import AiNotice from "@/components/legal/AiNotice";

export default function MessagesPage() {
  return (
    <>
      {/* P6: one-time AI assistant notice (consent record), until accepted. */}
      <AiNotice />
      <MessagesThread />
    </>
  );
}
