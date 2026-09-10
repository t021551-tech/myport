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
- `rafeeq/` — **Rafeeq** (رفيق): a private front door to addiction treatment. It asks for one
  ID number and nothing else. Pick the substance from a library of twelve, get a staged plan
  with the medications a doctor can actually prescribe, pair a wrist band, and the band
  detects drug use from seven body signs — naming the drug class, the match strength and the
  signals behind it — then sends it to a doctor's queue. An aftercare section keeps the
  monitoring running after the patient is drug-free on a published step-down, carries a working
  PHQ-9 mood check that routes self-harm answers straight to crisis help instead of a score, and
  lists real Kuwaiti volunteering organisations. A section on being treated outside Kuwait sets
  the self-funded route beside the Ministry of Health's funded one and is explicit about which is
  actually private, and about which MOH steps can be done online and which cannot. One self-contained page
  (`rafeeq/index.html`) plus `rafeeq/PROMPT.md`, the build brief. It is a **prototype**: no
  real clinicians, placeholder clinician profiles, and one marked placeholder helpline
  number. All state stays in `localStorage`.
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

For the Notebook, colours and components live in `notes/styles.css`. Every log page has the
same shape — page head, entries, then an open-ended list — so a new entry is a copy of one
`<li class="entry">` with new content. The places and parts pages filter their entries with
a small inline script driven by `data-tags` / `data-status`.

`rafeeq/index.html` is one file too. Its colours are the `:root` tokens (light-first, with
both dark blocks); the substance library, the intake questions, the alert rules and the
clinician list are the four data arrays at the top of the script, so adding a substance
means adding one object with its own phases, medications, timeline and band signals.
A single `requestAnimationFrame` loop drives the traces, the vital tiles, the detection
readout and the rule checks; the demo clock runs 60× real time so a 20-minute rule fires in
20 seconds. Detection itself is `SIGNATURES` plus `detect()`: one direction vector per drug
class across the seven signals, compared by angle against the live deviation from the
patient's own baseline, capped at a 97% match because body signs are not a lab test. Real
band pairing uses Web Bluetooth's Heart Rate service and degrades to the demo band. The
whole design brief, including the rules about what the site must never claim a wrist band
can do, is in `rafeeq/PROMPT.md`.

`dives/index.html` is one file with no build step. Colours are the `:root` tokens at the top;
each place is one `<article class="place">`; the pearls and silt are drawn on the `#drift` canvas; the four 3D scenes are the `build*()` functions in
the script at the bottom, sharing a single renderer harness. Three.js is loaded from cdnjs and
the page degrades cleanly to text if that script is blocked.
