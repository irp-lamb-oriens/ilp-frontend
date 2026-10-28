#!/usr/bin/env node
/**
 * Copy lint: checks user-facing strings in src against copy-rules.md.
 *
 *   npm run copy:lint                      # whole src, warnings only
 *   npm run copy:lint -- --strict          # exit 1 when anything is found
 *   npm run copy:lint -- src/app/page.tsx src/components/landing
 *   npm run copy:lint -- --summary         # counts only
 *
 * What it reads (TypeScript parser, no type check):
 * - JSX text in every .tsx file, and JSX string attributes people read
 *   (title, label, placeholder, alt, aria-label, description and similar);
 * - string and template literals that read as prose (three words or more)
 *   in any .ts/.tsx file: tutorials, notices, page content files, labels.
 * Imports, types, object keys, class names, comparisons and console calls
 * are skipped. Comments are never read.
 *
 * Each finding prints file:line, the copy-rules.md rule number and the text.
 * Some rules (forced groups of three, sentence rhythm, the big reveal) need a
 * person; they are not checked here.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");

// ─── Rules ──────────────────────────────────────────────────────────────────

/** Words or phrases, matched case-insensitively on word boundaries. */
const words = (list) => new RegExp(`\\b(?:${list.join("|")})\\b`, "i");

/**
 * Text rules. `rule` is the number in copy-rules.md "Banned patterns".
 * Keep patterns narrow: this is a warning tool, and noise hides real hits.
 */
export const RULES = [
  { rule: 21, name: "Em or en dash", re: /[–—]|\s--\s/ },
  { rule: 22, name: "Emoji", re: /(?![©®™])\p{Extended_Pictographic}/u },
  { rule: 1, name: "Rhetorical question", re: /(?:^|[.!?]\s+)(?:Want|Ready|Tired|Looking|Wondering|Wish|Curious)\b[^?.]{0,80}\?/ },
  { rule: 2, name: "Dramatic pause", re: /\w(?:\.\.\.|…)\s+[a-z]/ },
  { rule: 3, name: "Suspense question and short answer", re: /\?\s+(?:Absolutely|Of course|Not at all|Exactly|Definitely|Yes|Nope)[.!]/i },
  { rule: 4, name: "Sincerity filler", re: words(["honestly", "frankly", "to be honest", "genuinely", "truly", "actually"]) },
  { rule: 5, name: "Revelation hook", re: words(["the secret nobody tells you", "secret no one tells you", "here'?s the truth", "here’s the truth", "scary truth", "the truth is"]) },
  { rule: 6, name: "Overhype", re: words(["life-changing", "game-?changer", "game changer", "revolutionary", "effortless(?:ly)?", "seamless(?:ly)?", "unlock(?:s|ed|ing)?", "supercharge[ds]?"]) },
  { rule: 7, name: "Quietly", re: words(["quietly"]) },
  { rule: 8, name: "Kicker phrase", re: words(["here'?s the kicker", "here’s the kicker", "the crazy thing", "the best part"]) },
  { rule: 9, name: "Vague delegation", re: /\bpoint (?:AI|the AI|an AI|Claude|ChatGPT) at\b/i },
  { rule: 10, name: "Will revolutionize", re: words(["will revolutioni[sz]e", "revolutioni[sz]e[sd]?"]) },
  { rule: 11, name: "Global-context opener", re: words(["in today'?s (?:fast-changing|fast-paced|ever-changing|modern|digital) world", "in today’s (?:fast-changing|fast-paced|ever-changing|modern|digital) world", "ever-changing", "fast-paced world"]) },
  { rule: 12, name: "Filler opener", re: words(["dive into", "deep dive", "let'?s explore", "let’s explore", "let'?s break it down", "let’s break it down", "without further ado", "here'?s what you need to know", "here’s what you need to know"]) },
  { rule: 13, name: "Ultimatum", re: words(["or get left behind", "adapt or die", "or be left behind"]) },
  { rule: 14, name: "Opposing shutdown", re: words(["forget everything you know", "forget what you know"]) },
  { rule: 16, name: "No X, no Y, just Z", re: /\bno [\w'-]+(?: [\w'-]+)?, no [\w'-]+(?: [\w'-]+)?,? (?:just|only)\b/i },
  { rule: 18, name: "Reframe", re: /\b(?:you'?re|you’re|you are) not (?:buying|paying for|getting) [^.;]{1,40}[,;] (?:you'?re|you’re|you are)\b|\bnot to \w+[^.;]{0,40}, but to\b|\b(?:isn'?t|isn’t|is not) (?:just |about )?[^.;,]{1,30}[,;] (?:it'?s|it’s|it is)\b/i },
  { rule: 24, name: "Puffed-up word", re: words(["pivotal", "crucial", "vital", "testament", "landscape", "tapestry", "journey", "ecosystem", "empower(?:s|ed|ing)?", "elevate[sd]?", "elevating", "leverag(?:e|es|ed|ing)", "robust", "delve[sd]?", "delving", "foster(?:s|ed|ing)?", "showcas(?:e|es|ed|ing)", "underscor(?:e|es|ed|ing)", "nestled", "vibrant", "(?:is|are) key", "key (?:role|part|factor|takeaway|insight|player)s?"]) },
  { rule: 25, name: "Copula avoidance", re: words(["serves as", "serve as", "stands as", "boasts?"]) },
  { rule: 26, name: "Tacked-on -ing phrase", re: /, (?:ensuring|fostering|highlighting|underscoring|empowering|cementing|showcasing|reflecting|symboli[sz]ing)\b/i },
  { rule: 27, name: "Vague authority", re: words(["experts (?:say|agree|believe)", "studies (?:show|suggest|prove)", "research (?:shows|suggests|proves)", "many believe"]) },
  { rule: 28, name: "Chatbot residue", re: words(["I hope this helps", "great question", "certainly!", "let me know", "happy to help", "feel free to"]) },
  { rule: 29, name: "Excess hedging", re: words(["could potentially", "might possibly", "could possibly", "may potentially", "potentially possibly"]) },
  { rule: 30, name: "Generic upbeat ending", re: words(["the future looks bright", "the possibilities are endless", "the sky'?s the limit"]) },
];

