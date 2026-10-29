// Run: npm test. Lawyers landing (/attorneys) scroll sections: the copy is
// cut from the hero text without changing a word, the two pinned stories
// never show two beats at once and every layer reaches 1 in its hold, step
// numbers render once, the example screens use placeholder data, and every
// tutorial on a landing page waits for the viewport.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

register("./tsResolve.mjs", import.meta.url);

const content = await import("../src/components/lawyers/content.ts");
const beats = await import("../src/components/lawyers/lawyersBeats.ts");
const screens = await import("../src/components/lawyers/lawyerScreens.ts");
const visualData = await import("../src/components/lawyers/visualData.ts");
const math = await import("../src/components/motion/storyMath.ts");
const { screenText } = await import("../src/components/landing/heroScreens.ts");
const { LAWYERS_HERO, LAWYERS_INTRO, LAWYERS_WHY, LAWYERS_HOW, LAWYERS_WHAT, LAWYER_BANDS } = content;

const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

/* The hero copy as approved (frontend/copy-rules.md). Kept here word for word. */
const COPY = {
  eyebrow: "For lawyers in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain",
  title: "Advise ILP members. We prepare each call and handle the follow-up.",
  why: "Many North Americans live in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain, or own property there, and they have legal questions about residency, property, companies and cars. Finding them, booking them and chasing them after a call takes hours that nobody pays for. ILP members pay a monthly membership that includes their calls, they write their question down before booking, and a customer success manager follows up after you speak.",
  how: [
    "Apply online. We check your licence with the body that issued it (for example your carné with the Colegio de Abogados y Abogadas de Costa Rica, or your colegiado number in Spain) and reply by email.",
    "Set the weekly hours when members can book you, and the legal areas you take.",
    "Before each 20-minute video call, read a one-screen brief with the member's question and profile.",
    "After the call, confirm the suggested summary and next steps. ILP follows up with the member, including quotes for paid work.",
  ],
  what: "ILP is a legal membership for North Americans in six countries: US$79.99 a month, with up to three 20-minute video calls a month with a lawyer licensed in the member's country. Partner lawyers are independent lawyers who take those calls through the ILP lawyer portal. Work beyond a call, like a filing or a transfer, is quoted separately and the member decides.",
  labels: { why: "Why lawyers join", how: "How it works for you", what: "What the partnership is" },
  primary: "Apply as a partner lawyer",
  secondary: "See the portal",
};

test("lawyers landing: the hero copy is unchanged, word for word", () => {
  for (const k of ["eyebrow", "title", "why", "what", "primary", "secondary"]) assert.equal(LAWYERS_HERO[k], COPY[k], k);
  assert.deepEqual(LAWYERS_HERO.how, COPY.how);
  assert.deepEqual(LAWYERS_HERO.labels, COPY.labels);
  assert.equal(LAWYER_BANDS.day.anchor, "portal", "See the portal goes to /attorneys#portal");
});

test("lawyers landing: every split piece joins back into the hero copy", () => {
  assert.equal(`${LAWYERS_INTRO.eyebrowLead} ${LAWYERS_INTRO.countries.join(" ")}`, COPY.eyebrow);
  assert.equal(`${LAWYERS_INTRO.titleLead} ${LAWYERS_INTRO.titleKey}`, COPY.title);
  assert.equal(LAWYERS_WHY.beats.map((b) => b.text).join(" "), COPY.why);
  LAWYERS_HOW.steps.forEach((st, i) => assert.equal(st.body ? `${st.title} ${st.body}` : st.title, COPY.how[i], `step ${i + 1}`));
  const w = LAWYERS_WHAT;
  assert.equal(`${w.lead} US$${w.price.toFixed(2)} ${w.calls} ${w.partners} ${w.extra}`, COPY.what);
  // The beats carry the same strings.
  assert.deepEqual(beats.WHY_BEATS.map((b) => b.body), LAWYERS_WHY.beats.map((b) => b.text));
  assert.deepEqual(
    beats.HOW_BEATS.map((b) => (b.body ? `${b.title} ${b.body}` : b.title)),
    COPY.how,
  );
});

