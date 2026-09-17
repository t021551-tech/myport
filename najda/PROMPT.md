# Build prompt — Najda (نجدة)

Use this to regenerate or extend the page. It describes the brief, the design
system, the detection rules and the demo mechanics, so a fresh build lands in
the same place.

---

## The brief

Build a website for an automatic crash alert service. One self-contained page,
no build step, no frameworks, nothing loaded from anywhere except Google Fonts.
The product it describes is an AI that links a car and a phone, detects a crash
without anybody pressing anything, and sends the alert to the police operations
room and to one chosen person.

It has to do six things:

1. **Show both devices, and why neither is enough alone.** The car carries the
   crash bus, the restraint line and wheel speed; the phone carries position,
   occupant movement, cabin sound and the radio that survives the car losing
   power. Either can be unlinked on the page, and everything downstream —
   confidence cap, window length, what a staged event is classified as — has to
   change visibly when it is.
2. **Make detection legible rather than magic.** Eight channels, a rules table
   in full, and a readout that names the channels for and against the decision
   with their values.
3. **Let a visitor stage events, including harmless ones.** The false positives
   (pothole, speed bump, emergency braking, a dropped phone, a slammed door)
   have to be violent enough to fool a naive threshold, and the page has to say
   which channel refused to agree.
4. **Give the cancel window its own section.** It is the part of the design that
   decides whether anyone keeps the service switched on, so it gets a real
   countdown at real speed, a cancel button, and a table of how long the window
   is and why.
5. **Show both messages.** The operations room gets everything that helps a
   patrol arrive prepared; the contact gets where, when, how bad, and that 112
   already knows — in Arabic and English — and nothing medical.
6. **Show the supply side.** A dispatcher's queue, worst-first, where
   acknowledging an incident writes back into the driver's log.

## Detection: what is claimed, and how

**A crash is a shape, not a number.** The eight channels are peak resultant
acceleration, Δv over 150 ms, wheel speed, rotation and roll angle, the restraint
line, occupant movement, cabin sound and position. `classify()` runs the rules in
the order printed on the page: rollover past 60°, then any restraint deployment,
then Δv ≥ 30 km/h with peak ≥ 12 g, then the collision and minor bands, then
"harsh event", then nothing.

The pairs are what matter. A pothole at speed puts more than 4 g through the car
and nearly 7 g through a phone in a door pocket, and takes 1.4 km/h with it;
a 30 km/h wall takes all thirty. Emergency braking stops the car completely and
is still not a crash, because it took 2.8 seconds. A dropped phone reads 7.9 g on
the phone and 0.3 g on the car, and the cross-check channel says so in those
words.

Three honesty constraints hold in the code, not just the copy:

- **Confidence is capped by what is linked** — 98% with both devices, 94% with
  the car alone, 79% with the phone alone — and it describes how certain the
  system is that *a crash happened*, never how badly anyone is hurt. There is a
  row in the police packet reading `not claimed: no assessment of injury`.
- **Phone-only mode will not dispatch a minor event at all**, and its windows
  are 15 seconds longer. Weak evidence buys more benefit of the doubt.
- **Every dispatch passes through a window**, except the one case where asking is
  pointless: restraints fired, the car still, and nobody moving. That case is the
  rollover event, and it skips the countdown entirely.

## Design system

**Palette** — light-first, because the page is read in daylight by somebody
deciding whether to trust it far more often than it is read in a crashed car.
Neutrals are biased blue toward the accent. Severity colour is kept separate from
the accent, so colour means exactly one thing.

| token | light | dark | role |
|---|---|---|---|
| `--ground` | `#EDF0F4` | `#0B1016` | page ground |
| `--surface` | `#FAFCFD` | `#141C26` | panels, cards, trace frame |
| `--ink` | `#101720` | `#E7EDF4` | body text |
| `--ink-dim` | `#5F6C7B` | `#8A98A8` | secondary, blue-biased grey |
| `--signal` | `#1B5FB0` | `#74B4FF` | the single accent |
| `--steady` | `#1B6B4F` | `#4FC08D` | clear, no action, a channel arguing against |
| `--caution` | `#8A5206` | `#E9A742` | window open, priority 2 |
| `--crit` | `#A32218` | `#F08074` | crash, dispatched, priority 1 |
| `--on-accent` | `#F7FBFF` | `#08111A` | text on a signal fill |

Every colour is declared in the bare `:root` first, then redefined in
`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and again
in `:root[data-theme="dark"]`, which is what the theme button in the rail
switches. **Never** scope a component colour to a theme selector — use a token.

**Type** — four roles, all Google Fonts:
- Display: **Archivo** — a grotesque with instrument-panel confidence. Headings only.
- Body: **Inter**.
- Data: **JetBrains Mono** with `tabular-nums` — every g, km/h, coordinate,
  countdown and threshold.
- Arabic: **IBM Plex Sans Arabic**, so `نجدة` and the contact message are set
  properly. Every Arabic string carries `dir="rtl" lang="ar"`.

**Layout** — 1080px measure, eight views switched in place (`.view[hidden]`),
a sticky identity rail above a sticky scrolling tab strip, bands separated by
hairlines. The hero goes to two columns at 1000px.

## Page order

1. **The drive** — hero, live telemetry trace, the service in four moves
   (sense, decide, wait, dispatch), and four things the design refuses to claim.
2. **Car & phone** — the two device cards with their signal lists and unlink
   buttons, and the table of what each link state costs.
3. **What it watches** — the sensor window, eight live tiles, the verdict
   readout, the staging buttons, and the rules table in full.
4. **The 30 seconds** — the countdown ring, cancel and send-now, the table of
   window lengths, and the event log.
5. **What gets sent** — the two packets side by side, the delivery chain, and
   the list of what is deliberately not sent.
6. **Police view** — the dispatcher's queue and incident detail, with a
   schematic map drawn on a canvas (never a real map: the page has promised not
   to make that request).
7. **Contacts** — three ranked contacts, the medical card, and the rules around
   who is told what.
8. **What it can't do** — six real failure modes of automatic crash alerting,
   then the prototype statement.

## Demo mechanics

A single `requestAnimationFrame` loop drives the traces, the tiles and the
countdown. `sim` holds the driving state; `inject()` splices an event's pulse and
speed change into it; 620 ms later `classify()` runs and the verdict, the log,
the packet and the queue all re-render from the same object. The countdown runs
at real speed — 30 seconds means 30 seconds — because a demo that sped it up
would be hiding the one thing the section is about. The traces are drawn on a
log scale for g (0.04 g of road noise and 26 g of impact on the same axis) and
linear for speed.

## Rules

- **Everything invented must look invented.** Vehicle, plate, civil ID, contacts,
  coordinates, incidents and officers are all made up, and the page says so in a
  banner on every screen. The only real thing is 112.
- **Never claim an injury assessment**, in the copy or in the data. The system
  reports what it measured.
- **Never imply a link to the Ministry of the Interior exists.** The police view
  carries a note saying the arrangement is legal before it is technical, and has
  not been granted.
- Accessibility: visible focus rings, `aria-hidden` or real labels on canvases,
  `prefers-reduced-motion` respected, and the page readable at 390px with no
  horizontal scroll.
- No network requests beyond the fonts — no analytics, no maps, no tiles, no
  telemetry. `vercel.json` carries a `/najda/` policy that enforces it
  (`connect-src 'none'`) and marks the page `noindex`.
