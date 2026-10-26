import s from "./DraftBanner.module.scss";

/** Shown on every legal draft until ILP's counsel signs it off (P6). */
export default function DraftBanner({ version }: { version: string }) {
  return (
    <div className={s.banner} role="note">
      <p className={s.title}>Draft — pending review by ILP&apos;s counsel</p>
      <p className={s.text}>
        This text is a working draft. It is not yet final and may change before ILP opens to members. Internal version{" "}
        <code className={s.code}>{version}</code>.
      </p>
    </div>
  );
}
