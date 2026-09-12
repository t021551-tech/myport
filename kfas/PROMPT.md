# Build prompt — Munsif (مُنصِف)

Use this to regenerate or extend the workspace. It describes the brief, the
design system, the data model and the rules, so a fresh build lands in the same
place.

---

## The brief

Build a website for **KFAS** (the Kuwait Foundation for the Advancement of
Sciences) that does four things to the hiring interview:

1. **Makes selection objective.** One published rubric per vacancy, weighted
   criteria, anchored scales, and no score without evidence from the recording.
2. **Lets other people in the organisation listen and approve.** Interviews are
   recorded and queued for reviewers outside the panel, who sign off only after
   they have actually listened.
3. **Makes unusual questions explainable.** Questions come from an approved
   bank. Anything else is recorded as unscripted, and the panellist has to
   account for it before the interview can close.
4. **Strengthens fairness.** Measure it from the records — question parity,
   panel agreement, panellist calibration, talk time, order effects — rather
   than asserting it.

It is a **concept prototype**, not a KFAS system, and it says so on every page.
Static pages, no build step, no framework, no backend. State lives in
localStorage.

## Pages

| File | What it is |
|---|---|
| `index.html` | Overview: the four pillars, how a round runs, the gates the workspace enforces, and an honest list of what a production system would still need. Live counts read from the data. |
| `live.html` | Turn the microphone on and the room is transcribed live. Each question is checked as it is asked — in the bank, near a bank question, outside it, retired, or one that should not have been asked — and each answer is captured under it. Stopping writes the whole thing into the review queue with flags already raised. |
| `queue.html` | The review queue: every interview with its weighted score, question coverage, status and how much of it you personally have heard. Filters by vacancy, status, and "needs me". |
| `review.html` | The core screen. Recording player, the questions as chapters, the scorecard, flags and their clarification threads, and the sign-off rail. |
| `questions.html` | The approved bank per vacancy and criterion, the flags waiting to be explained, a propose-a-question form, and the retired questions with their reasons. |
| `fairness.html` | The fairness report, computed from the same records. |

## Design system

**Palette** — light and institutional, one committed theme (no dark mode):

| token | value | role |
|---|---|---|
| `--ground` | `#F5F3EE` | warm paper ground |
| `--card` | `#FFFFFF` | cards, tables, the player |
| `--ink` | `#12211C` | body text, a green-black |
| `--green` | `#0B6E4F` | the primary: buttons, the candidate voice, pass states |
| `--blue` | `#2B5E86` | the panel voice, scores, neutral information |
| `--amber` | `#B5791C` | warnings and the prototype notice |
| `--flag` | `#A93B26` | flags, prohibited questions, failed checks |

**Type** — IBM Plex Sans for text, **IBM Plex Sans Arabic** for Arabic so the
name and headings are set properly rather than falling back to a system face,
IBM Plex Mono for every figure, timestamp and score.

**Tone** — this is an internal tool for a serious process. Plain sentences, no
persuasion, no adjective stacking. Where a number could mislead, say so next to
it.

## Data model — `data.js`

Everything on screen derives from this file. All of it is fictional.

- `people` / `permissions` — six identities and what each may do: `score`,
  `review`, `rule`, `decide`. The identity switcher in the top bar changes who
  you are acting as, and the interface changes with it.
- `roles` — vacancies, each with `criteria`: `{ id, name, weight, anchors }`.
  Weights add to 100. Anchors are written at **1, 3 and 5 only** — 2 and 4 sit
  between them, which is how anchored scales are actually used.
- `questions` — `{ roleId, criterionId, kind: core|probe, status, text }`.
  A question with no criterion cannot be scored, which is the point.
- `interviews` — `{ code, date, slot, durationSec, panel, segments, scores,
  flags, approvals }`. A `segment` is one answer: `start`, `end`, the `qid` it
  answers (or `null` for unscripted), `candidateSec` / `panelSec` for the talk
  split, and a short excerpt.

Bump `version` after editing, or saved browser state will shadow the change.

## The live check — `live.js`

Two tiers, and the page says which one is running.

**The rule tier** always runs, in the browser, with no key and no network. A question is
matched against the approved bank by Dice coefficient over content words: 0.5 and above is
the bank question, 0.32 to 0.5 is "near — confirm it", below is unscripted. Separately it
tests eight categories that are not a matter of taste — family and pregnancy, age,
nationality and religion, health, gender framing, home life and commute, politics, pay
history — in English and Arabic, and flags leading phrasing. Answers get signals, never a
score: length, whether a specific case is named, reasoning, a limitation admitted, figures
cited.

**The model tier** runs where `claude.use('sample')` resolves (a published Artifact). The
transcript, the bank and the criteria go to Claude, which returns a note per turn and a
paragraph on the interview as a whole. It is shown beside the rule verdict, labelled
"Claude's read", never merged into it.

Transcription is the browser's own speech recognition (Chrome and Edge today). Elsewhere the
microphone still records and a transcript can be pasted; the same checks run over it.

## The rules the code enforces

Six sign-off gates (`M.checks`), all live:

1. Every panellist has scored every criterion.
2. Every score carries written evidence.
3. Every core question was asked.
4. No flag is unresolved.
5. No criterion has the panel more than two points apart.
6. The reviewer has heard 80% of the recording and **all** of any flagged answer.

Flags are ruled on by HR only: *allowed*, *excluded from scoring*, or *excluded
and the panellist referred*. Excluding marks the segment on the recording.
Candidate names are withheld until a decision is recorded.

## Fairness maths — `M.metrics`

Nothing is stored pre-computed. Question parity, evidence completeness, panel
agreement, panellist calibration (each panellist&rsquo;s mean distance from the panel
mean on the same answers), candidate talk share, score distribution and the
early/late slot gap are all read out of the interview records, and the findings
list is generated from them, ordered worst first.

## Rules for the build

- Everything must be true. The prototype notice appears on every page, the
  sample data is labelled fictional wherever it could be mistaken for real, and
  the fairness page carries its own "what this cannot tell you" card.
- No fabricated recordings. The player runs a clock over the real segment
  timings and draws the real talk split; attaching an audio file drives the same
  transport. The demo shortcut that fills in a listening record is labelled as a
  thing that would not exist in a real deployment.
- Accessibility: visible focus rings, `aria-hidden` on decoration, `aria-pressed`
  on toggles, the locked Approve button is `aria-disabled` and explains itself
  when pressed rather than being silently inert, `prefers-reduced-motion`
  respected.
- The page must read at rest. Nothing waits on scroll to appear.
