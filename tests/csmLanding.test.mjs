// Run: npm test. Customer success landing (/customer-success): the copy is
// cut from the hero text without changing a word, the two pinned stories
// never show two beats at once and every layer reaches 1 in its hold, the
// example screens use placeholder data and fit the shared box at the desktop
// sizes we design for, the tutorial waits for the viewport, and the page is
// linked from the nav and the footer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { existsSync, readFileSync } from "node:fs";

register("./tsResolve.mjs", import.meta.url);

const content = await import("../src/components/customerSuccess/content.ts");
const beats = await import("../src/components/customerSuccess/csmBeats.ts");
const screens = await import("../src/components/customerSuccess/csmScreens.ts");
const visualData = await import("../src/components/customerSuccess/visualData.ts");
const fit = await import("../src/components/customerSuccess/csmFit.ts");
const math = await import("../src/components/motion/storyMath.ts");
const { screenText } = await import("../src/components/landing/heroScreens.ts");
const { CSM_HERO, CSM_INTRO, CSM_WHY, CSM_HOW, CSM_WHAT, CSM_BANDS } = content;

const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

/* The hero copy as approved (frontend/copy-rules.md). Kept here word for word. */
const COPY = {
  eyebrow: "Customer success for members in Colombia, Costa Rica, Mexico, Panama, Portugal and Spain",
  title: "Look after ILP members from the day they join. Make sure every lawyer call has a next step.",
  why: "ILP members are North Americans who live in Colombia, Costa Rica, Mexico, Panama, Portugal or Spain, or own property there, and pay US$79.99 a month for up to three 20-minute calls a month with a lawyer licensed in their country. A call helps only when the member comes ready and someone makes sure the next steps happen after it. The customer success manager is the member's contact at ILP: the welcome call, a profile ready for the first call, the lawyer's next steps sent after it, quotes followed up and renewals checked.",
  how: [
    "Start each day with your tasks, late ones first. Each task names the member, the job and when it is due, and a daily email at 8:00 am Costa Rica time lists what is late, what is due today, new members and members at risk.",
    "Read each member's health score and the reasons behind it. The score runs from 0 to 100, and a failed payment, weeks without contact or an unanswered quote take points off, so the members most likely to leave come first.",
    "Follow a playbook for the moments that repeat. The welcome call, the renewal check-in, a failed payment and a missed call each have steps in order and an email you send from the member's page.",
    "Check your figures once a week. My KPIs shows time to first contact, follow-ups after a lawyer's handoff, readiness after 7 days and retention after 90 days, for your own members.",
  ],
  what: "ILP is a legal membership for North Americans in six countries, and customer success managers are part of the ILP team. Each member has one CSM. New members go to the CSM with the fewest members, and you can take members who have no CSM yet from the portal. Legal advice comes from the member's lawyer, and you make sure the member knows what the lawyer confirmed and what happens next. After a call the lawyer confirms the legal next steps, and you follow up on quotes and paid work. Your figures describe your own members and are not compared with other CSMs.",
  labels: { why: "Why the role matters", how: "How your day works", what: "What the role is" },
  primary: "Write to us about the role",
  secondary: "See the portal",
  signIn: "Already a CSM? Sign in",
};

test("csm landing: the hero copy is unchanged, word for word", () => {
  for (const k of ["eyebrow", "title", "why", "what", "primary", "secondary", "signIn"]) assert.equal(CSM_HERO[k], COPY[k], k);
  assert.deepEqual(CSM_HERO.how, COPY.how);
  assert.deepEqual(CSM_HERO.labels, COPY.labels);
  assert.equal(CSM_BANDS.day.anchor, "portal", "See the portal goes to /customer-success#portal");
});