/** Small words that stay lowercase in sentence case and in Title Case alike. */
const MINOR = new Set("a an and as at but by for from in into nor of on or per so the to up via vs with".split(" "));

/** Rule 32: a heading in Title Case ("Book Your First Call"). */
export function isTitleCase(text) {
  const ws = text
    .replace(/[^\p{L}\p{N}' -]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (ws.length < 3) return false;
  // Skip minor words, and names with inner capitals or all caps (TextArea, DIMEX, ILP).
  const rest = ws.slice(1).filter((w) => !MINOR.has(w.toLowerCase()) && /^\p{L}/u.test(w) && !/^.+\p{Lu}/u.test(w));
  if (rest.length < 2) return false;
  // Proper nouns and acronyms are fine; Title Case means nearly every word is capitalised.
  const caps = rest.filter((w) => /^\p{Lu}/u.test(w)).length;
  return caps === rest.length && rest.some((w) => /^\p{Lu}\p{Ll}/u.test(w));
}

/**
 * Lint one piece of text. `kind` "heading" also checks Title Case.
 * Returns [{ rule, name, match }], at most one per rule.
 */
export function lintText(text, { kind = "text" } = {}) {
  const out = [];
  for (const r of RULES) {
    const m = text.match(r.re);
    if (m) out.push({ rule: r.rule, name: r.name, match: m[0].trim() });
  }
  if (kind === "heading" && isTitleCase(text)) out.push({ rule: 32, name: "Title Case heading", match: text.trim() });
  return out;
}

// ─── Extraction ─────────────────────────────────────────────────────────────

/** JSX attributes people read. Other attributes count only when they read as prose. */
const COPY_ATTRS = new Set([
  "title", "label", "placeholder", "alt", "aria-label", "aria-description", "description", "summary", "caption", "eyebrow",
  "hint", "help", "helper", "body", "message", "text", "subtitle", "heading", "what", "why", "emptyText", "emptyTitle", "confirmLabel", "cancelLabel",
]);
/** Attributes that never hold copy. */
const CODE_ATTRS = /^(?:className|class|key|id|href|src|type|role|name|htmlFor|target|rel|method|action|as|variant|size|tone|order|kind|mode|autoComplete|inputMode|pattern|form|data-.*|aria-(?:controls|labelledby|describedby|live|current|haspopup)|tutorialId|tutorialStep|storageKey|stepIds|icon|lang|viewBox|d|fill|stroke.*|transform|xmlns.*)$/;

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/** Prose: at least three words with letters, and not a path, URL, selector or code. */
export function looksLikeProse(text) {
  const t = text.trim();
  if (t.length < 8) return false;
  if (/^(?:https?:|mailto:|\/|\.|#|@|[a-z]+:\/\/)/i.test(t)) return false;
  if (/^[\w.-]+(?:\/[\w.\[\]-]+)+$/.test(t)) return false;
  if (/[{};<>]|=>|\$\{|\b(?:var|calc|rgba?)\(/.test(t)) return false;
  if (/^[a-z][\w-]*(?: [a-z][\w-]*)*$/.test(t) && !/\b(?:the|a|an|to|of|and|is|your|you|we|it)\b/.test(t)) return false; // class lists, tokens
  const ws = t.split(/\s+/).filter((w) => /\p{L}/u.test(w));
  return ws.length >= 3;
}

function tagName(node) {
  const el = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
  return el ? el.tagName.getText() : null;
}

function nearestTag(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isJsxElement(p)) return tagName(p);
  }
  return null;
}

/** True when a string literal is code, not copy. */
function skipLiteral(node) {
  const p = node.parent;
  if (!p) return true;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isImportTypeNode?.(p.parent)) return true;
  if (ts.isLiteralTypeNode(p)) return true;
  if (ts.isPropertyAssignment(p) && p.name === node) return true;
  if (ts.isPropertySignature?.(p) || ts.isEnumMember(p)) return true;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isCaseClause(p)) return true;
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(p.operatorToken.kind)) return true;
  if (ts.isCallExpression(p)) {
    const callee = p.expression.getText();
    if (/^(?:console\.\w+|require|import|t\.test|test|describe|it|assert(?:\.\w+)?|document\.\w+|\w+\.(?:querySelector(?:All)?|getItem|setItem|removeItem|addEventListener|removeEventListener|getAttribute|setAttribute|closest|matches|startsWith|endsWith|includes|split|replace|match|test|getPropertyValue|setProperty))$/.test(callee)) return true;
  }
  if (ts.isNewExpression(p) && /^RegExp$/.test(p.expression.getText())) return true;
  if (ts.isJsxAttribute(p)) {
    const name = p.name.getText();
    if (CODE_ATTRS.test(name)) return true;
  }
  return false;
}

/**
 * Pull the user-facing strings out of one source file.
 * Returns [{ text, line, kind }] where kind is "jsx", "heading", "attr" or "literal".
 */
export function extractStrings(source, fileName = "file.tsx") {
  const kindOf = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : fileName.endsWith(".jsx") ? ts.ScriptKind.JSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kindOf);
  const out = [];
  const lineOf = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const push = (text, pos, kind) => {
    const t = text.replace(/\s+/g, " ").trim();
    if (t && /\p{L}|\p{Extended_Pictographic}|[–—]/u.test(t)) out.push({ text: t, line: lineOf(pos), kind });
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const raw = node.getText();
      if (raw.trim()) {
        const tag = nearestTag(node);
        // Report at the first non-blank line of the text.
        const lead = raw.length - raw.trimStart().length;
        push(raw, node.getStart() + lead, tag && HEADING_TAGS.has(tag) ? "heading" : "jsx");
      }
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!skipLiteral(node)) {
        const p = node.parent;
        const attr = p && ts.isJsxAttribute(p) ? p.name.getText() : p && ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent) ? p.parent.name.getText() : null;
        const dash = /[–—]|\p{Extended_Pictographic}/u.test(node.text);
        if (attr && COPY_ATTRS.has(attr)) push(node.text, node.getStart(), "attr");
        else if (looksLikeProse(node.text)) push(node.text, node.getStart(), attr ? "attr" : "literal");
        else if (dash) push(node.text, node.getStart(), "literal"); // includes a lone dash shown as an empty value
      }
    } else if (ts.isTemplateExpression(node)) {
      if (!skipLiteral(node)) {
        const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)];
        const joined = parts.join(" … ").replace(/ … $/, "");
        if (looksLikeProse(parts.join(" x ")) || /[–—]/.test(joined)) push(parts.join(" "), node.getStart(), "literal");
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/** Lint one file's source. Returns [{ file, line, rule, name, match, text }]. */
export function lintSource(source, file) {
  const findings = [];
  for (const s of extractStrings(source, file)) {
    for (const f of lintText(s.text, { kind: s.kind === "heading" ? "heading" : "text" })) {
      findings.push({ file, line: s.line, ...f, text: s.text });
    }
  }
  return findings;
}

