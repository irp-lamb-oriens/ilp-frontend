"use client";

import { useEffect, useState } from "react";
import { Button, Dialog, TextInput } from "@/components/ui";
import { type AgreementText, getAgreement } from "@/app/join/joinApi";
import s from "./join.module.scss";

/**
 * AGREEMENT: the member reads the Membership Agreement (the same text the
 * server prints in the signed PDF) and signs by typing their full name.
 * After payment the signed PDF is in their ILP home under documents.
 */
export default function AgreementSign({
  value,
  onChange,
  error,
  onVersion,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  /** Tells the form which version was shown, so the server can refuse a stale one. */
  onVersion: (version: string) => void;
}) {
  const [agreement, setAgreement] = useState<AgreementText | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    getAgreement()
      .then((a) => {
        if (!live) return;
        setAgreement(a);
        onVersion(a.version);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // onVersion is stable enough: the version is read once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={s.agreement} data-field="signature">
      <h3 className={s.agreementTitle}>Sign your membership agreement</h3>
      <p className={s.payNote}>
        One short agreement says what your membership includes, what it costs, that it renews every month until you cancel, and how to cancel online. After you pay, the signed copy is saved in your ILP home.
      </p>
      <div>
        <Button type="button" variant="secondary" onClick={() => setOpen(true)} disabled={!agreement}>
          Read the agreement
        </Button>
      </div>
      <TextInput
        label="Type your full name to sign"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        required
        autoComplete="name"
        hint="Typing your name here is your electronic signature."
        inputClassName={s.signature}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={agreement?.title ?? "Membership agreement"}
        footer={<Button onClick={() => setOpen(false)}>Close</Button>}
      >
        {agreement && (
          <div className={s.agreementText}>
            {agreement.draft && <p className={s.payNote}>Draft text, pending review by ILP&apos;s counsel.</p>}
            {agreement.sections.map((sec) => (
              <section key={sec.heading}>
                <h4>{sec.heading}</h4>
                {sec.body.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </section>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}