test("csm landing: every split piece joins back into the hero copy", () => {
  assert.equal(`${CSM_INTRO.eyebrowLead} ${CSM_INTRO.countries.join(" ")}`, COPY.eyebrow);
  assert.equal(`${CSM_INTRO.titleLead} ${CSM_INTRO.titleKey}`, COPY.title);
  assert.equal(CSM_WHY.beats.map((b) => b.text).join(" "), COPY.why);
  CSM_HOW.steps.forEach((st, i) => assert.equal(st.body ? `${st.title} ${st.body}` : st.title, COPY.how[i], `step ${i + 1}`));
  const w = CSM_WHAT;
  assert.equal([w.lead, w.big, w.bigDetail, ...w.lines.map((l) => l.text)].join(" "), COPY.what);
  assert.deepEqual(beats.WHY_BEATS.map((b) => b.body), CSM_WHY.beats.map((b) => b.text));
  assert.deepEqual(beats.HOW_BEATS.map((b) => (b.body ? `${b.title} ${b.body}` : b.title)), COPY.how);
});

test("csm landing: each key phrase sits once inside one phrase of its line", () => {
  const pairs = [
    ...beats.WHY_BEATS.map((b) => [b.body, b.mark]),
    ...beats.HOW_BEATS.flatMap((b) => [[b.title, b.titleMark], [b.body, b.mark]]),
    [CSM_WHAT.big, CSM_WHAT.bigMark],
    ...CSM_WHAT.lines.map((l) => [l.text, l.mark]),
  ].filter(([, m]) => m);
  assert.ok(pairs.length >= 8);
  for (const [text, mark] of pairs) {
    assert.ok(text.includes(mark), `"${mark}" is in its line`);
    assert.equal(text.split(mark).length, 2, `"${mark}" appears once`);
    assert.ok(math.splitPhrases(text).some((p) => p.includes(mark)), `"${mark}" does not cross a phrase break`);
  }
});

test("csm landing: the copy follows copy-rules.md and states no invented terms", () => {
  const all = JSON.stringify(content);
  assert.ok(!/[–—]/.test(all), "no em or en dashes");
  assert.ok(!/\b(seamless|effortless|game-changer|journey|empower|leverage|robust|crucial|vital|honestly|genuinely)\b/i.test(all), "no banned words");
  assert.ok(!/salary|per hour|benefits|full-time|part-time|remote|\$\d+k/i.test(all), "no pay, hours or hiring terms");
  for (const m of all.matchAll(/US\$([0-9][0-9,.]*)/g)) assert.equal(m[1], "79.99", "the only price is the membership");
  assert.match(content.CONTACT_HREF, /^mailto:[^?]+\?subject=/);
  assert.equal(content.SIGN_IN_HREF, "/csm");
});

for (const [name, ranges, list] of [
  ["why", beats.WHY_RANGES, beats.WHY_BEATS],
  ["how", beats.HOW_RANGES, beats.HOW_BEATS],
]) {
  test(`csm ${name} story: never two beats on stage at once`, () => {
    assert.equal(ranges.length, list.length);
    for (let k = 0; k <= 2000; k++) {
      const p = k / 2000;
      const on = ranges.filter((r) => math.beatOpacity(p, r) > 0).length;
      assert.ok(on <= 1, `p=${p}: ${on} beats visible`);
    }
    for (let i = 1; i < ranges.length; i++) assert.ok(ranges[i - 1][3] < ranges[i][0], `empty gap before beat ${i + 1}`);
  });

  test(`csm ${name} story: every layer lands in order and reaches 1 in the hold`, () => {
    list.forEach((beat, i) => {
      const r = ranges[i];
      const [a, , c] = r;
      const L = math.beatLayers(r, { title: !!beat.title, bodyPhrases: beat.body ? math.splitPhrases(beat.body).length : 0 });
      const at = math.beatAnchorProgress(r);
      for (const w of [L.rule, L.eyebrow, L.title, L.body, L.visual, L.caption].filter(Boolean)) {
        assert.ok(w[0] >= a - 1e-9 && w[1] <= c + 1e-9, `beat ${i + 1}: window inside enter and hold`);
        assert.equal(math.revealAt(at, w), 1, `beat ${i + 1}: layer at 1 where its link lands`);
      }
      assert.equal(math.beatOpacity(at, r), 1);
      if (L.title) {
        assert.ok(L.eyebrow[1] <= L.title[0] + 1e-9, "eyebrow, then title");
        assert.ok(L.title[1] <= L.body[0] + 1e-9, "the body starts once the title has landed");
      }
      assert.ok(L.body[1] <= L.caption[0] + 1e-9, "the caption comes after the body");
    });
  });
}