// ─── Files ──────────────────────────────────────────────────────────────────

const EXT = /\.(?:tsx?|jsx?|mjs)$/;
const SKIP_DIR = new Set(["node_modules", ".next", ".git", ".worktrees", "__tests__"]);
const SKIP_FILE = /\.(?:test|spec)\.[jt]sx?$|\.d\.ts$/;

export function collectFiles(target) {
  const st = statSync(target);
  if (st.isFile()) return EXT.test(target) ? [target] : [];
  const out = [];
  for (const f of readdirSync(target)) {
    if (SKIP_DIR.has(f)) continue;
    const p = path.join(target, f);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...collectFiles(p));
    else if (EXT.test(f) && !SKIP_FILE.test(f)) out.push(p);
  }
  return out.sort();
}

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const targets = argv.filter((a) => !a.startsWith("--"));
  const strict = flags.has("--strict");
  const summaryOnly = flags.has("--summary");
  const json = flags.has("--json");
  const roots = (targets.length ? targets : ["src"]).map((t) => path.resolve(process.cwd(), t));
  const files = roots.flatMap((r) => {
    try {
      return collectFiles(r);
    } catch {
      console.error(`copy:lint: cannot read ${path.relative(process.cwd(), r) || r}`);
      return [];
    }
  });

  const all = [];
  for (const f of files) all.push(...lintSource(readFileSync(f, "utf8"), path.relative(ROOT, f)));

  if (json) {
    console.log(JSON.stringify(all, null, 2));
  } else {
    if (!summaryOnly) {
      for (const f of all) {
        const snippet = f.text.length > 90 ? `${f.text.slice(0, 87)}...` : f.text;
        console.log(`${f.file}:${f.line}  [rule ${f.rule}] ${f.name}: "${f.match}"  in "${snippet}"`);
      }
      if (all.length) console.log("");
    }
    const byRule = new Map();
    for (const f of all) byRule.set(f.rule, (byRule.get(f.rule) ?? { n: 0, name: f.name, files: new Set() }));
    for (const f of all) {
      const e = byRule.get(f.rule);
      e.n++;
      e.files.add(f.file);
    }
    const nFiles = new Set(all.map((f) => f.file)).size;
    console.log(`copy:lint: ${all.length} finding${all.length === 1 ? "" : "s"} in ${nFiles} of ${files.length} files (copy-rules.md).`);
    for (const [rule, e] of [...byRule.entries()].sort((a, b) => b[1].n - a[1].n)) {
      console.log(`  rule ${String(rule).padStart(2)}  ${String(e.n).padStart(4)}  ${e.name} (${e.files.size} file${e.files.size === 1 ? "" : "s"})`);
    }
    if (all.length && !strict) console.log("Warnings only. Run with --strict to fail on findings.");
  }
  if (strict && all.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2));
}
