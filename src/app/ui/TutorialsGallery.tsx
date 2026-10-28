"use client";

/**
 * /ui → Tutorials: preview any tutorial in the real modal or inline (with a
 * static reduced-motion frame and its captions), the glossary behind the
 * "What's this?" meanings, a caption-only playground, and a playground with
 * every mock element and every cursor op.
 */
import { useMemo, useState } from "react";
import { Button, Select, Switch, Tabs, TextArea, TextInput } from "@/components/ui";
import { firstUseTerms, readingTime, ScenePlayer, useTutorial, wordCount } from "@/components/tutorial";
import type { CursorOpName, MockNode, Scene, SceneAspect, TutorialRole } from "@/components/tutorial";
import { ALL_TUTORIALS } from "@/tutorials";
import { findTerms, GLOSSARY, TERM_KEYS, type GlossaryEntry } from "@/tutorials/glossary";
import {
  MEMBERS as M,
  board,
  btn,
  card,
  chip,
  click,
  deflist,
  dialog,
  drag,
  drawer,
  grid,
  hover,
  input,
  list,
  menu,
  message,
  meta,
  move,
  p,
  pill,
  progress,
  row,
  say,
  scroll,
  set,
  stack,
  stat,
  table,
  tabs,
  text,
  timeRange,
  timeline,
  toast,
  toggle,
  type,
  wait,
} from "@/tutorials/presets";
import s from "./TutorialsGallery.module.scss";

const ROLES: Array<{ id: string; label: string }> = [
  { id: "staff", label: "Staff" },
  { id: "lawyer", label: "Lawyer" },
  { id: "client", label: "Client" },
];

// ─── Playground ─────────────────────────────────────────────────────────────

const ELEMENTS: MockNode = stack(
  [
    grid("2-1-1", [stat("MRR", "US$3,679.54", { size: "lg", delta: "+US$79.99", trend: "up", hint: "46 members" }), stat("Win rate", "41.7%", { hint: "5 of 12" }), card("Card", [meta("Hairline border, 14px radius.")], { tone: "mist" })]),
    row([pill("Neutral"), pill("Info", "info"), pill("Success", "success"), pill("Warning", "warning"), pill("Danger", "danger"), btn("Primary"), btn("Secondary", "secondary"), btn("Ghost", "ghost"), btn("Danger", "danger"), chip("Chip"), chip("Selected", true)], "start"),
    grid("1-1-1", [input("Input", { value: "Tamarindo, Guanacaste" }), input("Select", { value: "Property", select: true }), timeRange("9:00 am", "12:00 pm", "Time range")]),
    grid("1-1", [
      table(["Member", "Membership", "Renews"], [{ cells: [M.imani, pill("Active", "success"), "Nov 14"] }, { cells: [M.joseLuis, pill("Past due", "danger"), "Oct 24"] }]),
      list([{ avatar: "auto", title: M.hiroshi, meta: "S.A. clean-up", pill: p("Quote Sent", "info") }, { lead: "9:30", leadMeta: "20 min", title: M.asa, meta: "Residency renewal" }]),
    ]),
    grid("1-1-1", [
      stack([progress("Profile complete", 0.65), toggle("Switch", true), toggle("Checkbox", true, undefined, "checkbox"), tabs(["Board", "List"], "Board")], 2),
      timeline([{ title: "Request received", state: "done" }, { title: "Lawyer review", state: "current" }, { title: "Filing", state: "upcoming" }]),
      stack([message("ai", "AI assistant", "The marchamo is the yearly vehicle permit.", "General information, not legal advice."), deflist([{ term: "Minutes left", value: "40 of 60" }, { term: "Calls left", value: "2 of 3" }])], 2),
    ]),
  ],
  3,
);

