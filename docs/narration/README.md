# Landing narrator

The three public landings (`/`, `/attorneys`, `/customer-success`) offer a narrated walk through the page. On the first visit in a browser session a full-screen overlay offers "Start the experience" or "Read the page instead". After either choice a small "Play narration" button (bottom left) starts it again. While it plays, a bar at the bottom has play/pause, previous and next section, mute, captions and Exit.

Each landing has one audio file and one transcript. The transcript says when each section's narration starts; the page then scrolls through that section while it is narrated (see "How the page follows the voice"). The section's animations play on their own as it moves through the screen. A voice wave in the bar is also the play/pause control.

Code: `src/lib/narration/` (scripts, transcript, timing, state machine, session) and `src/components/narration/Narrator.tsx`. Tests: `tests/narration.test.mjs`.

## 1. Audio from ElevenLabs

1. Open `docs/narration/SCRIPTS.md`. Each landing has one "ElevenLabs text" block and a cue table.
2. Paste the whole block into ElevenLabs with the v3 model, tags included. v3 reads `[warm]`, `[short pause]`, `[pause]` and the other tags as directions, not words.
3. Export one MP3 per landing: `home.mp3`, `lawyers.mp3`, `csm.mp3`.

## 2. Timestamps from Whisper

Run Whisper on each file with timestamps and JSON output. Any of these works.

openai-whisper (Python, `pip install -U openai-whisper`), word timestamps:

```
whisper home.mp3 --model medium --language en --word_timestamps True --output_format json
whisper lawyers.mp3 --model medium --language en --word_timestamps True --output_format json
whisper csm.mp3 --model medium --language en --word_timestamps True --output_format json
```

This writes `home.json`, `lawyers.json` and `csm.json` next to the audio.

whisper.cpp (convert to 16 kHz WAV first; `-ml 1` gives one word per entry, `-of` sets the output name):

```
ffmpeg -i home.mp3 -ar 16000 -ac 1 home.wav
./whisper-cli -m models/ggml-medium.en.bin -f home.wav -l en -oj -ml 1 -of home
```

(older builds call the program `./main`). Repeat for `lawyers` and `csm`.

whisperX:

```
whisperx home.mp3 --model medium --language en --output_format json
```

OpenAI API: `response_format=verbose_json` with `timestamp_granularities=["word","segment"]`, saved as `home.json`.

## 3. Where the files go

```
frontend/public/narration/home.mp3      frontend/public/narration/home.json
frontend/public/narration/lawyers.mp3   frontend/public/narration/lawyers.json
frontend/public/narration/csm.mp3       frontend/public/narration/csm.json
```

How the narrator uses them:

- Audio and JSON: each cue starts when its opening words (the cue table's last column) are heard. One misheard word is tolerated. A cue that is not found gets a time between its neighbours.
- Audio but no JSON: the cues are spread over the audio by the length of their text. Usable, but add the JSON for exact timing.
- No audio yet (current state): captions only, timed at 150 words a minute, `[short pause]` 0.5 s and `[pause]` 1 s. The bar shows "Audio coming soon", and the overlay says the walk has captions.

The overlay's "about N minutes" uses the audio's length once the file is there.

## How the page follows the voice

Code: `src/lib/narration/follow.ts`.

- Each narrated section has a scroll range. It starts at the section's top (topY) and ends where the section's bottom meets the top of the narrator bar: endY = section bottom minus the visible height, with the bar's height (`--narrator-reserve`) taken off the visible height. The visible height is the visual viewport on phones, so the address bar is counted. Both are kept within the page's scroll range.
- A section shorter than the visible area has no range (endY = topY). It stays top-aligned for its whole cue, like the hero.
- Each cue's narration runs from its start in the transcript to the end of its speech: the transcript's segment end when that comes before the next cue, otherwise 0.35 s before the next cue. The last cue ends 0.3 s before the audio does.
- While a cue is narrated, the page moves from topY to endY in proportion to the time (with a gentle sine ease at both ends), so pinned stories advance with the voice and the section's last line arrives as its narration ends.
- Between two cues, the page moves to the next section's top in a short eased move: 0.5 s, or the pause between the cues when shorter (never under 0.25 s). Sections without narration in between are passed over in that move:
  - Home: after "What a missed date can cost you": the free check demo and the first photo band. After "What the membership includes": the member home demo. After "Real situations": the lawyer call demo and the second photo band. After "Six countries": the example situations, pricing, the "what you pay" demo and the questions.
  - Lawyers: after "What the partnership is": the portal demo, "What happens around each call", the call demo, the partnership facts, the hours and fees demo and "Questions lawyers ask".
  - Customer success: after "What the role is": the CSM portal demo, the role facts and "Questions about the role".
- The position is computed every frame from the audio's current time (or the caption-only clock) and applied through Lenis as an immediate scroll, so Lenis's own smoothing does not pull against it.
- Ranges are measured when the narrator starts and again after a resize, an orientation change, a visual viewport resize (phone address bar) or any change in the sections' or the page's height (fonts, images, demos opening, the switch between pinned and stacked layouts). The next frame places the page for the current time in the new layout, so it stays in step.
- Resume and previous/next ease from where the page is to the position for the current time in 0.5 s.
- Reduced motion: the page jumps to each section's top when its cue starts and does not move in between.

To tune a section: if it finishes too early or late, its narration is too short or long for its height. Lengthen or shorten that cue's text, or check that the transcript's segment for it ends where the speech ends.

## Changing a script

1. Edit `ilp/docs/narration/SCRIPTS.md` and copy it to `frontend/docs/narration/SCRIPTS.md`. A test fails while the two differ.
2. Update the same landing in `src/lib/narration/scripts.ts`: the full `script` text and, per cue, `read` (that cue's lines) and `match` (the opening words from the cue table). Keep a `[pause]` line between cues. `npm test` fails if anything differs from SCRIPTS.md or breaks `copy-rules.md`.
3. Opening words must be words Whisper writes the same way: no numbers or prices at the start of a cue.
4. Regenerate the landing's audio, run Whisper again, and replace both files.

## Tuning

- If the page scrolls too early or late for a section, change that cue's opening words in the cue table to words that are clearly spoken at the start of it, or check the JSON for how Whisper wrote them.
- The homepage cues follow the page order: "What you get" (`home-price`) comes before "What a missed date can cost you" (`home-costs`).
- Section ids per cue are in `scripts.ts` (`anchor`).

## Behaviour to know about

- Nothing plays until the visitor presses Start or "Play narration".
- Previous and next jump to the start of a cue in the audio.
- Scrolling with the wheel, touch or keyboard pauses the audio and the scroll. "Resume" or a click on the wave eases back to where the narration is and continues from the same moment.
- The overlay is not in the server HTML, so search engines and visitors without JavaScript read the plain page. Escape closes it.
- To see the overlay again in the same tab, clear the session key `ilp_narration_offer_<page>` or open a new tab.
- Journeys records `narration.start.<page>`, `narration.read.<page>`, `narration.complete.<page>` and `narration.exit.<page>.<cue id>` as clicks, only for visitors who allow measurement.
