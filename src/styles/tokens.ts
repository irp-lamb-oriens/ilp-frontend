/**
 * tokens.ts — design tokens for code that cannot read SCSS (charts, canvas).
 * Values mirror src/styles/_variables.scss. Chart code imports colors from
 * here only; never hardcode a hex in a component.
 */

export const color = {
  accent: "#5cccf7",
  navy: "#123b5d",
  charcoal: "#202a33",
  canvas: "#ffffff",
  mist: "#eff7fb",
  coolGray: "#d9e1e6",
  steel: "#4a5a66",
  muted: "#7a8a96",
  hairline: "rgba(18, 59, 93, 0.14)",
  error: "#c0392b",
  warning: "#b7791f",
  /** Notice and warning-pill line color: warning mixed toward steel. */
  noticeWarning: "#8e6d3a",
  success: "#1f7a5c",
} as const;

/** Ordered series colors: one hue family (navy → accent), no second accent. */
export const chartSeries = [
  "#123b5d",
  "#5cccf7",
  "#4a5a66",
  "#9fd9ef",
  "#7a8a96",
] as const;

export const chart = {
  series: chartSeries,
  grid: "#d9e1e6",
  axis: "#7a8a96",
  label: "#4a5a66",
  tooltipBg: "#ffffff",
  tooltipBorder: "rgba(18, 59, 93, 0.14)",
  positive: "#1f7a5c",
  negative: "#c0392b",
} as const;

/** Series color by index; wraps after the palette ends. */
export function seriesColor(i: number): string {
  return chartSeries[((i % chartSeries.length) + chartSeries.length) % chartSeries.length];
}
