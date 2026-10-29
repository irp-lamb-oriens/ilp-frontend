# Landing narrator

The three public landings (`/`, `/attorneys`, `/customer-success`) offer a narrated walk through the page. On the first visit in a browser session a full-screen overlay offers "Start the experience" or "Read the page instead". After either choice a small "Play narration" button (bottom left) starts it again. While it plays, a bar at the bottom has play/pause, previous and next section, mute, captions and Exit.

Code: `src/lib/narration/` (scripts, timing, scroll, state machine, session) and `src/components/narration/Narrator.tsx`. Tests: `tests/narration.test.mjs`.

## Audio from ElevenLabs

1. Open `docs/narration/SCRIPTS.md`. Each `###` block is one clip: a short pitch of one or two sentences for its section. The page carries the detail.
2. Paste only the text under "Read:" into ElevenLabs. Use the same voice and settings for every clip on a page.
3. Download as MP3 and name it exactly as the block heading, for example `home-02-problem.mp3`.
4. Put it in `frontend/public/narration/<page>/`, where `<page>` is `home`, `lawyers` or `csm`:

```
public/narration/home/home-01-hero.mp3 … home-09-final.mp3
public/narration/lawyers/lawyers-01-hero.mp3 … lawyers-05-final.mp3
public/narration/csm/csm-01-hero.mp3 … csm-05-final.mp3
```

You can add clips one at a time. A clip that is missing plays as captions only, timed from its word count, and the bar shows "Audio coming soon". When no clip exists for a page, the overlay says the walk has captions and that audio is coming soon. Once the clips are there, the overlay's "about N minutes" uses their real lengths.

The homepage plays in page order, so `home-05-price` (What you get) plays before `home-04-costs` (What a missed date can cost you). The file names stay as they are.

## Changing a script and regenerating one clip

1. Edit the block in `ilp/docs/narration/SCRIPTS.md` and copy the file to `frontend/docs/narration/SCRIPTS.md`. A test fails while the two differ.
2. Paste the same new text into the `read` field of that cue in `src/lib/narration/scripts.ts`. The caption is the same text (if you ever add an ElevenLabs pause tag such as `<break time="0.5s" />`, the caption drops it and the timed fallback counts the pause).
3. Run `npm test`. It fails if `scripts.ts` and `SCRIPTS.md` differ by one character, or if the new text breaks `copy-rules.md`.
4. Regenerate only that clip in ElevenLabs and replace the file under the same name.

## Tuning the timing

Each cue in `src/lib/narration/scripts.ts` is tied to a section by `anchor` (its DOM id) and has a `scroll` mode:

- `jump`: the page scrolls to the section once, as the clip starts.
- `through`: for pinned scroll stories. The page lands on the story's start, then moves steadily to its end while the clip plays, so the beats change with the voice. Clips are short (about 5 to 8 seconds), so a tall story passes quickly; if it feels rushed, switch that cue to `jump` or lengthen the pitch. `startAt` must match the story: `0.35` for BeatStory and CostsStory, `0` for MorphStage (the problem, how ILP works).

Settings in `src/lib/narration/scroll.ts`:

- `DRIVE_SETTLE_S` (1.0 s): time at the start of a `through` clip spent landing on the section before the page starts moving.
- `DRIVE_HOLD` (0.1): share of a `through` clip at the end that stays on the last beat while the voice finishes. Raise it when the last beat arrives too late.

Settings in `src/lib/narration/timing.ts` (caption-only mode, before the audio exists):

- `WPM` (150): reading speed used for timing.
- `CUE_PAD` (0.6 s): silence after each clip.

If the beats run ahead of the voice in one section, lengthen that pitch (or add a pause tag) and regenerate that clip, or move the cue to `jump`. With audio present, the clip's own length sets the timing.

## Behaviour to know about

- Nothing plays until the visitor presses Start or "Play narration".
- Scrolling with the wheel, touch or keyboard pauses the voice and the auto-scroll. "Resume" continues the same section from where it stopped.
- With reduced motion turned on, the narrator jumps between sections without smooth scrolling.
- The overlay is not in the server HTML, so search engines and visitors without JavaScript read the plain page. Escape closes it.
- To see the overlay again in the same tab, clear the session key `ilp_narration_offer_<page>` or open a new tab.
- Journeys records `narration.start.<page>`, `narration.read.<page>`, `narration.complete.<page>` and `narration.exit.<page>.<cue id>` as clicks, only for visitors who allow measurement.
