# Build prompt — Rafeeq (رفيق)

Use this to regenerate or extend the site. It describes the brief, the design
system, the clinical content rules and the demo mechanics, so a fresh build
lands in the same place.

---

## The brief

Build a website for people who are addicted and are afraid to look for help.
One self-contained page, no build step, no frameworks, no dependencies beyond
Google Fonts. It has to do five things:

1. **Take fear seriously as the first design problem.** One ID number and
   nothing else — no name, no phone number, no address, no next-of-kin field.
   The ID exists because a doctor cannot lawfully prescribe a controlled
   medication to an alias and because it stops two prescribers writing the same
   script for the same person; it goes to the prescriber and nowhere else, and
   everywhere else on the service the patient is an alias. One-press
   **Wipe & leave** clears it.
2. **Let the patient say what they are taking** — a wide library of substances,
   multi-select, because most people are honest about one and quiet about the
   second.
3. **Give a real staged plan** for that substance: phases, steps, the withdrawal
   timeline, and the medications a doctor can actually prescribe, named.
4. **Pair a wrist band** and show the live signals, the alert rules in plain
   words, and a log of what has been sent.
5. **Show the doctor's side** — an alias-only queue, sorted worst-first, where
   acknowledging an alert writes back into the patient's log.

## Detection: what the band claims, and how

**The band detects drug use from body signs.** Seven signals — heart rate, HRV,
blood oxygen, respiration, skin temperature, sweat (EDA), and tremor/motion —
sampled continuously against the patient's own seven-day baseline. Each drug
class moves that set of seven in its own direction, and the *combination* is what
identifies the class.

`SIGNATURES` holds one direction vector per class (opioid, stimulant, sedative,
cannabinoid, plus withdrawal, which is the absence of the dose rather than a
class). `detect()` turns the live reading into the same kind of vector — each
signal divided by its baseline spread in `SPREAD` — and compares the two by
angle, scaled by how far the body has actually moved. So a detection depends on
the shape of the whole pattern, not one number crossing a line, and the readout
names the class, the match strength, and the three signals carrying the match
with their live values beside the baseline. Where the matched class is one of the
patient's own chosen substances, the readout names *that substance*.

Two honesty constraints hold in the code, not just the copy: match strength is
capped at **97%**, because a body-signal match is not a chemical assay and must
never print as certainty; and confirming which drug it was is the doctor's call,
which is why a detection routes to a clinician rather than into a verdict. The
landing page shows the full signature table so the mechanism is legible rather
than magic.

## Design system

**Palette** — light-first, because a frightened person should not be met by a
dark surveillance console. Neutrals are biased green toward the accent.

| token | light | dark | role |
|---|---|---|---|
| `--ground` | `#EDF1EE` | `#0E1613` | page ground |
| `--surface` | `#FAFCFA` | `#16211D` | panels, cards, trace frame |
| `--ink` | `#14201C` | `#E5EDE8` | body text |
| `--ink-dim` | `#65756E` | `#8B9C94` | secondary, green-biased grey |
| `--pine` | `#1C6B58` | `#54BCA0` | the single accent |
| `--ochre` | `#9C6412` | `#D9A34B` | warning severity |
| `--brick` | `#9C2F24` | `#E37F6E` | critical severity, opioid detection |
| `--steady` | `#2F7D6A` | `#5DC0A4` | good / clear |
| `--on-accent` | `#F6FBF8` | `#08120F` | text on a pine fill |
| `--link` | `#0F4B3D` | `#8FD8C3` | links, hero emphasis |

Severity colour is separate from the accent and is the only place colour
carries meaning. Every colour is declared in the bare `:root` block first, then
redefined in `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`
and again in `:root[data-theme="dark"]`. **Never** scope a component colour to a
theme selector — that is how filled buttons ended up with dark text on a dark
fill during the first build. Use a token (`--on-accent`, `--link`) instead.

**Type** — four roles, all Google Fonts:
- Display: **Spectral** — a serif with clinical calm, used for headings only.
- Body: **IBM Plex Sans** — institutional without being cold.
- Data: **IBM Plex Mono** with `tabular-nums` — every vital, clock and threshold.
- Arabic: **IBM Plex Sans Arabic**, so `رفيق` and each substance's Arabic name
  are set properly. Every Arabic string carries `dir="rtl" lang="ar"`.

**Layout** — 1080px measure, six views switched in place (`.view[hidden]`), a
sticky identity rail above a sticky scrolling tab strip. Bands separated by
hairlines, single column under 720px. The hero is a live wrist trace on canvas,
not an illustration: it is the most characteristic object in this subject's world.

