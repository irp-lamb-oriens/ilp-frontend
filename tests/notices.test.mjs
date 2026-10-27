// Run: npm test. Notices (docs/workstreams/NOTICES.md): no yellow or amber
// backgrounds anywhere, and every warning or danger <Notice> says how to fix it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";

register("./tsResolve.mjs", import.meta.url);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

function walk(dir, ext, out = []) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (ext.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p);

// ─── No yellow / amber fills ────────────────────────────────────────────────

/** Files allowed to name warning colors as a background. */
const BG_ALLOW = new Set(["src/components/ui/Notice.module.scss", "src/styles/_variables.scss"]);
/** Data marks, not notices: the warning progress fill in the tutorial mock mirrors ProgressBar. */
const SELECTOR_ALLOW = [{ file: "src/components/tutorial/mock/MockScene.module.scss", selector: ".fill_warning" }];

const WARNING_TOKEN = /\$(color-warning(-soft)?|notice-warning)\b/;
const NAMED = /\b(yellow|gold|goldenrod|orange|khaki|moccasin|wheat|lightyellow|lemonchiffon|papayawhip|cornsilk|beige)\b/i;

/** True for a hex whose hue reads as yellow / amber / orange and is not near-gray. */
function warmHex(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
  if (h.length < 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 0.06) return false;
  const l = (max + min) / 2;
  const sat = d / (1 - Math.abs(2 * l - 1));
  if (sat < 0.25) return false;
  let hue;
  if (max === r) hue = 60 * (((g - b) / d) % 6);
  else if (max === g) hue = 60 * ((b - r) / d + 2);
  else hue = 60 * ((r - g) / d + 4);
  if (hue < 0) hue += 360;
  return hue >= 25 && hue <= 65;
}

/** [selector, declaration] pairs for background declarations (flat walk, good enough for our modules). */
function backgrounds(css) {
  const out = [];
  const stack = [];
  let buf = "";
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")) {
    if (ch === "{") {
      stack.push(buf.trim());
      buf = "";
    } else if (ch === "}") {
      stack.pop();
      buf = "";
    } else if (ch === ";") {
      const decl = buf.trim();
      if (/^background(-color)?\s*:/.test(decl)) out.push([stack.join(" "), decl]);
      buf = "";
    } else buf += ch;
  }
  return out;
}

test("notices: no SCSS paints a warning, amber or yellow background", () => {
  const bad = [];
  for (const file of walk(SRC, [".scss"])) {
    const r = rel(file);
    if (BG_ALLOW.has(r)) continue;
    for (const [sel, decl] of backgrounds(readFileSync(file, "utf8"))) {
      if (SELECTOR_ALLOW.some((a) => a.file === r && sel.split(/[\s,]+/).includes(a.selector))) continue;
      const hexes = decl.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
      if (WARNING_TOKEN.test(decl) || NAMED.test(decl) || hexes.some(warmHex)) bad.push(`${r} ${sel} { ${decl} }`);
    }
  }
  assert.deepEqual(bad, [], `warning-colored backgrounds (use <Notice>):\n${bad.join("\n")}`);
});

test("notices: the old warning fill token is gone", () => {
  const vars = readFileSync(path.join(SRC, "styles/_variables.scss"), "utf8");
  assert.ok(!/\$color-warning-soft\s*:/.test(vars), "$color-warning-soft is back in _variables.scss");
  assert.ok(warmHex("#fbf3e6") && warmHex("#b7791f") && !warmHex("#123b5d") && !warmHex("#eff7fb"), "hue check");
});

// ─── Every warning / danger Notice has fix steps ────────────────────────────

/** Opening tags of a JSX element, as raw prop text (handles braces and nested JSX in props). */
function openingTags(src, name) {
  const tags = [];
  const re = new RegExp(`<${name}(?=[\\s/>])`, "g");
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + name.length + 1;
    let depth = 0;
    let quote = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) {
        if (c === quote && src[i - 1] !== "\\") quote = null;
        continue;
      }
      if (depth > 0 && (c === '"' || c === "'" || c === "`")) quote = c;
      else if (depth === 0 && c === '"') quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    tags.push({ props: src.slice(m.index + name.length + 1, i), line: src.slice(0, m.index).split("\n").length });
  }
  return tags;
}

const TSX = walk(SRC, [".tsx"]).filter((f) => !f.endsWith("ui/Notice.tsx"));

