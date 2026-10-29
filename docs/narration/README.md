# Landing narrator

The three public landings (`/`, `/attorneys`, `/customer-success`) offer a narrated walk through the page. On the first visit in a browser session a full-screen overlay offers "Start the experience" or "Read the page instead". After either choice a small "Play narration" button (bottom left) starts it again. While it plays, a bar at the bottom has play/pause, previous and next section, mute, captions and Exit.

Each landing has one audio file and one transcript. When the audio reaches the moment a section's opening words are spoken, the page scrolls to that section. The section's animations then play on their own as it enters the screen.

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
- Scrolling with the wheel, touch or keyboard pauses the audio. "Resume" goes back to the current section and continues from the same moment.
- With reduced motion turned on, the narrator jumps to each section without smooth scrolling.
- The overlay is not in the server HTML, so search engines and visitors without JavaScript read the plain page. Escape closes it.
- To see the overlay again in the same tab, clear the session key `ilp_narration_offer_<page>` or open a new tab.
- Journeys records `narration.start.<page>`, `narration.read.<page>`, `narration.complete.<page>` and `narration.exit.<page>.<cue id>` as clicks, only for visitors who allow measurement.
