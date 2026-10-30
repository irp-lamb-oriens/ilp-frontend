import { ImageResponse } from "next/og";

/** Open Graph image size (1200x630, the size every network crops well). */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const NAVY = "#123b5d";
const ACCENT = "#5cccf7";
const STEEL = "#4a5a66";

/**
 * Flat brand card for social previews: white, navy text, one light-blue
 * accent rule. No photos, gradients or shadows (rules.md).
 */
export function renderOg({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 14, height: 56, background: ACCENT }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: NAVY }}>International Legal Partner</div>
            <div style={{ fontSize: 22, color: STEEL, letterSpacing: 2, textTransform: "uppercase" }}>{eyebrow}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 66, fontWeight: 700, color: NAVY, lineHeight: 1.1, maxWidth: 1000 }}>{title}</div>
          <div style={{ fontSize: 30, color: STEEL, lineHeight: 1.4, maxWidth: 980 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `2px solid ${ACCENT}`, paddingTop: 24 }}>
          <div style={{ fontSize: 24, color: NAVY }}>internationallegalpartner.com</div>
          <div style={{ fontSize: 22, color: STEEL }}>A membership service, not a law firm</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
