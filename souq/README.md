# Zill (ظلّ) — air-conditioned carts for Souq Al-Mubarakiya

A concept for a small shuttle inside **Souq Al-Mubarakiya**, Kuwait City: twelve enclosed,
air-conditioned golf carts carrying shoppers from one souq to the next, so the four hundred
metres between the gold souq and the date market stop being the reason someone turns back at
the gate in August.

The page is meant to be **looked at** rather than read: a lane you watch a cart come down, a
live plan of the souq with carts working it, **the cart itself as a 3D model you can turn
around and take apart**, and six close-ups. There are no photographs and no image files —
the scenes are SVG built in the page, the cart is geometry built in the page, and the only
thing fetched from anywhere is the webfont.

**It is a concept, not a service.** No such shuttle runs in Al-Mubarakiya. The map is a
schematic of the souq's lanes rather than a survey, and every figure is a design target sized
from published cart, battery and air-conditioning specifications.

## What you see

| | |
|---|---|
| **The lane** | A drawn diorama of a covered souq lane at dusk — shopfronts, striped awnings, strung lanterns, shafts of light through the roof, shoppers — with a cart driving out of the sunlit end towards you, on a loop. |
| **The maps** | **Two places, switched above the map.** The souq is a graph of 30 junctions and 48 lanes under striped awnings, with palms, a crowd that thickens after sunset, 13 shaded stops and 12 carts. **Al-Shaheed Park** is its own graph — a jogging loop of twelve turns with garden paths across it, lawns and trees, the lake, lamp posts instead of awnings, 10 stops and 8 carts, drawn to its own scale (780 m across, against the souq's 420 m) and with its own footfall curve: joggers at dawn, families after sunset. Either way, pick two stops and the nearest free cart by path distance (Dijkstra, not straight line) collects you, carries you and hands back a receipt. Tick the ramp box and only the accessible carts are eligible. |
| **The cart** | A 3D model at 1 unit = 1 metre — 3.6 m long, 1.3 m wide: **six seats, three facing three, and the driver's own seat up front** with its wheel and dash, and **a sadu band (السدو)** down both flanks, across the nose and tail and along the roof fascia — the cabin itself is left plain. Drag to turn it, zoom in, and take it apart to see the roof unit lift off, the roof and glass rise, the pack drop out of the floor and the wheels step aside. Tapping 5 lifts the roof away entirely and looks straight down on the seating. Eight markers sit on the model itself and fade as they go round the back. If WebGL is unavailable the page falls back to the side drawing it replaced. |
| **Close up** | Six drawn panels: the roof unit, the cabin, the pack under the bench, the ramp, the hub at night, the misted shelter. A line of caption each. |
| **Cut in half** | A section through the cart, head-on: heat pressing in from both sides, cold falling from the ceiling vents, the pack under the floor. |
| **The day** | A typical August day in Kuwait City — the outside curve, the 22 °C cabin line, and the souq's own footfall in bars. The hour slider drives the whole model: outside temperature sets the air-conditioner's draw, which sets range on one pack, which sets how many carts that hour needs. |

## Running it

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/souq/
```

Or open `index.html` in a browser.

## How it is built

One self-contained file, no build step, no dependencies beyond Google Fonts. Three scripts at
the bottom of `index.html`:

1. **The engine** — the souq graph (`NODE`, `EDGE`, `STOPS`, `BLOCKS`), Dijkstra routing,
   dispatch, the cabin-temperature and battery models, the chart and the fleet table, all
   driven by one `requestAnimationFrame` loop. The demo clock runs 3× real time and the pack
   drains on a compressed scale so a shift is visible in a minute.
2. **The artwork** — `buildLane()` draws the diorama (a four-layer perspective built from one
   depth scale `S`), `drawCartSide()` and `drawCartFront()` draw the cart once so the same
   vehicle appears in the lane, in the annotated view and at the hub, and `buildCartArt()`
   wires the numbered markers to the caption.
3. **The model** — `three.min.js` (r128, MIT, vendored so the page fetches nothing) plus one
   script that builds the cart from boxes and cylinders in metres, groups it into sub-assemblies
   so it can come apart, and runs its own small orbit camera. Its sadu is generated, not
   photographed: `saduCanvas()` draws a band row by row — solid stripes, rows of triangles,
   a row of hooked diamonds, zigzags — over a black ground in madder red, undyed white, camel
   and brown, then lays warp and weft shadows over the top, and `saduTexture()` tiles it along
   whichever panel it is wrapped around. Exterior panels only. Markers are HTML buttons projected
   from 3D anchors each frame, hidden by a dot product against each anchor's outward normal
   rather than a raycast.
4. **The rest of the pictures** — the section drawing, the six close-up panels, the fact tiles,
   and the map's scenery (awnings as dashed strokes along each lane, palms, crowd dots,
   lantern glow), which listens on `window.onZillHour` so the souq fills and lights up as you
   drag through the day.

Colours, type and spacing are the CSS custom properties in `:root`. Adding a stop is one line
in `STOPS`; adding a close-up is one object in `SHOTS`.

## Honesty notes

- The heat figures are ordinary Kuwaiti summer values. The 53.9 °C at Mitribah in July 2016 is
  a real recorded reading, quoted as a record rather than as a normal day.
- 22 °C is the setpoint the fleet is *sized* to hold, not a measurement — the simulated cabins
  sit a degree above it while a cart is moving with its doors cycling, which is the point.
- Stop names are the souq's well-known sections; their positions are arranged for legibility,
  not surveyed from the ground.
- Sadu is a living Kuwaiti craft, on UNESCO's intangible heritage list since 2020. The patterns
  here are drawn in its vocabulary — triangles, hooked diamonds, zigzags, its four colours —
  not copied from any particular weaver's work.
