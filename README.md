# toolchanger-data

a resource for 3D printer toolchanger data

## Toolhead taxonomy

`toolchange fig.svg` (by **baconmilkshake**) draws eight toolchanger types as
block diagrams. Reading the SVG structurally shows they are not eight drawings —
they are **one drawing, eight times**:

- identical 9-block template, same coordinates in every panel (within ±10 units)
- identical 11 connectors, same routes — bar two types that wire the hot end
  straight to the mainboard over the top of the diagram
- the only thing that otherwise differs is which blocks the red dashed boundary
  encloses

So the whole family compresses to a template plus one set of block names per
type. Everything else is derivable.

**Three classes, eight types.** Conventional toolchangers, filament path changers
and nozzle changers are the classes; full conventional, gear swapping and the rest
are the types inside them.

## Running the site

The site is a Material for MkDocs project. Zensical reads the same `mkdocs.yml`,
so either generator works.

```sh
# 1. generate the diagrams and the page (needs Node, no npm install)
node tools/build-docs.mjs

# 2a. serve with Zensical
pip install zensical
zensical serve

# 2b. or serve with Material for MkDocs
pip install mkdocs-material
mkdocs serve
```

Both serve on <http://127.0.0.1:8000>. `mkdocs build` / `zensical build` write a
static site to `site/`.

Step 1 is only needed after editing the taxonomy, the prose or the CSV — the generated
diagrams and page are committed, so a fresh clone can go straight to step 2.

## Writing the descriptions

One markdown file per type, under `content/types/<id>.md`. Plain markdown, no
format to fight — headings, lists, links, images all work. They live outside
`docs/` so MkDocs never builds them as pages of their own.

**The first paragraph doubles as the one-line summary** shown in the plate at the
top of the page, so keep it to a sentence or two. Everything after it appears
only in that type's section. Write pros and cons however you like — a pair of
bold headings with bullets underneath reads well.

These files are never regenerated. `docs/index.md` is, so don't edit that.

## The systems spreadsheet

`data/systems.csv` — one row per shipping system. Two columns are fixed:

| column | meaning |
|---|---|
| `name` | shown tinted by origin, matching the legend |
| `type` | which type the system belongs to; the join key, never shown as a column |

Everything after those is yours. Add, rename or reorder columns freely — the
header row becomes the table header, and **a column that is empty for every row
is left out of the page**, so the table fills in as the data does. A column named
`url` renders as a link.

The same rows appear three times: as the coloured list in the plate cell, as a
table inside that type's section, and in full under *All systems*. Names are
tinted by `origin` and set semibold, since the blue and the green are hard to
separate in thin type at that size.

Re-run `node tools/build-docs.mjs` after editing either the prose or the CSV.

The sidebar label comes from `nav:` in `mkdocs.yml`, not from the page heading —
change it there.

## Layout

| Path | What it is |
|---|---|
| [data/toolhead-taxonomy.json](data/toolhead-taxonomy.json) | The template (blocks, connectors, colors), the three classes and the eight types |
| [data/systems.csv](data/systems.csv) | One row per system, free-form columns — hand-edited |
| [content/types/](content/types/) | Prose for each type, plain markdown — hand-written |
| [web/toolhead-diagram.js](web/toolhead-diagram.js) | Dependency-free SVG renderer + analysis. Browser or Node. |
| [tools/build-docs.mjs](tools/build-docs.mjs) | Writes `docs/assets/diagrams/*.svg` and `docs/index.md` |
| [docs/](docs/) | The site. `index.md` is generated — edit `content/types/`, the CSV or the JSON instead. |

## Using the renderer directly

```js
import { renderType, analyze, renderDiagram } from './web/toolhead-diagram.js';
import data from './data/toolhead-taxonomy.json' with { type: 'json' };

// Any type from the figure
svgString = renderType(data, 'gear_swapping');

// Or an arbitrary cut
svgString = renderDiagram(data, { swaps: ['heatsink', 'nozzle'], labels: false });

analyze(data, { swaps: ['heatsink', 'nozzle'] });
// { perToolBlocks: 2, interfaceCount: 4,
//   crossingsByKind: { power: 1, filament: 1, air: 2 }, ... }
```

`renderDiagram` options: `swaps`, `partial`, `include` (optional blocks such as
`ams`), `edgeOverrides`, `labels`, `legend`, `boundary`, `crossings`, `dim`,
`viewBox`, `strokeScale`, `background`, `pad`.

`legend: true` draws the legend inside the SVG, in the empty space under the
mainboard, so the key scales as one image and needs no matching HTML.

`strokeScale` matters when a diagram is displayed large. The source figure uses one
absolute line weight throughout, which reads correctly on the small panels but heavy
on a big one — the key diagram is drawn at `0.42`.

Colors are set as SVG presentation attributes, so page CSS can override them:
`[data-group="hot"] rect { fill: … }` retints the whole diagram. The generated
files carry an opaque white plate so they stay readable on a dark docs theme.

## Derived, not stored

Two things fall out of the swap set rather than being drawn by hand:

**The dashed boundary.** `traceOutline()` unions the padded block rectangles and
traces the outline. Padding alone leaves disconnected islands, so blocks joined
by a connector that stays inside the tool are bridged across whichever axis they
already share. That reproduces both the plain bounding boxes and the notched
L-shapes of the original — for example gear swapping comes out as an 8-corner L.

**What breaks on every toolchange.** Any connector with exactly one end inside
the boundary has to be broken and remade at every change. Not surfaced on the
page, but `analyze()` returns it:

| Type | Parts per tool | Links broken |
|---|---|---|
| Full conventional | 7 | 1 |
| Partial conventional | 5 | 6 |
| Gear swapping | 4 | 4 |
| Hotend fan swapping | 3 | 4 |
| Inductive / pogo | 2 | 4 |
| Wired | 2 | 4 |
| AMS-assisted toolchanger | 2 | 4 |
| AMS-assisted nozzle changer | 1 | 2 |

## Alternate wiring

Hotend fan swapping and wired both run the heater and thermistor from the
**mainboard** directly to the heatsink, over the top of the diagram, instead of
through the toolhead board — the toolhead board would otherwise be wiring a part
that drives away. A type declares that with `edgeOverrides`:

```json
{ "replaces": "toolhead_board>heatsink",
  "from": "mainboard", "to": "heatsink", "kind": "power",
  "label": "Heater + thermistor, direct to mainboard",
  "route": [[91,0],[91,-100],[880,-100],[880,330],[807,330]] }
```

Hotend fan swapping carries a second override for the hotend fan, which travels
with the tool for that type and so is also fed from the mainboard. Its run
crosses the motor-drive wire; that crossing is in the routing, not a mistake.

Routes are in template units and the frame grows to fit them, so those two
diagrams are taller than the rest — as they are in the source figure.

## Three things to verify

- **Heater descent path.** The source figure drops the mainboard run onto the
  *top* of the heatsink, which it can do because it draws the gears shifted left
  in those two panels. The shared template has gears directly above the heatsink,
  so the run instead comes down to the right of everything and enters the
  heatsink's right edge. Same circuit, different path around the gears.
- **Partial conventional (U1).** In the source figure the dashed boundary cuts
  *through* the toolhead board instead of around it. Encoded as `partial`, and
  rendered as a bisected block. Worth checking against the real machine.
- **Inductive/pogo vs. wired.** Identical swap sets. They differ in how the
  heater circuit crosses the joint, which is a second axis the block diagram
  does not carry. Recorded as `toolInterface`.