## Views

1. **The door** — hero + live trace, the four promises, the "a band cannot detect
   drugs" note, and the crisis strip.
2. **What I'm taking** — the substance grid, then five intake questions.
3. **My plan** — generated: phase 0 plus the substance's four phases, medication
   list, withdrawal timeline, and what the band watches for *this* substance.
4. **The band** — trace, six vital tiles with sparklines, pairing, the detection
   readout, the alert rules, the alert log.
5. **Abroad** — the two routes out of the country and what is genuinely online
   with the Ministry of Health (see below).
6. **Doctors** — directory filtered by the chosen substances.
7. **Doctor's view** — panel table, summary tiles, alert queue with acknowledge.

## The Abroad view

Written for the patient whose real obstacle is being recognised in a waiting
room ten minutes from their family's house. It gives two routes and states the
privacy of each honestly, because the privacy difference is the whole decision:

- **Route one — a private clinic abroad, self-funded.** Nobody in Kuwait is
  involved: no ministry file, no committee, no employer, no relative signing
  anything. The cost is money, and the section says so.
- **Route two — MOH-funded treatment abroad (العلاج بالخارج).** Real, and the
  less private of the two. Written as three steps: the **Request Treatment
  Abroad** service on `e.gov.kw` plus appointments and the psychiatric clinic
  request on `eservices.moh.gov.kw` and the MOHKW app (all genuinely online, any
  hour); then the **medical committee** at the competent hospital, in person,
  which decides whether the treatment is available inside Kuwait; then the
  **Department of Treatment Abroad**, submitted in person by the patient or a
  relative with legal capacity, with refusals appealable to the Supreme Medical
  Committee for Treatment Abroad. Treatment Abroad Office: 2481 0931.

**Do not write "all of it online".** The request and the appointments are; the
committee examination is not, the file is a government file, and a relative
attending in your place is a relative who knows. The view says this in a warning
block and tells the reader that if secrecy from family is non-negotiable, route
one is the honest answer. Overselling this to a frightened patient is the one
failure mode that would matter.

Two more pieces of content earn their place there:

- **Six questions before paying anyone abroad**, each with the register to check
  it against: CQC (England), Care Inspectorate (Scotland), JCI for international
  accreditation; doctor-led detox on site; the 3am hospital plan; the total and
  its exclusions; who prescribes in Kuwait afterwards; and whether the clinic
  will write to that doctor.
- **Bringing medication home**, as a critical note. Controlled medicines cannot
  be posted into Kuwait or carried in loose, and the continuation prescriber has
  to be arranged before the flight home — otherwise a good month abroad ends in
  a relapse at exactly the point tolerance has fallen and the old dose can stop
  someone's breathing.

No foreign clinics are named, for the same reason no unverified doctor is: a list
on a page reads as a recommendation, and rehab abroad is easy to sell badly.
Verification is pushed to the country's own register and to MOH's approved-hospital
list.

The view closes on the option people forget: staying in Kuwait and being treated
privately, or free at the government centre, neither of which calls anyone's
family. Distance and privacy are not the same purchase.

## Content rules

- **Clinical safety comes before encouragement.** For alcohol, benzodiazepines,
  pregabalin/gabapentin and Z-drugs, the danger of stopping suddenly is stated
  before any plan step, and the generated plan opens with "This plan does not
  start at home" whenever the substance is in that class and use is not light,
  or the patient reports a previous fit.
- **Name real medications.** Buprenorphine, methadone, naltrexone, acamprosate,
  disulfiram, thiamine, lofexidine, diazepam tapers, varenicline, NRT, naloxone.
  Where nothing is licensed (stimulants, cannabis, ketamine) say so plainly and
  name contingency management and CBT instead of implying a pill exists.
- **An honest report is never punished.** Self-reporting use logs as `info`,
  reaches the doctor as a note, and never resets a phase.
- **Leave a visible marker where a fact is missing** rather than inventing it.
  The Kuwait addiction helpline is a marked `.tbd` placeholder; the six
  clinicians are marked placeholder profiles with unverified licences. Real
  profiles need a licence number, an issuing authority and a telehealth licence
  valid where the patient is.
- **Kuwait numbers only.** The crisis strip carries `112` (ambulance, police,
  fire) and `2462 1770`, the Ministry of Health hotline at the Kuwait Center for
  Mental Health — free, Arabic or English, doctors on the line during the day,
  and the centre where government addiction treatment sits. Both are `tel:`
  links. The strip states plainly that 2462 1770 is the mental-health line
  rather than a dedicated 24-hour addiction line, because that is what it is.
