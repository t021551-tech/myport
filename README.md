# myport

Personal portfolio site for **Fatemah Adel Shamsah** — AI & Data Science undergraduate at
Manchester Metropolitan University.

## Contents

- `index.html` — the whole site: a single, self-contained page (no build step, no
  dependencies beyond Google Fonts). Dark editorial layout with a sticky identity rail,
  about / education / skills / programs sections and a contact card.
- `notes/` — the Notebook: six running logs (places in Kuwait, a car build list, a gahwa
  log, things I'm learning, read & watched, small wins). A hub page plus one page per log,
  all sharing `notes/styles.css`. Currently a **draft** — every page carries a
  `.draft-note` paragraph and placeholder entries to be replaced.

## The other projects

These used to live inside this repository as subdirectories. Each is now its own
repository, with its history carried over:

- **[Darseen](https://github.com/t021551-tech/darseen)** (`darseen/`) — دار سين, a Kuwaiti
  restaurant in the Manchester Shopping Centre, with accounts and feedback backed by
  Supabase.
- **[Thirteen Pearls](https://github.com/t021551-tech/dives)** (`dives/`) — thirteen places
  in Kuwait, each with a live 3D model built from a photograph of the real place.
- **[Rafeeq](https://github.com/t021551-tech/rafeeq)** (`rafeeq/`) — رفيق, a private front
  door to addiction treatment. A prototype: no real clinicians, no network requests,
  `noindex`.

Each carries its own `vercel.json`, with only the headers and content-security policy that
project actually needs. Nothing in this repository depends on them any more; the portfolio
links out to them.

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