const OP_SCENES: Record<CursorOpName, Scene> = {
  move: { aspect: "wide", root: stack([text("move: glide to a node or a point", "h2"), row([btn("Here", "secondary", "a"), btn("Then here", "secondary", "b")], "between")], 6), script: [move("a"), move("b"), move({ x: 0.5, y: 0.8 })] },
  hover: { aspect: "wide", root: stack([text("hover: pointer hand and a hover state", "h2"), list([{ id: "r1", title: M.omar, meta: "Property transfer" }, { id: "r2", title: M.chloe, meta: "Will and estate plan" }])], 4), script: [hover("r1"), hover("r2")] },
  click: {
    aspect: "wide",
    root: stack([text("click: press, ripple, then state changes", "h2"), row([btn("Close task", "primary", "go"), pill("Open", "warning", "state")], "start")], 6),
    script: [click("go", [set("state", { label: "Closed", tone: "success" })])],
  },
  type: { aspect: "wide", root: stack([text("type: characters appear one by one", "h2"), input("Outcome", { multiline: true, id: "in" })], 4), script: [type("in", "Called José-Luis. He uploads the DIMEX copy by Friday.")] },
  drag: {
    aspect: "wide",
    root: stack(
      [
        text("drag: a board card moves to another column", "h2"),
        board([
          { id: "c1", title: "Legal Review", cards: [{ id: "k1", title: M.hiroshi, meta: "S.A. clean-up", badge: p("8 days in stage", "warning") }] },
          { id: "c2", title: "Quote Sent", cards: [{ id: "k2", title: M.chloe, meta: "Will and estate plan" }] },
          { id: "c3", title: "Filing", cards: [] },
        ]),
      ],
      4,
    ),
    script: [drag("k1", "c3")],
  },
  scroll: {
    aspect: "wide",
    root: {
      type: "frame",
      role: "staff",
      nav: ["Today", "Members"],
      active: "Members",
      title: "scroll: the page moves, the shell stays",
      body: stack(Array.from({ length: 9 }, (_, i) => card(`Section ${i + 1}`, [meta("Content")], { id: `sec${i + 1}` })), 3),
    },
    script: [scroll("sec7"), wait(600), scroll("sec1")],
  },
  wait: { aspect: "wide", root: stack([text("wait: hold, then apply changes", "h2"), pill("Waiting", "neutral", "w")], 4), script: [wait(1200, [set("w", { label: "Done", tone: "success" })])] },
};

const OVERLAYS: Scene = {
  aspect: "desktop",
  root: {
    type: "frame",
    role: "lawyer",
    nav: ["Today", "Board", "Clients"],
    active: "Clients",
    title: "Overlays: drawer, dialog, menu, toast",
    actions: [btn("Move to…", "secondary", "mv", "sm")],
    body: stack([menu("menu", [{ label: "Quote Sent" }, { label: "Filing" }]), row([btn("Open drawer", "secondary", "od"), btn("Open dialog", "secondary", "odl"), btn("Show toast", "secondary", "ot")], "start")], 4),
    overlays: [
      drawer("drawer", M.hiroshi, [text("Their question", "label"), text("“Can I sell the house before the S.A. books are fixed?”"), btn("Close", "secondary", "cd")], "S.A. clean-up"),
      dialog("dialog", "Cancel this call?", [text("It goes back to your monthly calls and minutes."), row([btn("Keep the call", "secondary", "kc", "sm")], "end")]),
      toast("toast", "Saved"),
    ],
  },
  script: [
    click("mv", [set("menu", { open: true })]),
    wait(500, [set("menu", { open: false })]),
    click("od", [set("drawer", { open: true })]),
    click("cd", [set("drawer", { open: false })]),
    click("odl", [set("dialog", { open: true })]),
    click("kc", [set("dialog", { open: false })]),
    click("ot", [set("toast", { visible: true })]),
  ],
};

// ─── Caption playground ─────────────────────────────────────────────────────

const CAP_TARGETS: Array<{ id: string; label: string }> = [
  { id: "tl", label: "Top left" },
  { id: "tr", label: "Top right" },
  { id: "mid", label: "Middle" },
  { id: "bl", label: "Bottom left" },
  { id: "br", label: "Bottom right" },
];

const filler = (t: string) => card(undefined, [meta(t)], { tone: "mist" });

