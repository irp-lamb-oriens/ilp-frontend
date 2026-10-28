// Run: npm test. The copy lint matcher (scripts/copyLint.mjs) against copy-rules.md.
import { test } from "node:test";
import assert from "node:assert/strict";

const { lintText, extractStrings, lintSource, isTitleCase, looksLikeProse } = await import("../scripts/copyLint.mjs");

const rules = (text, opts) => lintText(text, opts).map((f) => f.rule);

test("copy lint: dashes and emojis", () => {
  assert.deepEqual(rules("Book a call — it takes a minute."), [21]);
  assert.deepEqual(rules("9:00–10:00"), [21]);
  assert.deepEqual(rules("Draft -- pending review"), [21]);
  assert.deepEqual(rules("Well done \u{1F389}"), [22]);
  assert.deepEqual(rules("A 20-minute call, well-known lawyer."), [], "hyphens are fine");
  assert.deepEqual(rules("© 2026 International Legal Partner"), [], "the copyright sign is not an emoji");
});

test("copy lint: banned words and phrases, on word boundaries", () => {
  assert.deepEqual(rules("We actually track it."), [4]);
  assert.deepEqual(rules("A seamless way to unlock your plan."), [6]);
  assert.deepEqual(rules("Let's dive into residency."), [12]);
  assert.deepEqual(rules("Experts say you should file early."), [27]);
  assert.deepEqual(rules("It serves as your record."), [25]);
  assert.deepEqual(rules("No forms, no waiting, just answers."), [16]);
  assert.deepEqual(rules("Want to sleep better? Join today."), [1]);
  assert.deepEqual(rules("Is it easy? Absolutely."), [3]);
  assert.deepEqual(rules("Your journey abroad is crucial."), [24]);
  assert.deepEqual(rules("We file it for you, ensuring peace of mind."), [26]);
  assert.deepEqual(rules("The best part... you don't lift a finger."), [2, 8]);
  assert.deepEqual(rules("Saving…"), [], "a trailing ellipsis on a loading label is fine");
  assert.deepEqual(rules("A key opens the door. The keyboard works too."), [], "key as a noun is fine");
  assert.deepEqual(rules("Actuality and trustworthy lawyers"), [], "no partial-word matches");
  assert.deepEqual(rules("Your lawyer is licensed in Costa Rica. Three 20-minute calls a month."), []);
});

test("copy lint: Title Case headings only", () => {
  assert.ok(isTitleCase("Book Your First Call"));
  assert.ok(!isTitleCase("Book your first call"));
  assert.ok(!isTitleCase("Your DIMEX card and the ILP team"), "acronyms and names are fine");
  assert.ok(!isTitleCase("TextArea, Checkbox and RadioGroup"), "component names are not Title Case");
  assert.deepEqual(rules("Book Your First Call", { kind: "heading" }), [32]);
  assert.deepEqual(rules("Book Your First Call"), [], "Title Case is only checked on headings");
});

test("copy lint: reads JSX text, copy attributes and prose literals, skips code", () => {
  const src = `
import x from "some — module";
type T = "a — b";
const cls = "card card--wide";
const label = "Ask your lawyer — today";
const k = { "key — name": 1 };
if (mode === "x — y") {}
console.log("debug — only");
export function A() {
  return (
    <section className="hero —">
      <h2>Book Your First Call</h2>
      <p>
        We honestly check every date.
      </p>
      <input placeholder="Type your email" aria-controls="x — y" />
      <td>{value ?? "—"}</td>
    </section>
  );
}`;
  const found = extractStrings(src, "a.tsx");
  const texts = found.map((f) => f.text);
  assert.ok(texts.includes("Ask your lawyer — today"));
  assert.ok(texts.includes("Book Your First Call"));
  assert.equal(found.find((f) => f.text === "Book Your First Call").kind, "heading");
  assert.ok(texts.includes("We honestly check every date."));
  assert.ok(texts.includes("Type your email"));
  assert.ok(texts.includes("—"), "a lone dash shown as an empty value is reported");
  for (const code of ["some — module", "a — b", "key — name", "x — y", "debug — only", "hero —", "card card--wide"]) {
    assert.ok(!texts.includes(code), `skips ${code}`);
  }
  const lines = lintSource(src, "a.tsx").map((f) => `${f.line}:${f.rule}`);
  assert.ok(lines.includes("5:21"), lines.join(","));
  assert.ok(lines.includes("12:32"), lines.join(","));
  assert.ok(lines.includes("14:4"), lines.join(","));
});

test("copy lint: prose detection", () => {
  assert.ok(looksLikeProse("Pick a day and a time."));
  assert.ok(!looksLikeProse("/status/money"));
  assert.ok(!looksLikeProse("https://example.com/a b c"));
  assert.ok(!looksLikeProse("btn btn-primary btn-lg"));
  assert.ok(!looksLikeProse("ok"));
});
