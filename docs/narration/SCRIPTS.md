# ILP landing narration: one script per landing

Three scripts, one continuous audio file per landing.

## Workflow

1. Paste the "ElevenLabs text" block of a landing into ElevenLabs (use the v3 model, which reads the bracketed delivery tags such as [warm] and [short pause] as directions instead of words). Export one file per landing:
    - `home.mp3`
    - `lawyers.mp3`
    - `csm.mp3`
2. Run each file through Whisper with timestamps (segment or word level, JSON output). Name the outputs `home.json`, `lawyers.json` and `csm.json`.
3. Put the audio and the JSON in `frontend/public/narration/`. The narrator finds the start time of each cue's opening words in the transcript and scrolls to that section at that moment. Animations then play on their own as each section enters the viewport.

The cue table under each script lists the opening words the narrator looks for. Whisper may write numbers as digits, so no cue starts with a number or a price.

## Delivery tags used

- [warm]: friendly, relaxed tone.
- [calm]: even and unhurried.
- [matter-of-fact]: plain statement, no lift.
- [reassuring]: slightly softer, settling.
- [confident]: steady and clear, a little more weight.
- [inviting]: open, gently upbeat, used for the closing line.
- [short pause]: about half a second.
- [pause]: about one second, used between sections.

Voice settings: one calm, warm voice for all three, stability around 50%, similarity around 75%, speed 1.0.

---

## 1. Home page (customers): home.mp3

### ElevenLabs text

[warm] ILP keeps the legal side of your life abroad in order, in six countries, for one monthly fee.
[pause]
[calm] Living abroad comes with legal dates written in another language, [short pause] and nobody sends you a reminder.
[pause]
[reassuring] Start with a free two-minute check, and join when you want a lawyer to look at what it found.
[pause]
[confident] Next to a typical fifteen hundred dollar retainer, ILP is seventy-nine dollars and ninety-nine cents a month, [short pause] with your lawyer calls included.
[pause]
[matter-of-fact] A late filing can bring a fine, [short pause] and asking around rarely gives you one clear answer.
[pause]
[warm] Your lawyer reads your file before each call, so your twenty minutes go straight to your question.
[pause]
[calm] Most questions look like these: a residency card coming up for renewal, [short pause] or a company tax you had never heard of.
[pause]
[confident] Colombia, Costa Rica, Mexico, Panama, Portugal and Spain are all open, each with lawyers licensed there.
[pause]
[inviting] Pick your country and take the free check. [short pause] It takes about two minutes.

### Cue table

| Cue | Section on the page | Opening words to match |
| --- | --- | --- |
| home-hero | hero | ILP keeps the legal side |
| home-problem | The problem | Living abroad comes with |
| home-how | How ILP works | Start with a free |
| home-price | What you get | Next to a typical |
| home-costs | What a missed date can cost you | A late filing can |
| home-includes | What the membership includes | Your lawyer reads your file |
| home-situations | What this looks like in real situations | Most questions look like |
| home-countries | Six countries, open now | Colombia, Costa Rica, Mexico |
| home-final | Start with the free deadline check | Pick your country and |

---

## 2. Lawyers page (/attorneys): lawyers.mp3

### ElevenLabs text

[warm] ILP brings you prepared clients and handles the follow-up after each call.
[pause]
[matter-of-fact] Members arrive with their question written down, [short pause] and our team does the booking and chasing you would otherwise do unpaid.
[pause]
[calm] You set your hours and read a one-screen brief before each call. [short pause] Afterwards you confirm the summary, and we take it from there.
[pause]
[reassuring] Joining is free and you keep your own practice. [short pause] Work beyond a call is quoted by you and accepted by the member.
[pause]
[inviting] The application has seven short steps, and you can save a draft and finish it later.

### Cue table

| Cue | Section on the page | Opening words to match |
| --- | --- | --- |
| lawyers-hero | hero | ILP brings you prepared |
| lawyers-why | Why lawyers join | Members arrive with their |
| lawyers-how | How it works for you | You set your hours |
| lawyers-partnership | What the partnership is | Joining is free and |
| lawyers-final | Apply to take member calls | The application has seven |

---

## 3. Customer success page (/customer-success): csm.mp3

### ElevenLabs text

[warm] A customer success manager makes sure every lawyer call ends with a next step the member acts on.
[pause]
[calm] Lawyer calls work when the member arrives prepared and someone follows through afterwards, [short pause] and at ILP that someone is you.
[pause]
[matter-of-fact] Each morning the portal puts the members who need you most at the top, with a playbook for each situation.
[pause]
[confident] You own the relationship with each member, [short pause] and the lawyer keeps the legal advice.
[pause]
[inviting] There is no online application yet. [short pause] Write to the ILP team about your client experience and the languages you speak.

### Cue table

| Cue | Section on the page | Opening words to match |
| --- | --- | --- |
| csm-hero | hero | A customer success manager |
| csm-why | Why the role matters | Lawyer calls work when |
| csm-day | How your day works | Each morning the portal |
| csm-role | What the role is | You own the relationship |
| csm-final | Write to the ILP team | There is no online |