test("csm stories: text and picture change sides; step numbers render once", () => {
  for (const slots of [beats.WHY_SLOTS, beats.HOW_SLOTS]) {
    slots.forEach((z, i) => {
      assert.notEqual(z.text, z.visual);
      if (i > 0) assert.notEqual(z.text, slots[i - 1].text, "sides alternate");
    });
  }
  beats.HOW_BEATS.forEach((b, i) => {
    assert.equal(b.id, `csm-step-${i + 1}`);
    assert.equal(b.eyebrow, `Step ${i + 1} of 4`);
    assert.ok(!/\d/.test(b.rail), "rail labels carry no number");
  });
  assert.ok(beats.HOW_BEATS.every((b) => b.caption) && beats.WHY_BEATS.every((b) => b.caption), "every picture has a text caption");
});

test("csm screens: Today, My book, a playbook email and My KPIs, placeholder data only", () => {
  const { CSM_SCREENS, csmScreenRoot, screenOverrides, screenStateAt } = screens;
  assert.equal(CSM_SCREENS.length, CSM_HOW.steps.length);
  const expect = [
    ["CSM portal · Today", "Late tasks", "Due today", "Your tasks", "Payment failed: contact member", "Late 1 day"],
    ["CSM portal · My book", "At risk · 40", "Watch · 71", "Healthy · 92", "minus 35", "Last contact 31 days ago"],
    ["Welcome to ILP, Imani", "imani.okafor@example.com", "Send email", "your contact at ILP"],
    ["CSM portal · My KPIs", "Time to first contact", "Handoff follow-ups on time", "Consultation-ready after 7 days", "Book retention after 90 days", "Target 80%"],
  ];
  const all = [];
  CSM_SCREENS.forEach((sc, i) => {
    for (const compact of [false, true]) {
      const t = screenText(csmScreenRoot(sc, compact)).join("\n");
      all.push(t);
      for (const w of expect[i]) assert.ok(t.includes(w), `step ${i + 1} (${compact ? "compact" : "wide"}) shows "${w}"`);
      assert.ok(!/[–—]/.test(t), "no dashes");
    }
    sc.timeline.forEach((st, k) => {
      assert.ok(st.at > 0 && st.at < 1);
      if (k > 0) assert.ok(st.at > sc.timeline[k - 1].at);
      assert.ok(st.changes.length > 0);
    });
    assert.equal(screenStateAt(sc, 0), 0);
    assert.equal(screenStateAt(sc, 1), sc.timeline.length);
  });
  const end = (i) => screenOverrides(CSM_SCREENS[i], CSM_SCREENS[i].timeline.length).patch;
  assert.equal(end(0).q1.hidden, true);
  assert.equal(end(0).closed.hidden, false);
  assert.equal(end(0).c_late.value, "1");
  assert.equal(end(1).m1why.hidden, false);
  assert.equal(end(2).send.label, "Sent");
  assert.equal(end(2).logged.hidden, false);
  assert.equal(end(3).k4tag.hidden, false);

  all.push(JSON.stringify(visualData));
  const emails = all.join("\n").match(/[\w.+-]+@[\w.-]+/g) ?? [];
  assert.ok(emails.length >= 1);
  for (const e of emails) assert.ok(e.endsWith("@example.com"), `${e} uses @example.com`);
  assert.ok(!/[–—]/.test(JSON.stringify(visualData)));
  assert.deepEqual(visualData.VISUAL_COUNTRIES, ["Colombia", "Costa Rica", "Mexico", "Panama", "Portugal", "Spain"]);
  for (const m of visualData.MEMBER_ROWS) assert.ok(visualData.VISUAL_COUNTRIES.includes(m.country));

  // The health pills add up: 100 minus the points of the reasons shown.
  const book = screenText(csmScreenRoot(CSM_SCREENS[1], false)).join("\n");
  const minus = [...book.matchAll(/minus (\d+)/g)].reduce((n, m) => n + Number(m[1]), 0);
  assert.equal(100 - minus, 40, "Linda's reasons add up to her score");

  // No text under 12px in the screens: medium pills, no list pills, tile hints or definition lists.
  const json = JSON.stringify(CSM_SCREENS.map((sc) => sc.body(false)));
  assert.ok(!json.includes('"type":"deflist"'), "no definition lists (11px labels)");
  assert.ok(!json.includes('"type":"list"'), "no list rows (11px pills)");
  assert.ok(!json.includes('"hint"'), "no stat-tile hints (11.5px)");
  assert.ok(!json.includes('"variant":"eyebrow"'), "no 11px eyebrow text");
  for (const m of json.matchAll(/"type":"pill"[^}]*"size":"(\w+)"/g)) assert.equal(m[1], "md", "pills at the medium size");

  const vis = src("components/customerSuccess/CsmVisuals.tsx");
  assert.ok((vis.match(/aria-hidden="true"/g) ?? []).length >= 3, "pictures are aria-hidden");
  assert.match(vis, /<FitFrame natural=\{CSM_SCREEN_SIZES\[index\]\} kind="screen">/);
  assert.match(vis, /<FitFrame natural=\{CSM_WHY_SIZES\[index\]\} kind="why">/);
});