function captionScene(target: string, label: string, explain: string, aspect: SceneAspect): Scene {
  const root = stack(
    [
      row([btn("Top left", "secondary", "tl", "sm"), btn("Top right", "secondary", "tr", "sm")], "between"),
      filler("Filler, so the targets sit near the edges of the scene."),
      filler("The caption is placed below, above, right or left of its target, whichever fits."),
      row([btn("Middle", "secondary", "mid", "sm")], "center"),
      filler("On phone scenes and narrow screens it docks under the scene instead."),
      filler("Reading time: 230 ms a word, at least 1.8 s, at most 6 s."),
      row([btn("Bottom left", "secondary", "bl", "sm"), btn("Bottom right", "secondary", "br", "sm")], "between"),
    ],
    6,
  );
  return { aspect, root, script: [say(hover(target), label || "Element", explain), wait(500)] };
}

const GROUPS: GlossaryEntry["group"][] = ["ILP", "Colombia", "Costa Rica", "Mexico", "Panama", "Portugal", "Spain", "Money and numbers", "On the screen"];

// ─── Gallery ────────────────────────────────────────────────────────────────

export default function TutorialsGallery() {
  const api = useTutorial();
  const [role, setRole] = useState("staff");
  const forRole = useMemo(() => ALL_TUTORIALS.filter((t) => t.audience?.includes(role as TutorialRole)), [role]);
  const [tutId, setTutId] = useState(ALL_TUTORIALS[0]?.id ?? "");
  const tut = ALL_TUTORIALS.find((t) => t.id === tutId) ?? forRole[0];
  const [stepIdx, setStepIdx] = useState(0);
  const st = tut?.steps[Math.min(stepIdx, (tut?.steps.length ?? 1) - 1)];
  const [staticFrame, setStaticFrame] = useState(false);
  const [op, setOp] = useState<CursorOpName>("click");
  const newTerms = useMemo(() => (tut ? firstUseTerms(tut.steps) : []), [tut]);
  const [capLabel, setCapLabel] = useState("Close task");
  const [capText, setCapText] = useState(
    "Marks this job as finished. You write one line about what happened, so anyone on the team can see it later.",
  );
  const [capTarget, setCapTarget] = useState("mid");
  const [capPhone, setCapPhone] = useState(false);
  const capScene = useMemo(() => captionScene(capTarget, capLabel, capText, capPhone ? "phone" : "wide"), [capTarget, capLabel, capText, capPhone]);
  const capWords = wordCount(capText);
  const capTerms = findTerms(`${capLabel}. ${capText}`);

  return (
    <div className={s.wrap}>
      <p className={s.small}>
        Configs live in <code>src/tutorials/&lt;role&gt;/&lt;screen&gt;.ts</code>; the engine in <code>@/components/tutorial</code>. See{" "}
        <code>docs/workstreams/TUTORIALS.md</code>.
      </p>

      <h3 className={s.h3}>Every tutorial</h3>
      <Tabs
        label="Portal"
        value={role}
        onChange={setRole}
        tabs={ROLES.map((r) => ({
          id: r.id,
          label: r.label,
          content: (
            <ul className={s.list}>
              {ALL_TUTORIALS.filter((t) => t.audience?.includes(r.id as TutorialRole)).map((t) => (
                <li key={t.id} className={s.item}>
                  <span className={s.itemText}>
                    <span className={s.itemTitle}>{t.title}</span>
                    <code className={s.route}>{String(t.route)}</code>
                    <span className={s.small}>
                      {t.steps.length} steps · v{t.version} · {api.isSeen(t.id) ? "seen" : "not seen"}
                    </span>
                  </span>
                  <span className={s.itemActions}>
                    <Button size="sm" onClick={() => void api.start(t.id)}>
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setTutId(t.id);
                        setStepIdx(0);
                      }}
                    >
                      Inline
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          ),
        }))}
      />
      <div className={s.row}>
        <Button variant="secondary" onClick={() => api.reset()}>
          Reset all seen states
        </Button>
        <Button variant="ghost" onClick={() => api.openList(role as TutorialRole)}>
          Open the Tutorials list
        </Button>
      </div>

      {tut && st && (
        <>
          <h3 className={s.h3}>Inline preview</h3>
          <div className={s.controls}>
            <Select label="Tutorial" value={tut.id} onChange={(e) => { setTutId(e.target.value); setStepIdx(0); }}>
              {ALL_TUTORIALS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}
                </option>
              ))}
            </Select>
            <Select label="Step" value={String(stepIdx)} onChange={(e) => setStepIdx(Number(e.target.value))}>
              {tut.steps.map((x, i) => (
                <option key={x.id} value={i}>
                  {i + 1}. {x.title}
                </option>
              ))}
            </Select>
            <Switch label="Reduced-motion frame" checked={staticFrame} onChange={setStaticFrame} />
          </div>
          <div className={s.preview}>
            <ScenePlayer key={`${tut.id}:${st.id}:${staticFrame}`} scene={st.scene} forceStatic={staticFrame} newTerms={newTerms[stepIdx]} />
            <div className={s.copy}>
              <p className={s.stepTitle}>{st.title}</p>
              <p>{st.body}</p>
              {st.target && (
                <p className={s.small}>
                  Live target: <code>data-tour=&quot;{st.target}&quot;</code>
                </p>
              )}
              <p className={s.small}>
                {(st.scene.script ?? []).filter((o) => o.explain).length} captions · glossary words shown here for the first time:{" "}
                {newTerms[stepIdx]?.flat().map((t) => t.word).join(", ") || "none"}
              </p>
            </div>
          </div>
        </>
      )}

      <h3 className={s.h3}>Caption playground</h3>
      <p className={s.small}>
        Write a caption and pick where its target sits. Keep it to one or two short sentences, about 28 words at most, for someone who knows nothing about
        the law, ILP or the app.
      </p>
      <div className={s.capControls}>
        <TextInput label="Element name (bold)" value={capLabel} onChange={(e) => setCapLabel(e.target.value)} />
        <Select label="Target" value={capTarget} onChange={(e) => setCapTarget(e.target.value)}>
          {CAP_TARGETS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </Select>
        <Switch label="Phone scene (docked caption)" checked={capPhone} onChange={setCapPhone} />
      </div>
      <TextArea label="Explanation" value={capText} rows={3} onChange={(e) => setCapText(e.target.value)} />
      <p className={s.small}>
        {capWords} words{capWords > 28 ? " (too long: aim for 28 or fewer)" : ""} · shown for {(readingTime(capText) / 1000).toFixed(1)} s · glossary words:{" "}
        {capTerms.map((k) => GLOSSARY[k].word).join(", ") || "none"}
      </p>
      <ScenePlayer scene={capScene} loops={20} explainList={false} />

      <h3 className={s.h3}>Glossary</h3>
      <p className={s.small}>
        {TERM_KEYS.length} words in <code>src/tutorials/glossary.ts</code>. A caption that uses one offers its meaning under &ldquo;What&rsquo;s this?&rdquo;
        the first time it appears in a tutorial.
      </p>
      <div className={s.glossary}>
        {GROUPS.map((g) => (
          <section key={g} className={s.glossaryGroup} aria-label={g}>
            <p className={s.glossaryTitle}>{g}</p>
            <dl className={s.glossaryList}>
              {TERM_KEYS.filter((k) => (GLOSSARY[k] as GlossaryEntry).group === g).map((k) => (
                <div key={k} className={s.glossaryItem}>
                  <dt>
                    {GLOSSARY[k].word} <code className={s.route}>{k}</code>
                  </dt>
                  <dd>{GLOSSARY[k].meaning}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <h3 className={s.h3}>Scene playground: mock elements</h3>
      <ScenePlayer scene={{ aspect: "desktop", root: ELEMENTS }} />

      <h3 className={s.h3}>Scene playground: cursor ops</h3>
      <Tabs
        label="Cursor op"
        value={op}
        onChange={(id) => setOp(id as CursorOpName)}
        tabs={(Object.keys(OP_SCENES) as CursorOpName[]).map((name) => ({
          id: name,
          label: name,
          content: <ScenePlayer key={name} scene={OP_SCENES[name]} loops={20} />,
        }))}
      />

      <h3 className={s.h3}>Scene playground: overlays</h3>
      <ScenePlayer scene={OVERLAYS} loops={20} />
    </div>
  );
}
