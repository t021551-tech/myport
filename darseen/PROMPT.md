# Build prompt — Darseen

Use this to regenerate or extend the site. It describes the brief, the design
system and the content, so a fresh build lands in the same place.

---

## The brief

Build a one-page website for **Darseen** (دار سين), a Kuwaiti restaurant inside
the Manchester Shopping Centre, Manchester, UK. Single static HTML page with a
separate stylesheet. No JavaScript, no build step, no frameworks.

The restaurant is owned and run by **Sara Shamsah** (سارة شمساه), a Kuwaiti
mother who cooks for the dining room the way she cooks for her own children.
Behind her is a kitchen of cooks from all over the world, among them Luqman and
Mishari, chefs from Bahrain and Qatar. Spices, dried limes (loomi) and rice are
shipped in from Kuwait. There is a dining room — customers can sit and eat in.
The restaurant also sells weekly and monthly meal subscriptions for two
audiences: people training at the gym, and people on a diet.

Audience is split, and the page has to serve both: Kuwaitis and Gulf families in
Manchester who will recognise every dish, and British customers who have never
eaten Kuwaiti food and need the dishes explained without being talked down to.

## Design system

**Palette** — taken from the logo disc, wine-led, committed to a single dark
theme (no light mode):

| token | value | role |
|---|---|---|
| `--ground` | `#1E0B0E` | page ground, near-black wine |
| `--ground-2` | `#2B1114` | raised bands |
| `--disc` | `#5B2328` | the logo maroon |
| `--cream` | `#F4EADB` | body text |
| `--cream-dim` | `#BFA898` | secondary text, a neutral biased warm |
| `--brass` | `#C98F3C` | the single accent: prices, labels, rules |
| `--vimto` | `#7A2F63` | used *only* in the drinks course |

**Type** — three roles, all Google Fonts:
- Display: **Marcellus** — inscriptional serif, brass-plaque feeling. Headings,
  dish names, prices.
- Body: **Karla** — grotesque with some character. Running text, buttons, labels.
- Arabic: **Amiri** — so Arabic dish names are set properly rather than falling
  back to a system face. Every Arabic string carries `dir="rtl" lang="ar"`.

**Ground** — the page sits on **sadu** (السدو), Kuwaiti bedouin weaving, drawn as
an SVG `<pattern>` rather than an image so it stays sharp and weightless. One
repeat contains the real vocabulary: paired warp stripes, a row of alternating
triangles, lozenges with a small diamond at the centre, and a zigzag row. A fixed
radial veil darkens the middle so text reads; the weave shows strongest at the
edges. A second, denser band pattern is used at full strength as a divider where
a hairline rule would otherwise go.

**Layout** — 1080px measure, generous vertical bands separated by hairlines,
single column on narrow screens. Menu rows are a three-column grid: dish name
(with Arabic beneath), description, then price right-aligned in the display face
with tabular figures and the serving size in small caps below it. On mobile the
price moves up beside the name and the description drops underneath.

## Page order

1. **Hero** — logo, "Darseen", then the chef line first: *Cooked by Sara Shamsah
   سارة شمساه — a Kuwaiti mother who cooks for this dining room the way she cooks
   for her own children.* Ingredients line demoted beneath it. Three buttons:
   See the menu / Meal plans / Find us.
2. **Sadu divider band.**
3. **Provenance ribbon** — three facts: shipped from Kuwait; cooked to order; sit
   down and eat.
4. **The kitchen** — Sara's card (name in Arabic and Latin, role), then the story:
   her recipes, the international kitchen behind her, the standard ("a plate goes
   out of this kitchen only if she would put it in front of her children"), and
   the late-night promise.
5. **Menu** — courses in eating order: عيش (rice) → from the oven → mezze and
   salads → حلو (sweet) → drinks.
6. **Meal subscriptions** — three tiers (Lean / Performance / Balanced) plus a
   three-step how-it-works.
7. **Find us** — address, dining in, opening hours with the after-hours note,
   contact.
8. **Sadu divider band**, then footer.

## Menu content

| Dish | Arabic | Price | Serves |
|---|---|---|---|
| Machboos | مجبوس | £12 | 3 |
| Mutabbaq zubaidi | مطبق زبيدي | £20 | 5–6 |
| Musakhan | مسخن | £10 | 2 |
| Bechamel | بشاميل | £10 | 2 |
| Fattoush | فتوش | £7 | — |
| Hummus | حمص | £5 | — |
| Luqaimat | لقيمات | £7 | — |
| Vimto | ﭬيمتو | £4 | — |
| Awar galb | عوار قلب | £4 | — |
| Laban | لبن | £4 | — |

Write dish descriptions the way a cook talks, not a menu template. Name the real
things — loomi, daqoos, dibs, zubaidi, taboon bread, sumac — and say what they
are in passing so a Manchester customer follows without being lectured. No
adjective stacking ("succulent", "authentic", "mouth-watering"). One concrete
detail beats three flattering ones.

## Details

- Hours: Monday–Friday 2pm–10pm, Saturday–Sunday 2pm–8pm.
- After hours: call Sara on +44 7775 962211, whatever the hour, and if she can
  she will cook. Keep the "if she can" — it is a warm promise, not a guarantee
  she can be held to at 4am.
- Contact: +44 7775 962211 · darseen24@gmail.com · @darseenmcr — all live links
  (`tel:`, `mailto:`, Instagram).
- Delivery: any area around Manchester.
- The logo is a circular maroon disc with white calligraphy. Cut it out with a
  transparent background so it sits on the page ground, never in a box.

## Rules

- Everything must be true. Do not invent prices, addresses, macros or
  ingredients — leave a visible marker where a fact is missing rather than
  filling the gap with something plausible.
- Accessibility: visible focus rings, `aria-hidden` on decoration, real alt text,
  `prefers-reduced-motion` respected.
- The page must read at rest — nothing waiting on scroll to appear.