/* ── Sizing (csmFit.ts, the lawyers' model) ───────────────────── */

const VIEWPORTS = [
  [1024, 700],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
];

test("csm screens: one box for every step, inside its column and the pinned stage, at a readable scale", () => {
  assert.equal(fit.CSM_SCREEN_SIZES.length, screens.CSM_SCREENS.length);
  assert.ok(fit.MIN_SCALE >= 1);
  for (const [vw, vh] of VIEWPORTS) {
    const box = fit.screenBox(vw, vh);
    assert.ok(box.w <= fit.spanPx(vw, fit.SCREEN_BOX.span) + 1e-9, `${vw}x${vh}: box inside its seven columns`);
    const caption = Math.max(...beats.HOW_BEATS.map((b) => fit.captionPx(b.caption, box.w)));
    assert.ok(caption <= fit.STAGE.captionGapPx + fit.STAGE.captionLines * fit.STAGE.captionLinePx, `${vw}x${vh}: captions fit two lines`);
    assert.ok(box.h + caption <= fit.beatsRowPx(vh), `${vw}x${vh}: screen and caption inside the stage`);
    fit.CSM_SCREEN_SIZES.forEach((n, i) => {
      const k = fit.fitScale(box, n);
      assert.ok(Math.abs(n.w / n.h - fit.SCREEN_BOX.aspect) < 1e-9, `step ${i + 1}: natural size has the box's aspect`);
      assert.ok(n.w * k <= box.w + 1e-9 && n.h * k <= box.h + 1e-9, `${vw}x${vh} step ${i + 1}: fits the box`);
      assert.ok(k >= fit.MIN_SCALE, `${vw}x${vh} step ${i + 1}: scale ${k.toFixed(3)} >= ${fit.MIN_SCALE}`);
    });
  }
});

test("csm why pictures: inside five columns and the pinned stage, at a readable scale", () => {
  assert.equal(fit.CSM_WHY_SIZES.length, beats.WHY_BEATS.length);
  for (const [vw, vh] of VIEWPORTS) {
    fit.CSM_WHY_SIZES.forEach((n, i) => {
      const box = fit.whyBox(vw, vh, n);
      const k = fit.fitScale(box, n);
      const caption = fit.captionPx(beats.WHY_BEATS[i].caption, box.w);
      assert.ok(box.w <= fit.spanPx(vw, fit.WHY_BOX.span) + 1e-9, `${vw}x${vh} why ${i + 1}: inside its five columns`);
      assert.ok(fit.whyDropPx(vh) + box.h + caption <= fit.beatsRowPx(vh), `${vw}x${vh} why ${i + 1}: inside the stage`);
      assert.ok(k >= fit.MIN_SCALE, `${vw}x${vh} why ${i + 1}: scale ${k.toFixed(3)}`);
    });
  }
});

/* ── Page, tutorial, links ─────────────────────────────────────── */