test("notices: every <Notice> with a warning, danger or computed tone passes fix", () => {
  const missing = [];
  let count = 0;
  for (const file of TSX) {
    for (const t of openingTags(readFileSync(file, "utf8"), "Notice")) {
      count++;
      const tone = /\btone=(?:"([a-z]+)"|\{)/.exec(t.props);
      const needs = !tone || tone[1] === undefined || tone[1] === "warning" || tone[1] === "danger";
      // No tone means "info" (the default); only literal safe tones skip the check.
      if (tone && needs && !/\bfix=\{/.test(t.props)) missing.push(`${rel(file)}:${t.line} tone=${tone[1] ?? "{…}"}`);
    }
  }
  assert.ok(count >= 40, `expected the portals to use Notice widely, found ${count}`);
  assert.deepEqual(missing, [], `warning/danger notices without fix:\n${missing.join("\n")}`);
});

test("notices: every <ErrorNotice> names its audience", () => {
  const missing = [];
  for (const file of TSX) {
    for (const t of openingTags(readFileSync(file, "utf8"), "ErrorNotice")) {
      if (!/\baudience=/.test(t.props)) missing.push(`${rel(file)}:${t.line}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("notices: no notice-like yellow class names are left in portal styles", () => {
  const old = [];
  for (const file of walk(SRC, [".scss"])) {
    const css = readFileSync(file, "utf8");
    for (const cls of ["placeholderBar", "blockedText", "deniedTitle", "noticeText"]) if (new RegExp(`\\.${cls}\\b`).test(css)) old.push(`${rel(file)} .${cls}`);
  }
  assert.deepEqual(old, []);
});

// ─── "Show me" targets exist ────────────────────────────────────────────────

const { ALL_TUTORIALS } = await import("../src/tutorials/index.ts");
const { GLOSSARY } = await import("../src/tutorials/glossary.ts");

test("notices: every tutorialId / tutorialStep and glossary term in a fix exists", () => {
  const byId = new Map(ALL_TUTORIALS.map((t) => [t.id, t]));
  const bad = [];
  for (const file of walk(SRC, [".tsx", ".ts"])) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/tutorialId:\s*"([^"]+)"(?:,\s*tutorialStep:\s*"([^"]+)")?/g)) {
      const t = byId.get(m[1]);
      if (!t) bad.push(`${rel(file)}: unknown tutorial ${m[1]}`);
      else if (m[2] && !t.steps.some((s) => s.id === m[2])) bad.push(`${rel(file)}: ${m[1]} has no step ${m[2]}`);
    }
    for (const m of src.matchAll(/\bterms=\{\[([^\]]*)\]/g)) {
      for (const k of m[1].match(/"([^"]+)"/g) ?? []) if (!(k.slice(1, -1) in GLOSSARY)) bad.push(`${rel(file)}: unknown glossary key ${k}`);
    }
  }
  assert.deepEqual(bad, []);
});

// ─── Content helpers ────────────────────────────────────────────────────────

const { bookingBlocked, pastDueFix } = await import("../src/components/status/noticeFixes.ts");

test("notices: every server reason for blocked booking gets its own title and steps", () => {
  // Wording from server/API/clientStatus/memberLogic.ts and payments/lifecycle.ts.
  const reasons = {
    "Your membership is paused because the last payment did not go through. Once it is paid, you can book calls again.": "danger",
    "Your membership starts once the first payment is received.": "warning",
    "Your membership has ended, so calls cannot be booked.": "warning",
    "Your membership is not active, so calls cannot be booked.": "warning",
    "You have used all 3 calls for this month. New calls open on Nov 14.": "warning",
    "You have 10 minutes left this month and a call takes 20. New minutes arrive on Nov 14.": "warning",
  };
  const titles = new Set();
  for (const [reason, tone] of Object.entries(reasons)) {
    const b = bookingBlocked(reason);
    assert.equal(b.tone, tone, reason);
    assert.ok(b.fix.steps.length >= 2, reason);
    titles.add(b.title);
  }
  assert.equal(titles.size, 5, "paused, not started, not active, no calls, no minutes");
  assert.ok(pastDueFix(true).steps.length >= 3 && pastDueFix(false).steps.length >= 3);
});

test("notices: fix steps read like the tutorial captions (short, plain)", () => {
  const all = [...Object.values({ a: bookingBlocked("paused"), b: bookingBlocked("calls"), c: bookingBlocked("minutes") }).flatMap((b) => b.fix.steps), ...pastDueFix(true).steps];
  for (const s of all) {
    const words = s.split(/\s+/).length;
    assert.ok(words <= 40, `step over 40 words: ${s}`);
    assert.ok(/[.?!]$/.test(s), `step should be a full sentence: ${s}`);
  }
});

const { placeholderData, updateCard } = await import("../src/tutorials/noticeScenes.ts");
const { missingRefs } = await import("../src/components/tutorial/sceneUtils.ts");

test("notices: one-off Show me scenes have captions and valid targets", () => {
  for (const sc of [placeholderData, updateCard]) {
    assert.deepEqual(missingRefs(sc), []);
    for (const op of sc.script ?? []) if (op.op !== "move" && op.op !== "wait" && op.op !== "scroll") assert.ok(op.explain, `caption missing on ${op.to}`);
  }
});
