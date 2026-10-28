// Run: npm test. The copy lint in strict mode over all of src (copy-rules.md).
// A finding fails the test unless scripts/copyLintAllowlist.json lists it with a reason.
import { test } from "node:test";
import assert from "node:assert/strict";

const { lintPaths, loadAllowlist, applyAllowlist } = await import("../scripts/copyLint.mjs");

const entries = loadAllowlist();

test("copy lint allowlist: every entry names a file, a rule and a reason", () => {
  for (const e of entries) {
    assert.equal(typeof e.file, "string", `entry without a file: ${JSON.stringify(e)}`);
    assert.equal(typeof e.rule, "number", `entry without a rule number: ${JSON.stringify(e)}`);
    assert.ok(typeof e.reason === "string" && e.reason.trim().length >= 10, `entry without a reason: ${JSON.stringify(e)}`);
  }
});

test("copy lint strict: no findings in src outside the allowlist", () => {
  const { files, findings } = lintPaths(["src"]);
  assert.ok(files.length > 100, "the lint read the source tree");
  const { kept, unused } = applyAllowlist(findings, entries);
  const lines = kept.map((f) => `${f.file}:${f.line} [rule ${f.rule}] ${f.name}: "${f.match}" in "${f.text.slice(0, 90)}"`);
  assert.equal(kept.length, 0, `copy lint findings (fix the copy or allowlist it with a reason):\n${lines.join("\n")}`);
  assert.deepEqual(unused, [], "allowlist entries that no longer match anything: remove them");
});