test("csm landing: sections in order, on the shared primitives, tokens only", () => {
  assert.ok(existsSync(new URL("../src/app/customer-success/page.tsx", import.meta.url)), "the route exists");
  const route = src("app/customer-success/page.tsx");
  assert.match(route, /export const metadata/);
  assert.match(route, /<CsmLanding \/>/);
  const page = src("components/customerSuccess/CsmLanding.tsx");
  const order = ["<CsmHero", "<WhyTheRoleMatters", "<HowYourDayWorks", "<RoleClose", "CSM_BANDS.day"];
  const at = order.map((t) => page.indexOf(t));
  at.forEach((pos, i) => assert.ok(pos > 0, `renders ${order[i]}`));
  assert.deepEqual([...at].sort((a, b) => a - b), at);
  const story = src("components/customerSuccess/CsmStory.tsx");
  for (const used of ["<BeatStory", "<Eyebrow", "<RevealText", "useStoryLayout", "useReducedMotion"]) assert.ok(story.includes(used), `uses ${used}`);
  const scss = src("components/customerSuccess/csmLanding.module.scss");
  assert.ok(!/filter\s*:|backdrop-filter|blur\(/.test(scss), "no filter or blur");
  assert.ok(!/#[0-9a-f]{3,6}\b/i.test(scss), "tokens only");
  assert.ok(!/transition:\s*(?!.*(transform|opacity))/.test(scss), "no transitions on layout properties");
});

test("csm landing: the tutorial is public, registered and plays only in view", async () => {
  const { PUBLIC_TUTORIALS, CSM_LANDING_TUTORIAL_IDS } = await import("../src/tutorials/public/index.ts");
  const byId = new Map(PUBLIC_TUTORIALS.map((t) => [t.id, t]));
  assert.deepEqual(Object.values(CSM_BANDS).map((b) => b.id), [...CSM_LANDING_TUTORIAL_IDS]);
  for (const id of CSM_LANDING_TUTORIAL_IDS) {
    const tut = byId.get(id);
    assert.ok(tut, `${id} is registered`);
    assert.deepEqual(tut.audience, ["public"]);
    assert.ok(tut.steps.length >= 3 && tut.steps.length <= 6);
    for (const st of tut.steps) assert.ok((st.scene.script ?? []).some((op) => op.explain), `${id} › ${st.id} has a caption`);
    const text = JSON.stringify(tut);
    for (const e of text.match(/[\w.+-]+@[\w.-]+/g) ?? []) assert.ok(e.endsWith("@example.com"), e);
  }
  for (const f of ["components/customerSuccess/CsmLanding.tsx", "components/customerSuccess/CsmStory.tsx", "components/customerSuccess/CsmVisuals.tsx", "app/customer-success/page.tsx"]) {
    const text = src(f);
    assert.ok(!/<ScenePlayer\b/.test(text), `${f}: no bare ScenePlayer`);
    for (const m of text.matchAll(/<TutorialEmbed\b[^>]*>/gs)) assert.ok(!/autoplay=/.test(m[0]), `${f}: autoplay stays "in-view"`);
  }
  assert.match(src("components/customerSuccess/CsmLanding.tsx"), /<TutorialBand band=\{CSM_BANDS\.day\}/);
  assert.match(src("components/landing/TutorialBand.tsx"), /<TutorialEmbed tutorialId=\{band\.id\}/);
});

test("csm landing: linked from the nav and the footer, with the portal sign-in", () => {
  const nav = src("components/Nav.tsx");
  assert.match(nav, /href="\/customer-success"/);
  assert.match(nav, />\s*Customer success\s*</);
  assert.match(nav, /isCsm && \(\s*<Link href="\/csm"/);
  assert.ok(nav.indexOf('href="/attorneys"') < nav.indexOf('href="/customer-success"'), "next to the lawyers link");
  const footer = src("components/legal/SiteLegal.tsx");
  assert.match(footer, /<Link href="\/customer-success">Customer success at ILP<\/Link>/);
  assert.match(footer, /<Link href="\/attorneys">For lawyers<\/Link>/);
  const story = src("components/customerSuccess/CsmStory.tsx") + src("components/customerSuccess/CsmLanding.tsx");
  assert.match(story, /href=\{SIGN_IN_HREF\}/);
});