test("lawyers landing: each key phrase sits once inside one phrase of its line", () => {
  const pairs = [
    ...beats.WHY_BEATS.map((b) => [b.body, b.mark]),
    ...beats.HOW_BEATS.flatMap((b) => [[b.title, b.titleMark], [b.body, b.mark]]),
    [LAWYERS_WHAT.calls, LAWYERS_WHAT.callsMark],
    [LAWYERS_WHAT.extra, LAWYERS_WHAT.extraMark],
  ].filter(([, m]) => m);
  assert.ok(pairs.length >= 8);
  for (const [text, mark] of pairs) {
    assert.ok(text.includes(mark), `"${mark}" is in its line`);
    assert.equal(text.split(mark).length, 2, `"${mark}" appears once`);
    assert.ok(math.splitPhrases(text).some((p) => p.includes(mark)), `"${mark}" does not cross a phrase break`);
  }
});

for (const [name, ranges, list] of [
  ["why", beats.WHY_RANGES, beats.WHY_BEATS],
  ["how", beats.HOW_RANGES, beats.HOW_BEATS],
]) {
  test(`lawyers ${name} story: never two beats on stage at once`, () => {
    assert.equal(ranges.length, list.length);
    for (let k = 0; k <= 2000; k++) {
      const p = k / 2000;
      const on = ranges.filter((r) => math.beatOpacity(p, r) > 0).length;
      assert.ok(on <= 1, `p=${p}: ${on} beats visible`);
    }
    for (let i = 1; i < ranges.length; i++) assert.ok(ranges[i - 1][3] < ranges[i][0], `empty gap before beat ${i + 1}`);
  });

  test(`lawyers ${name} story: every layer lands in order and reaches 1 in the hold`, () => {
    list.forEach((beat, i) => {
      const r = ranges[i];
      const [a, b, c] = r;
      const L = math.beatLayers(r, { title: !!beat.title, bodyPhrases: beat.body ? math.splitPhrases(beat.body).length : 0 });
      const at = math.beatAnchorProgress(r);
      const wins = [L.rule, L.eyebrow, L.title, L.body, L.visual, L.caption].filter(Boolean);
      for (const w of wins) {
        assert.ok(w[0] >= a - 1e-9 && w[1] <= c + 1e-9, `beat ${i + 1}: window inside enter and hold`);
        assert.equal(math.revealAt(at, w), 1, `beat ${i + 1}: layer at 1 where its link lands`);
      }
      assert.equal(math.beatOpacity(at, r), 1);
      assert.ok(L.rule[1] <= L.eyebrow[0] + 1e-9, "rule, then eyebrow");
      if (L.title) {
        assert.ok(L.eyebrow[1] <= L.title[0] + 1e-9, "eyebrow, then title");
        assert.ok(L.title[1] <= L.body[0] + 1e-9, "the body starts once the title has landed");
        assert.ok(L.timeline[0] >= L.title[1] - 1e-9, "the visual plays after the title");
      }
      assert.ok(L.body[1] <= L.caption[0] + 1e-9, "the caption comes after the body");
      assert.ok(L.body[1] <= at, "the body is read before the link target");
      assert.ok(b <= c);
    });
  });
}

test("lawyers stories: text and picture change sides from beat to beat", () => {
  for (const slots of [beats.WHY_SLOTS, beats.HOW_SLOTS]) {
    slots.forEach((z, i) => {
      assert.notEqual(z.text, z.visual);
      if (i > 0) assert.notEqual(z.text, slots[i - 1].text, "sides alternate");
    });
  }
});

