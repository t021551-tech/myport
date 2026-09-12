# myport

Personal portfolio site for **Fatemah Adel Shamsah** — AI & Data Science undergraduate at
Manchester Metropolitan University.

## Contents

- `index.html` — the whole site: a single, self-contained page (no build step, no
  dependencies beyond Google Fonts). Dark editorial layout with a sticky identity rail,
  about / education / skills / programs sections and a contact card.
- `dives/` — **Thirteen Pearls**: thirteen places in Kuwait grouped by who they suit, over a
  pearl-and-seawater backdrop. Every place carries a live 3D model (Three.js), each built
  from a photograph of the real place. One self-contained page: `dives/index.html`.
- `kfas/` — **Munsif** (مُنصِف): a concept prototype prepared as a proposal for KFAS — an
  interview review and fairness workspace. Five pages sharing `kfas/styles.css` and
  `kfas/app.js`: an overview, a live recorder that transcribes the room and checks each
  question as it is asked, a review queue, the review screen itself (recording player,
  scorecard, question flags, sign-off), the question bank, and a fairness report. All sample
  data is fictional and lives in `kfas/data.js`; the build brief is `kfas/PROMPT.md`.
- `notes/` — the Notebook: six running logs (places in Kuwait, a car build list, a gahwa
  log, things I'm learning, read & watched, small wins). A hub page plus one page per log,
  all sharing `notes/styles.css`. Currently a **draft** — every page carries a
  `.draft-note` paragraph and placeholder entries to be replaced.

## Running it locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publishing

The site is static, so it can be hosted anywhere. For GitHub Pages: repository
**Settings → Pages**, source **Deploy from a branch**, branch `main`, folder `/ (root)`.

## Editing

Everything for the portfolio lives in `index.html`:

- Colours, fonts and spacing are CSS custom properties in the `:root` block.
- The background artwork (ledger grid, growth chart, monogram) is the `.bg` block —
  purely decorative and marked `aria-hidden`.
- Content sections are plain HTML under `<main>`; add a program by copying one `<li>`
  in the `.index` list and changing its `.tag` class (`prog`, `lead` or `tech`).

Munsif is five static pages with no build step. `kfas/data.js` holds the seed — people,
vacancies with their rubrics, the question bank and the interviews with their segment
timings, scores and flags — and everything on screen is derived from it: `kfas/app.js` has
the state store (localStorage, reseeded whenever `data.js` changes its `version`), the
fairness maths (`M.metrics`), the sign-off gates (`M.checks`) and the recording player.
Page logic is one file each: `review.js`, `questions.js`, `fairness.js`, `live.js`, with the
queue and overview scripts inline. `live.js` holds the live capture: the browser's own speech
recognition for the transcript, `MediaRecorder` for the audio, and the question check itself —
a token-overlap match against the approved bank plus the prohibited-question categories, all
of it in the browser with no key and no network. Its pure functions are exposed as
`window.LiveCheck` so they can be exercised directly. Where the page is published somewhere
`claude.use('sample')` resolves, the transcript is also sent to Claude for a second reading,
shown against each turn and labelled as such; everywhere else the rule check stands alone. To change what the demo shows, edit `kfas/data.js` and bump its
`version`. See `kfas/PROMPT.md` for the brief the build followed.

For the Notebook, colours and components live in `notes/styles.css`. Every log page has the
same shape — page head, entries, then an open-ended list — so a new entry is a copy of one
`<li class="entry">` with new content. The places and parts pages filter their entries with
a small inline script driven by `data-tags` / `data-status`.

`dives/index.html` is one file with no build step. Colours are the `:root` tokens at the top;
each place is one `<article class="place">`; the pearls and silt are drawn on the `#drift` canvas; the four 3D scenes are the `build*()` functions in
the script at the bottom, sharing a single renderer harness. Three.js is loaded from cdnjs and
the page degrades cleanly to text if that script is blocked.
