# Zill (ظلّ) — air-conditioned carts for Souq Al-Mubarakiya

A concept for a small shuttle service inside **Souq Al-Mubarakiya**, Kuwait City: twelve
enclosed, air-conditioned golf carts that carry shoppers from one souq to the next, so the
four hundred metres between the gold souq and the date market stop being the reason an older
shopper, a pregnant woman or a family with a pram turns back at the gate in August.

**This is a design concept, not an operating service.** No such shuttle runs in Al-Mubarakiya.
The map is a schematic of the souq's lanes rather than a survey, and every figure on the page
is a design target sized from published cart, battery and air-conditioning specifications.

## What's in it

One self-contained page, `index.html` — no build step, no dependencies beyond Google Fonts,
and no network requests of its own.

- **A live map.** The souq is modelled as a graph: 30 lane junctions, 48 edges (covered lanes
  and the perimeter streets), 13 shaded stops and a charging hub. Twelve carts drive the
  network continuously, routed by Dijkstra over real lane distances — one map unit is treated
  as 0.42 m, which puts the souq core at about 420 m across.
- **Working dispatch.** Pick a pickup and a destination (from the selects, or by tapping stops
  on the map) and the nearest *free* cart by lane distance — not straight-line distance — is
  sent to collect you. It finishes whatever move it was making, drives to your stop, boards,
  carries you, and hands back a receipt: distance, time in the cabin, cabin temperature against
  the street, fare, and the minutes you did not spend walking it. Tick the ramp box and only the
  two accessible carts are eligible.
- **An hour slider.** A typical August day in Kuwait City drives the whole model: outside
  temperature sets the air-conditioner's electrical draw, which sets the range on one pack,
  and the souq's own footfall curve sets how many of the twelve carts that hour actually needs.
- **The cart.** A cutaway of the vehicle — roof-mounted 12,000 BTU DC unit, insulated roof,
  sealed cabin, 10 kWh LFP pack under the bench, fold-out ramp — beside its specification.
- **A live fleet table.** The same twelve carts: status, nearest stop, cabin temperature,
  state of charge, seats free.

## Running it

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/souq/
```

Or just open `index.html` in a browser.

## Editing

Everything lives in `index.html`:

- **Colours, fonts, spacing** are the CSS custom properties in the `:root` block.
- **The souq itself** is four data structures at the top of the script: `NODE` (junction
  coordinates in the 1000×660 viewBox), `EDGE` (`[from, to, "street" | "lane"]`), `STOPS`
  (each with its node, English and Arabic names, and which side its label sits on) and
  `BLOCKS` (the market blocks drawn between the lanes). Adding a stop is one line in `STOPS`,
  as long as its node exists.
- **The day model** is `TEMP` (24 hourly temperatures) and `FOOT` (24 relative footfall
  values), with `acKw()`, `rangeHours()` and `cartsNeeded()` reading off them.
- **Cart behaviour** is `advance()` (walks a cart along its current leg), `wander()` (what an
  idle cart does), `nearestCart()` (dispatch) and the single `requestAnimationFrame` loop at
  the bottom, which also runs the cabin-temperature and battery models. The demo clock runs
  3× real time, and the battery drains on a compressed scale so a shift is visible in a minute.

## Honesty notes

- The Kuwait heat figures are ordinary summer values; the 53.9 °C at Mitribah in July 2016 is
  a real recorded reading, and it is quoted as a record, not as a normal day.
- 22 °C is a setpoint the fleet is *sized* to hold, not a measurement. The simulated cabins sit
  a degree or so above it while a cart is moving with its doors cycling, which is the point.
- Stop names are the souq's well-known sections. Their positions on the map are arranged for
  legibility, not surveyed from the ground.
