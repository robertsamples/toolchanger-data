# toolchanger-data

A reference site for 3D printer toolchanger designs. Eight types in three
classes, each shown as a block diagram of the toolhead with a dashed outline
around the part that travels with the tool.

## Build and serve

Needs Node and Python.

```sh
node tools/build-docs.mjs        # regenerate diagrams and snippets
pip install -r requirements.txt
mkdocs serve                     # http://127.0.0.1:8000
```

Zensical reads the same `mkdocs.yml`: `pip install zensical` then
`zensical serve`.

The first step only matters after editing `data/`. Its output is committed, so a
fresh clone can go straight to `mkdocs serve`.

## Editing

| What | Where |
|---|---|
| Page text, type descriptions | `docs/index.md` |
| Systems and their stats | `data/systems.csv` |
| Which blocks a type swaps | `data/toolhead-taxonomy.json` |
| Plate and table layout | `tools/build-docs.mjs` |

`docs/index.md` is an ordinary page — edit it directly. The `--8<--` lines pull
in generated fragments from `snippets/`.

`data/systems.csv` needs a `name` and a `type` (matching an id in the taxonomy).
Every other column is yours; add or rename them freely. Columns that are empty
for every row are left out of the tables.

The first paragraph of a type's section in `docs/index.md` is reused as its
one-line summary in the plate at the top of the page.

Re-run `node tools/build-docs.mjs` after changing the CSV or the taxonomy. If
`mkdocs serve` is running it reloads on its own once the script finishes.

## Generated files

Don't edit these; they are rebuilt from `data/`.

- `docs/assets/diagrams/*.svg`
- `snippets/*`

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every
push to `main`. Set *Settings → Pages → Source* to *GitHub Actions*.

For a custom domain, point a CNAME at `<user>.github.io`, set the domain under
*Settings → Pages*, add it to `docs/CNAME`, and set `site_url` in `mkdocs.yml`.

`vercel.json` is there as an alternative. It has not been tested.

## Diagram renderer

`web/toolhead-diagram.js` draws the diagrams from the taxonomy. No dependencies,
runs in Node or a browser.

```js
import { renderType, analyze } from './web/toolhead-diagram.js';

renderType(data, 'gear_swapping');            // -> SVG string
analyze(data, { swaps: ['heatsink', 'nozzle'] });
// { perToolBlocks: 2, interfaceCount: 4, crossingsByKind: {...} }
```

The dashed tool outline isn't stored anywhere — it's traced from the union of
the blocks a type swaps, which is how the L-shaped and notched outlines come out
right.

`analyze()` also counts the connections crossing that outline, i.e. what has to
be broken and remade at every toolchange. The site doesn't show it, but it's the
interesting number: full conventional carries 7 parts per tool and breaks 1
link, an AMS nozzle changer carries 1 and breaks 2, everything in between
breaks 4.

## Known gaps

- Partial conventional (U1): the source figure draws the boundary through the
  toolhead board rather than around it. Recorded as a split block. Worth
  checking against the machine.
- Inductive/pogo and wired swap the same blocks. They differ in how the heater
  circuit crosses the joint, which the block diagram doesn't capture.