test("lawyers steps: numbers render once", () => {
  beats.HOW_BEATS.forEach((b, i) => {
    assert.equal(b.id, `lawyers-step-${i + 1}`);
    assert.equal(b.eyebrow, `Step ${i + 1} of 4`);
    assert.ok(!/\d/.test(b.rail), "rail labels carry no number");
    assert.ok(!/^\d/.test(b.title), "titles do not start with a number");
  });
  for (const file of ["components/lawyers/LawyersStory.tsx", "components/motion/BeatStory.tsx", "components/lawyers/LawyerVisuals.tsx"]) {
    assert.ok(!/<ol\b[^>]*>\s*\{[^}]*\.map\([^)]*\)\s*=>\s*\(\s*<li[^>]*>\s*<span[^>]*>\s*\{(?:i|index) \+ 1\}/.test(src(file)), `${file}: no list item repeats its marker`);
  }
  // Shared step lists elsewhere draw the number with CSS, so a copied list has one number.
  assert.match(src("components/ui/PageIntro.tsx"), /data-n=\{i \+ 1\} aria-hidden="true" \/>/);
  assert.match(src("components/ui/PageIntro.module.scss"), /content: attr\(data-n\)/);
  assert.match(src("components/landing/HeroStory.tsx"), /data-n=\{index \+ 1\} aria-hidden="true" \/>/);
  assert.ok(!src("components/lawyers/LawyersLanding.tsx").includes("PageIntro"), "the lawyers hero no longer uses PageIntro");
});

test("lawyers screens: one realistic screen per step, placeholder data only", () => {
  const { LAWYER_SCREENS, lawyerScreenRoot, screenOverrides, screenStateAt } = screens;
  assert.equal(LAWYER_SCREENS.length, LAWYERS_HOW.steps.length);
  const expect = [
    ["Colegio de Abogados y Abogadas de Costa Rica", "Pending: checking with the Colegio", "daniela.chaves@example.com", "Carné number"],
    ["Weekly hours", "Legal areas you take", "Property", "Residency", "2:00 pm"],
    ["Pre-call brief for Hiroshi Tanaka", "Today, 9:30 am · 20 min", "Can I sell the house before the S.A. books are fixed?", "Profile completeness"],
    ["Summary for the member", "Suggested: check it", "Next steps", "Confirm", "Quote in progress", "Sofía Campos · ILP customer success"],
  ];
  const all = [];
  LAWYER_SCREENS.forEach((sc, i) => {
    for (const compact of [false, true]) {
      const t = screenText(lawyerScreenRoot(sc, compact)).join("\n");
      all.push(t);
      for (const w of expect[i]) assert.ok(t.includes(w), `step ${i + 1} (${compact ? "compact" : "wide"}) shows "${w}"`);
      assert.ok(!/[–—]/.test(t), "no dashes");
    }
    // Timelines: in order, inside the step, and each state changes something.
    sc.timeline.forEach((st, k) => {
      assert.ok(st.at > 0 && st.at < 1);
      if (k > 0) assert.ok(st.at > sc.timeline[k - 1].at);
      assert.ok(st.changes.length > 0);
    });
    assert.equal(screenStateAt(sc, 0), 0);
    assert.equal(screenStateAt(sc, 1), sc.timeline.length);
  });
  const end = (i) => screenOverrides(LAWYER_SCREENS[i], LAWYER_SCREENS[i].timeline.length).patch;
  assert.equal(end(0).lic.label, "Verified");
  assert.equal(end(0).mail.hidden, false);
  assert.equal(end(3).sugg.label, "Confirmed by you");
  assert.equal(end(3).follow.hidden, false);

  const v = JSON.stringify(visualData);
  all.push(v);
  const emails = all.join("\n").match(/[\w.+-]+@[\w.-]+/g) ?? [];
  assert.ok(emails.length >= 1);
  for (const e of emails) assert.ok(e.endsWith("@example.com"), `${e} uses @example.com`);
  assert.ok(!/[–—]/.test(v));
  assert.equal(visualData.minutesLabel(130), "2 h 10 min");
  assert.equal(visualData.minutesLabel(35), "35 min");
  assert.deepEqual(visualData.VISUAL_COUNTRIES, ["Colombia", "Costa Rica", "Mexico", "Panama", "Portugal", "Spain"]);
  for (const q of visualData.MEMBER_QUESTIONS) assert.ok(visualData.VISUAL_COUNTRIES.includes(q.country));

  const vis = src("components/lawyers/LawyerVisuals.tsx");
  assert.ok((vis.match(/aria-hidden="true"/g) ?? []).length >= 4, "pictures are aria-hidden");
  assert.ok(beats.HOW_BEATS.every((b) => b.caption) && beats.WHY_BEATS.every((b) => b.caption), "every picture has a text caption");
});

