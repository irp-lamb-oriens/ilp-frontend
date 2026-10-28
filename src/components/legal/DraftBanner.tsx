import { Notice } from "@/components/ui";

/**
 * Shown on every legal draft until ILP's counsel signs it off (P6). It hides
 * itself once the version id no longer contains "draft".
 */
export default function DraftBanner({ version }: { version: string }) {
  if (!/draft/i.test(version)) return null;
  return (
    <Notice
      tone="neutral"
      variant="banner"
      title="Draft: pending review by ILP's counsel"
      terms={["counsel"]}
      fix={{
        steps: [
          "Nothing to do. You can read this page as it stands today.",
          "The wording may still change before ILP opens to members. If it changes in a way that needs your agreement, ILP asks you again.",
          "For ILP staff: once counsel approves the text, set its final version id (without \"draft\") in components/legal/versions.ts and in server/API/privacy/policy.ts. This banner then disappears.",
        ],
      }}
    >
      <p>
        This text is a working draft and may change before ILP opens to members. Internal version <code>{version}</code>.
      </p>
    </Notice>
  );
}