- The strip also carries **the address**, because at 3am a phone number is the
  wrong instrument: Kuwait Center for Mental Health (مركز الكويت للصحة النفسية),
  Sabah Health Region, Block 1, Jamal Abdul Nasser Street, Shuwaikh, Capital
  Governorate. The Arabic name is set in the Arabic face at reading size
  specifically so it can be shown to a driver, the street lines are set in the
  mono face so they can be read out, and a Maps link sits under them.
- **Which door, for what.** The strip separates the two emergencies rather than
  implying one number covers both: wanting to die, hallucinations, or a
  frightening withdrawal → the psychiatric address; an overdose, a seizure, chest
  pain, or someone who cannot be woken → 112 and the nearest general A&E, which
  is faster at those. Getting this the wrong way round costs lives, so it is
  stated in the copy rather than left to the reader.
- The Al-Sabah addiction centre is listed as a place to walk into or be referred
  to, with **no direct number**: the numbers circulating for it disagree with
  each other across sources, and a wrong number in a crisis strip is worse than
  no number.
- Whether the psychiatric emergency room is staffed overnight is not published
  publicly, so that gap wears the `.tbd` marker in the copy itself. Both open
  markers — that, and the addiction centre's direct line — are Ministry of Health
  questions to settle before this site is put in front of a real patient. The
  `.tbd` marker means a missing or unverified *fact*; it is not for an
  instruction like "walk in".

## Demo mechanics

- **One engine** (`band`) drives both traces, the tiles, the sparklines and the
  rule checks from a single `requestAnimationFrame` loop. Vitals ease toward the
  target for the current state (`steady` / `stim` / `opioid` / `withdrawal`) or
  freeze when off-wrist.
- **The demo clock runs 60× real time**, labelled as such, so a rule with a
  20-patient-minute dwell fires in 20 seconds while someone is looking at it.
  Rules count patient-minutes, never frames.
- **The classifier fires first**: a signature match ≥ 60% held for ≥ 3
  patient-minutes sends "Drug use detected from body signs" with the class, the
  match strength and the three contributing signals. A change of class restarts
  the dwell, so a shape passed through in transit between two states cannot
  fire.
- **Four threshold rules** under it, each with a dwell and a one-shot latch that clears when the
  condition clears: band off ≥20 min, band off ≥60 min, HR ≥ baseline +25 with
  low motion ≥10 min, HRV ≤65% of baseline ≥30 min, SpO₂ <92% with respiration
  <10 for 2 min (the only rule that escalates past the doctor), and skin temp
  ≥ baseline +0.8 °C with sweat ≥15 min. Thresholds are relative to the
  patient's own seven-day baseline, never a population average. The two rules
  the classifier replaced (a bare resting-HR threshold and a bare skin-temp
  threshold) were removed rather than left to double-alert alongside it.
- **Real pairing** is Web Bluetooth against the standard Heart Rate service
  (`0x180D` / `0x2A37`). Heart rate becomes real; the other five signals stay
  simulated, and the page says so. It degrades to the demo band wherever Web
  Bluetooth is missing or blocked (including inside an iframe).
- **The PPG waveform** is three Gaussians — systolic peak, dicrotic notch,
  diastolic bump — into a 900-sample ring buffer, prefilled at boot so the first
  painted frame shows a full trace.
- **The ID number** lives in `S.id`, is digits only (8–14), is masked to its
  last four everywhere except the prescribing doctor's own row, and gates
  requesting a doctor — asking for one without it sends the patient back to the
  field with the reason.
- **State** lives in `localStorage` under `rafeeq.v1` and nowhere else. That is
  a privacy decision, not a shortcut: nothing about the patient leaves the
  device, and the privacy pill in the rail reflects it (including failing
  honestly in a private window).

## Rules

- The page must read at rest, with the example patient "Q" loaded so the plan,
  band and console all have content on first paint. Anything belonging to the
  example is marked as an example.
- Accessibility: visible focus rings, `aria-hidden` on decoration, labelled
  canvases, `aria-pressed` on the substance toggles, `prefers-reduced-motion`
  respected, no horizontal scroll at 400px.
- The footer says what this still needs before it touches one real person:
  verified prescribers, a lawful basis for health data per country, a validated
  overdose escalation path with a real emergency service, and clinical sign-off
  on every plan in the library.
