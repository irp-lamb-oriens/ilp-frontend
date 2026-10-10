# ILP Frontend Style Guide

The single source of truth for how the ILP frontend looks and moves. Every new
page, component, and SCSS module must follow these rules. When a rule and a
one-off design idea conflict, the rule wins.

## 1. Brand book

- **Name:** ILP — International Legal Partner.
- **Tagline:** "Less color. More clarity. More trust."
- **Voice:** plain, specific, confident. No filler verbs ("elevate", "seamless",
  "unleash", "next-gen"). No exclamation marks in success copy. Active voice.
- **Logo:** `big-square-logo.png` at the repo root; the nav renders it at a
  small rounded size. Do not hand-draw a replacement SVG.

## 2. Color tokens

All colors come from `src/styles/_variables.scss`. Never hardcode a hex in a
component; import the token.

| Token | Value | Role |
| --- | --- | --- |
| `$color-accent` | `#5cccf7` | Light Blue — CTAs, accents, status |
| `$color-navy` | `#123b5d` | Deep Navy — headlines, section titles, formal info |
| `$color-charcoal` | `#202a33` | Charcoal — primary body text |
| `$color-canvas` | `#ffffff` | White — dominant canvas |
| `$color-mist` | `#eff7fb` | Mist — secondary background tint |
| `$color-cool-gray` | `#d9e1e6` | Cool Gray — supporting neutral |
| `$color-steel` | `#4a5a66` | readable secondary text on white |
| `$color-muted` | `#7a8a96` | tertiary text |
| `$color-hairline` | `rgba(18,59,93,0.14)` | 1px borders / dividers |
| `$color-accent-ink` | `#123b5d` | text on the light-blue field |
| `$color-accent-soft` | `#eaf7fd` | light-blue tinted surface |
| `$color-error` | `#c0392b` | errors |
| `$color-warning` | `#b7791f` | warnings |
| `$color-success` | `#1f7a5c` | success |

**Rules:**
- One accent (Light Blue). No purple, no neon, no gradients on text.
- No pure `#000000`. Use `$color-charcoal` / `$color-navy`.
- One palette per page. Do not mix warm and cool grays.
- Accent is used identically across every section of a page.

## 3. Typography

- **Stack:** `$font-sans` = `"Helvetica Neue", Helvetica, Arial, "Segoe UI",
  sans-serif`. `$font-mono` = `"SFMono-Regular", "Menlo", "Consolas", monospace`.
- **Headlines:** `$color-navy`, tight tracking (`-0.02em` to `-0.025em`),
  line-height `1.05`–`1.1`. Use the `heading-xl` / `heading-lg` mixins.
- **Body:** `$color-charcoal`, line-height `1.6`, max-width `65ch`.
- **Eyebrows:** `$font-mono`, `0.75rem`, uppercase, `letter-spacing: 0.14em`,
  `$color-navy`. Use the `eyebrow` mixin. At most one eyebrow per three sections.
- **No serif** anywhere. No `Inter`. No title-case headings — sentence case.

## 4. Spacing, radius, shadow

- **Spacing scale** (`$space-1` … `$space-24`): `0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 /
  3 / 4 / 6` rem. Use tokens, never raw `px` for layout.
- **Sections:** `$space-16` mobile, `$space-24` desktop (the `section` mixin).
- **Radius:** flat and restrained — `$radius-sm` 6px, `$radius-md` 10px,
  `$radius-lg` 14px, `$radius-pill` 999px. One radius system per page.
- **Shadow:** minimal. `$shadow-card` = `0 1px 2px rgba(18,59,93,0.06)`. No
  heavy drop shadows, no outer glows. Prefer hairline borders over elevation.

## 5. Components & mixins

Reach for a mixin before inventing a class. All live in `src/styles/_mixins.scss`.

- `container` — max-width 1400px, centered, responsive padding.
- `card` — white surface, hairline border, `$radius-lg`, whisper shadow.
- `button-primary` — pill, `$color-accent` fill, `$color-accent-ink` text.
- `button-ghost` — pill, hairline border, white fill.
- `press` — `transform: scale(0.97)` on `:active`, 160ms strong ease-out.
- `eyebrow`, `section`, `heading-xl`, `heading-lg`, `section-head`.
- `md` / `lg` — breakpoint media queries (`$bp-md` 768px, `$bp-lg` 1024px).

**Buttons:** text must be readable against the fill (accent-ink on accent).
No CTA label wraps to two lines at desktop. One primary CTA per viewport tier.

## 6. Motion rules

- **Animate only `transform` and `opacity`.** Never `top`/`left`/`width`/`height`.
- **Easing:** strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for entrances and
  press feedback. Never `ease-in` on UI.
- **Durations:** press 100–160ms, tooltips 125–200ms, dropdowns 150–250ms,
  modals/drawers 200–500ms. UI stays under 300ms.
- **Never `scale(0)`.** Start from `scale(0.95)` + `opacity: 0`.
- **Popovers/dropdowns** scale from their trigger (`transform-origin`), not center.
- **Transitions, not keyframes**, for anything triggered rapidly (toasts, toggles).
- **Honor `prefers-reduced-motion`**: keep opacity/color, drop movement.
- **Gate hover motion** behind `@media (hover: hover) and (pointer: fine)`.
- **No animation on keyboard-initiated or 100+/day actions.**

## 7. Layout rules

- **Grid over flexbox math.** No `calc(33% - 1rem)` hacks.
- **No centered hero** — use split, left-aligned, or asymmetric layouts.
- **No 3-equal-card feature rows.** Use zig-zag, asymmetric grid, or horizontal scroll.
- **Mobile collapse:** every multi-column layout falls back to single column
  (`width: 100%`, `padding: 1rem`) below `$bp-md`.
- **Full-height sections:** `min-height: 100dvh`, never `height: 100vh`.
- **No overlapping elements.** Each element occupies its own grid cell / flow position.
- **No horizontal scroll** on mobile.

## 8. Content rules

- No generic names ("John Doe", "Acme"). Use realistic, locale-appropriate names.
- No fake-perfect numbers (`99.99%`, `50%`). Use organic data (`47.2%`).
- No filler verbs ("elevate", "seamless", "unleash", "next-gen").
- No emojis in code, markup, or alt text.
- No lorem ipsum. Write real draft copy.
- No scroll cues ("Scroll to explore"), no version labels in the hero, no
  section-number eyebrows (`00 / INDEX`), no decorative status dots.

## 9. Accessibility

- Every interactive element: visible focus ring (`outline: 2px solid
  $color-accent; outline-offset: 2px`).
- Touch targets ≥ 44px.
- Meaningful images get descriptive `alt` text.
- Form labels sit above inputs; error text below; helper text optional.
- WCAG AA contrast for body text (4.5:1), large text (3:1).

## 10. File conventions

- One SCSS module per component, co-located (`Component.tsx` +
  `Component.module.scss`).
- Import tokens with `@use "../styles/variables" as *;` and
  `@use "../styles/mixins" as *;`.
- No Tailwind. No inline styles. No global CSS except the token files.
- New shared primitives go in `src/styles/_mixins.scss`, not page-specific CSS.