test("lawyers landing: sections in order, pinned stories on the shared primitives", () => {
  const page = src("components/lawyers/LawyersLanding.tsx");
  const order = ["<LawyersHero", "<WhyLawyersJoin", "<HowItWorksForYou", "<PartnershipClose", "LAWYER_BANDS.day"];
  const at = order.map((t) => page.indexOf(t));
  at.forEach((pos, i) => assert.ok(pos > 0, `renders ${order[i]}`));
  assert.deepEqual([...at].sort((a, b) => a - b), at);
  const story = src("components/lawyers/LawyersStory.tsx") + src("components/motion/BeatStory.tsx");
  for (const used of ["beatRanges", "beatLayers", "<Beat", "<Eyebrow", "<RevealText", "zigzagDrift", "useSectionProgress"]) {
    assert.ok(story.includes(used) || src("components/lawyers/lawyersBeats.ts").includes(used), `uses ${used}`);
  }
  for (const f of ["components/lawyers/LawyersStory.module.scss", "components/motion/BeatStory.module.scss"]) {
    const scss = src(f);
    assert.ok(!/filter\s*:|backdrop-filter|blur\(/.test(scss), `${f}: no filter or blur`);
    assert.ok(!/#[0-9a-f]{3,6}\b/i.test(scss), `${f}: tokens only`);
  }
});

/* ── Tutorials on landing pages wait for the viewport ─────────── */

function walk(dir) {
  const abs = new URL(`../src/${dir}`, import.meta.url).pathname;
  const out = [];
  for (const name of readdirSync(abs)) {
    const p = path.join(abs, name);
    if (statSync(p).isDirectory()) out.push(...walk(path.relative(new URL("../src/", import.meta.url).pathname, p)));
    else if (/\.tsx$/.test(name)) out.push(p);
  }
  return out;
}

test("landing pages: every tutorial is a TutorialEmbed that plays only in view", async () => {
  const { PLAY_ENTER, PLAY_LEAVE } = await import("../src/components/tutorial/viewport.ts");
  assert.equal(PLAY_ENTER, 0.4);
  assert.equal(PLAY_LEAVE, 0.15);
  const files = [
    ...walk("components/landing"),
    ...walk("components/lawyers"),
    ...["app/page.tsx", "app/attorneys/page.tsx", "app/check/page.tsx", "app/join/page.tsx"].map((p) => new URL(`../src/${p}`, import.meta.url).pathname),
  ];
  let embeds = 0;
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.ok(!/<ScenePlayer\b/.test(text), `${f}: no bare ScenePlayer (it would not wait for the viewport)`);
    for (const m of text.matchAll(/<TutorialEmbed\b[^>]*>/gs)) {
      embeds++;
      assert.ok(!/autoplay=/.test(m[0]), `${f}: TutorialEmbed keeps autoplay "in-view"`);
    }
  }
  assert.ok(embeds >= 2, "TutorialBand and /check embed");
  const embed = src("components/tutorial/TutorialEmbed.tsx");
  assert.match(embed, /autoplay = "in-view"/);
  assert.match(embed, /createViewGate\(\)/);
  const band = src("components/landing/TutorialBand.tsx");
  assert.match(band, /<TutorialEmbed tutorialId=\{band\.id\} caption=\{band\.caption\} className=\{s\.tutorialEmbed\} \/>/);
});
