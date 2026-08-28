/**
 * toolhead-diagram.js — render a toolchanger block diagram from data.
 *
 * The source figure (toolchange fig.svg, by baconmilkshake) draws eight
 * toolchanger types. All eight use the identical 9-block template and the
 * identical 11 connectors; the only thing that changes between them is which
 * blocks the red dashed "tool" boundary encloses.
 *
 * So the whole family collapses to: one template + one set of block ids.
 * Everything else — the boundary outline, which connections get broken at a
 * toolchange, what stays on the machine — is derived here.
 *
 * No dependencies. Works in a browser or in Node (string output).
 *
 *   import { renderDiagram, analyze, traceOutline } from './toolhead-diagram.js'
 *   el.innerHTML = renderDiagram(data, { swaps: ['heatsink', 'nozzle'] })
 */

/* ------------------------------------------------------------------ *
 * Outline tracing
 *
 * Union-of-rectangles outline. Given the blocks that travel with the tool,
 * this produces the dashed boundary — including the L-shaped and notched
 * outlines in the original figure, which fall out for free rather than
 * having to be drawn by hand.
 * ------------------------------------------------------------------ */

const EPS = 1e-6;

/**
 * @param {{x:number,y:number,w:number,h:number}[]} rects
 * @param {number} pad  outset applied to every rect before unioning
 * @returns {number[][][]} closed loops of [x, y] points
 */
export function traceOutline(rects, pad = 26) {
  if (!rects.length) return [];

  const boxes = rects.map((r) => ({
    x0: r.x - pad,
    y0: r.y - pad,
    x1: r.x + r.w + pad,
    y1: r.y + r.h + pad,
  }));

  const uniq = (vals) => {
    const out = [];
    for (const v of [...vals].sort((a, b) => a - b)) {
      if (!out.length || Math.abs(v - out[out.length - 1]) > EPS) out.push(v);
    }
    return out;
  };
  const xs = uniq(boxes.flatMap((b) => [b.x0, b.x1]));
  const ys = uniq(boxes.flatMap((b) => [b.y0, b.y1]));

  const nx = xs.length - 1;
  const ny = ys.length - 1;
  const covered = (i, j) => {
    if (i < 0 || j < 0 || i >= nx || j >= ny) return false;
    const cx = (xs[i] + xs[i + 1]) / 2;
    const cy = (ys[j] + ys[j + 1]) / 2;
    return boxes.some((b) => cx > b.x0 && cx < b.x1 && cy > b.y0 && cy < b.y1);
  };

  // Emit each boundary cell-edge clockwise (screen coords, y down) so that
  // segments chain head-to-tail into closed loops.
  const segs = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      if (!covered(i, j)) continue;
      const [x0, x1, y0, y1] = [xs[i], xs[i + 1], ys[j], ys[j + 1]];
      if (!covered(i, j - 1)) segs.push([[x0, y0], [x1, y0]]);
      if (!covered(i + 1, j)) segs.push([[x1, y0], [x1, y1]]);
      if (!covered(i, j + 1)) segs.push([[x1, y1], [x0, y1]]);
      if (!covered(i - 1, j)) segs.push([[x0, y1], [x0, y0]]);
    }
  }

  const key = (p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
  const from = new Map();
  for (const s of segs) {
    const k = key(s[0]);
    if (!from.has(k)) from.set(k, []);
    from.get(k).push(s);
  }

  const loops = [];
  const used = new Set();
  for (const seed of segs) {
    if (used.has(seed)) continue;
    const pts = [seed[0]];
    let cur = seed;
    while (cur && !used.has(cur)) {
      used.add(cur);
      pts.push(cur[1]);
      const next = (from.get(key(cur[1])) || []).find((s) => !used.has(s));
      cur = next;
    }
    if (pts.length > 2) loops.push(simplify(pts));
  }

  // Bridging can leave a pocket in the middle of the region. The tracer emits
  // it as a loop wound the other way, which would draw a stray dashed rectangle
  // inside the tool. Keep only the outer perimeters.
  const outward = Math.sign(signedArea(loops.reduce((a, b) => (Math.abs(signedArea(b)) > Math.abs(signedArea(a)) ? b : a))));
  return loops.filter((l) => Math.sign(signedArea(l)) === outward);
}

/** Shoelace. Sign tells an outer boundary from a hole. */
function signedArea(loop) {
  let a = 0;
  for (let i = 0; i < loop.length; i++) {
    const p = loop[i], q = loop[(i + 1) % loop.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

/** Drop the interior point of any three collinear points. */
function simplify(pts) {
  const p = pts.slice();
  if (p.length > 1 && key2(p[0]) === key2(p[p.length - 1])) p.pop();
  const out = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[(i - 1 + p.length) % p.length];
    const b = p[i];
    const c = p[(i + 1) % p.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) > EPS) out.push(b);
  }
  return out.length ? out : p;
}
const key2 = (p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`;

export function outlinePath(loops) {
  return loops
    .map((loop) => `M${loop.map((p) => `${round(p[0])} ${round(p[1])}`).join('L')}Z`)
    .join(' ');
}

const round = (n) => Math.round(n * 100) / 100;

/**
 * Build the rectangles whose union is the tool boundary.
 *
 * Padding each block alone leaves the boundary in disconnected islands, because
 * the gaps between blocks are wider than any sane pad. The original figure
 * closes those gaps by following the connections, so we do the same: for every
 * connector with both ends inside the tool, add a bridge spanning the two
 * blocks across whichever axis they already share. That reproduces the
 * bounding-box outlines and the notched L-shapes alike.
 */
export function toolRegionRects(data, opts = {}) {
  const { swaps = [], partial = [], include = [], swapsEdges = [], partialAt = {}, pad = 40 } = opts;
  const inTool = new Set([...swaps, ...partial]);
  const shown = new Set(
    data.template.blocks
      .filter((b) => !b.optional || include.includes(b.id))
      .map((b) => b.id)
  );
  const partSet = new Set(partial);

  const box = {};
  const rects = [];
  for (const b of data.template.blocks) {
    if (!inTool.has(b.id) || !shown.has(b.id)) continue;
    // A bisected block contributes only its travelling side. The cut defaults
    // to the middle, but a type can place it — between two connectors, say, so
    // the boundary falls on the correct side of each.
    const cut = partSet.has(b.id) ? (partialAt[b.id] ?? b.x + b.w / 2) : b.x;
    const x = cut;
    const w = partSet.has(b.id) ? b.x + b.w - cut : b.w;
    const r = { x0: x - pad, y0: b.y - pad, x1: x + w + pad, y1: b.y + b.h + pad };
    box[b.id] = r;
    rects.push(r);
  }

  const blockById = Object.fromEntries(data.template.blocks.map((b) => [b.id, b]));

  const span = (a0, a1, b0, b1) => {
    const lo = Math.max(a0, b0);
    const hi = Math.min(a1, b1);
    return hi - lo > EPS ? [lo, hi] : null;
  };

  // A sleeve around the wire itself. Thin enough not to swallow a neighbouring
  // block, wide enough that the dashed outline clears the stroke.
  //
  // capFirst/capLast stop the sleeve square at the end of the run instead of
  // overshooting it. The filament inlet uses that: without it the boundary
  // sprouts a small tab above the line's free end.
  const sleeve = (route, hw, capFirst = false, capLast = false) => {
    for (let i = 0; i < route.length - 1; i++) {
      const [p, q] = [route[i], route[i + 1]];
      const r = {
        x0: Math.min(p[0], q[0]) - hw,
        x1: Math.max(p[0], q[0]) + hw,
        y0: Math.min(p[1], q[1]) - hw,
        y1: Math.max(p[1], q[1]) + hw,
      };
      const flat = (end, at) => {
        if (Math.abs(p[0] - q[0]) < EPS) {
          if (at[1] < (at === p ? q[1] : p[1])) r.y0 = at[1]; else r.y1 = at[1];
        } else if (at[0] < (at === p ? q[0] : p[0])) r.x0 = at[0]; else r.x1 = at[0];
      };
      if (i === 0 && capFirst) flat('first', p);
      if (i === route.length - 2 && capLast) flat('last', q);
      rects.push(r);
    }
  };

  // Rows are found transitively: toolhead board -> motor -> gears is one run,
  // so the band spans all three rather than stepping down at each join.
  const parent = {};
  const find = (x) => (parent[x] === undefined || parent[x] === x ? (parent[x] = x) : (parent[x] = find(parent[x])));
  const union = (a, b) => { parent[find(a)] = find(b); };

  for (const e of effectiveEdges(data, opts.edgeOverrides)) {
    const a = box[e.from];
    const b = box[e.to];
    if (!a || !b) continue;

    // Always enclose the connector. The axis bridge below covers the gap
    // between the two blocks, but a route that dog-legs outside that band —
    // the part cooling duct running under everything to the nozzle — would
    // otherwise poke through the outline.
    sleeve(e.route, pad * 0.4);

    const y = span(a.y0, a.y1, b.y0, b.y1);
    if (y) {
      // Blocks that line up in a row are merged below into one straight band,
      // so the boundary runs across the row instead of stepping around each
      // block. Blocks that merely clip each other keep the tighter bridge.
      const shorter = Math.min(a.y1 - a.y0, b.y1 - b.y0);
      if (y[1] - y[0] > shorter * 0.5) { union(e.from, e.to); continue; }
      rects.push({ x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: y[0], y1: y[1] });
      continue;
    }
    const x = span(a.x0, a.x1, b.x0, b.x1);
    if (x) {
      rects.push({ x0: x[0], x1: x[1], y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1) });
      continue;
    }
    // No shared axis and no bridge — the sleeve above is the whole connection.
  }

  // One squared-off band per row.
  const rows = {};
  for (const id of Object.keys(box)) (rows[find(id)] ||= []).push(box[id]);
  for (const group of Object.values(rows)) {
    if (group.length < 2) continue;
    rects.push({
      x0: Math.min(...group.map((r) => r.x0)),
      x1: Math.max(...group.map((r) => r.x1)),
      y0: Math.min(...group.map((r) => r.y0)),
      y1: Math.max(...group.map((r) => r.y1)),
    });
  }

  // Connectors the type claims outright. This is how a type takes the filament
  // path without taking the parts it runs through: the boundary becomes a
  // narrow channel following the line, no wider than the line needs.
  const claimed = new Set(swapsEdges);
  const hw = pad * 0.45;

  for (const e of effectiveEdges(data, opts.edgeOverrides)) {
    if (!claimed.has(`${e.from}>${e.to}`)) continue;
    // a virtual endpoint is the open end of the run — square the sleeve off there
    sleeve(e.route, hw, !!blockById[e.from]?.virtual, !!blockById[e.to]?.virtual);

    // A claimed route stops at the edge of whatever block it runs into. Where
    // that block stays on the machine, carry the channel straight through it,
    // so the claimed path is continuous rather than a string of islands.
    for (const [id, seg] of [[e.from, e.route.slice(0, 2)], [e.to, e.route.slice(-2)]]) {
      if (inTool.has(id)) continue;
      const b = blockById[id];
      if (!b || !shown.has(b.id)) continue;
      const [p, q] = seg;
      if (Math.abs(p[0] - q[0]) < EPS) {
        rects.push({ x0: p[0] - hw, x1: p[0] + hw, y0: b.y, y1: b.y + b.h });
      } else {
        rects.push({ x0: b.x, x1: b.x + b.w, y0: p[1] - hw, y1: p[1] + hw });
      }
    }
  }

  return rects.map((r) => ({ x: r.x0, y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0 }));
}

/* ------------------------------------------------------------------ *
 * Edges
 * ------------------------------------------------------------------ */

/**
 * Two types in the source figure wire the hot end straight back to the
 * mainboard instead of through the toolhead board, routed over the top of the
 * diagram. A type can therefore replace individual connectors:
 *
 *   { "replaces": "toolhead_board>heatsink",
 *     "from": "mainboard", "to": "heatsink", "kind": "power",
 *     "label": "...", "route": [[x,y], ...] }
 */
export function effectiveEdges(data, overrides = []) {
  const key = (e) => `${e.from}>${e.to}`;
  const byKey = new Map(data.template.edges.map((e) => [key(e), e]));
  for (const o of overrides) {
    const { replaces, ...edge } = o;
    if (replaces) byKey.delete(replaces);
    byKey.set(key(edge), edge);
  }
  return [...byKey.values()];
}

/* ------------------------------------------------------------------ *
 * Analysis
 * ------------------------------------------------------------------ */

/**
 * Derive the comparison numbers from a swap set: what rides on every tool,
 * what the machine keeps, and which connections have to be broken and remade
 * at every single toolchange. That last set is the real engineering cost of
 * a given separation plane.
 */
export function analyze(data, opts = {}) {
  const swaps = new Set(opts.swaps || []);
  const partial = new Set(opts.partial || []);
  const present = new Set(
    data.template.blocks
      .filter((b) => !b.optional || (opts.include || []).includes(b.id))
      .map((b) => b.id)
  );

  const blocks = data.template.blocks.filter((b) => present.has(b.id));
  const onTool = blocks.filter((b) => swaps.has(b.id));
  const onMachine = blocks.filter((b) => !swaps.has(b.id) && !partial.has(b.id));

  const edges = effectiveEdges(data, opts.edgeOverrides).filter(
    (e) => present.has(e.from) && present.has(e.to)
  );
  const side = (id) => (swaps.has(id) ? 'tool' : partial.has(id) ? 'split' : 'machine');
  const crossings = edges.filter((e) => side(e.from) !== side(e.to));

  const byKind = {};
  for (const e of crossings) byKind[e.kind] = (byKind[e.kind] || 0) + 1;

  return {
    onTool,
    onMachine,
    partial: blocks.filter((b) => partial.has(b.id)),
    crossings,
    crossingsByKind: byKind,
    /** Connections broken and remade on every toolchange. */
    interfaceCount: crossings.length,
    /** Blocks duplicated per tool — proxy for per-tool cost and moving mass. */
    perToolBlocks: onTool.length,
  };
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * Frame just the blocks actually drawn, leaving room for the boundary outline.
 * `template.viewBox` in the data file is the full extent including the optional
 * AMS block; using it unconditionally leaves a dead band above every diagram
 * that has no AMS.
 */
export function fitViewBox(boxes, margin = 48, points = []) {
  const xs = boxes.flatMap((b) => [b.x, b.x + b.w]).concat(points.map((p) => p[0]));
  const ys = boxes.flatMap((b) => [b.y, b.y + b.h]).concat(points.map((p) => p[1]));
  const x0 = Math.min(...xs) - margin;
  const y0 = Math.min(...ys) - margin;
  const x1 = Math.max(...xs) + margin;
  const y1 = Math.max(...ys) + margin;
  return [x0, y0, x1 - x0, y1 - y0];
}

/**
 * @param {object} data   parsed data/toolhead-taxonomy.json
 * @param {object} opts
 *   swaps      {string[]} block ids that travel with the tool
 *   partial    {string[]} block ids the boundary bisects
 *   include    {string[]} optional block ids to show (e.g. ['ams'])
 *   labels     {boolean}  draw block labels (default true)
 *   boundary   {boolean}  draw the dashed tool outline (default true)
 *   crossings  {boolean}  emphasise connections broken at a toolchange
 *   dim        {boolean}  fade blocks that stay on the machine
 *   scale      {number}   font scale multiplier
 *   interactive{boolean}  add data-block / data-edge attrs and hover class hooks
 */
export function renderDiagram(data, opts = {}) {
  const {
    swaps = [],
    partial = [],
    include = [],
    swapsEdges = [],
    partialAt = {},
    labels = true,
    boundary = true,
    crossings = false,
    dim = false,
    scale = 1,
    strokeScale = 1,
    background = null,
    edgeOverrides = [],
    legend = false,
    interactive = false,
    idPrefix = 'td',
  } = opts;

  const t = data.tokens;
  const swapSet = new Set(swaps);
  const partSet = new Set(partial);
  const shown = data.template.blocks.filter(
    (b) => !b.optional || include.includes(b.id)
  );
  const shownIds = new Set(shown.map((b) => b.id));
  const edges = effectiveEdges(data, edgeOverrides)
    .filter((e) => shownIds.has(e.from) && shownIds.has(e.to));
  const info = analyze(data, { swaps, partial, include, edgeOverrides });
  const crossKeys = new Set(info.crossings.map((e) => `${e.from}>${e.to}`));

  const legendBox = legend ? legendRect(shown) : null;

  // The boundary is padded 40 out from the blocks, so framing on the blocks
  // alone leaves it all but touching the edge. Trace it first and frame on it.
  const loops =
    boundary && (swaps.length || partial.length)
      ? traceOutline(
          toolRegionRects(data, { swaps, partial, include, swapsEdges, partialAt, edgeOverrides, pad: opts.pad ?? 40 }),
          0
        )
      : [];

  const vb =
    opts.viewBox ||
    fitViewBox(
      legendBox ? [...shown, legendBox] : shown,
      48,
      edges.flatMap((e) => e.route).concat(loops.flat())
    );
  const out = [];

  out.push(
    `<svg class="td-diagram" viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg" ` +
      `preserveAspectRatio="xMidYMid meet" role="img">`
  );

  // An opaque plate keeps the pastel fills readable wherever the SVG is placed,
  // including on a dark docs theme.
  if (background) {
    out.push(
      `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${background}"/>`
    );
  }

  // Connectors first, so blocks sit on top of the line ends.
  for (const e of edges) {
    const d = `M${e.route.map((p) => `${p[0]} ${p[1]}`).join('L')}`;
    const isCross = crossings && crossKeys.has(`${e.from}>${e.to}`);
    const attrs = [
      `d="${d}"`,
      `fill="none"`,
      `stroke="${isCross ? t.boundary : t.connector}"`,
      `stroke-width="${round(t.connectorWidth * strokeScale * (isCross ? 1.45 : 1))}"`,
      `stroke-linecap="square"`,
      `stroke-linejoin="miter"`,
      isCross ? `stroke-dasharray="${round(t.connectorWidth * strokeScale * 2)} ${round(t.connectorWidth * strokeScale * 1.6)}"` : '',
      `class="td-edge${isCross ? ' is-cut' : ''}"`,
      `data-edge="${esc(e.from)}~${esc(e.to)}"`,
      `data-kind="${esc(e.kind)}"`,
    ].filter(Boolean);
    out.push(`<path ${attrs.join(' ')}><title>${esc(e.label)}</title></path>`);
  }

  // Blocks.
  for (const b of shown) {
    if (b.virtual) continue;   // an endpoint for a connector, not a real part
    const g = t.groups[b.group];
    const onTool = swapSet.has(b.id);
    const isPartial = partSet.has(b.id);
    const faded = dim && !onTool && !isPartial;
    const clipId = `${idPrefix}-clip-${b.id}`;

    out.push(
      `<g class="td-block${onTool ? ' is-tool' : ''}${isPartial ? ' is-partial' : ''}"` +
        ` data-block="${esc(b.id)}" data-group="${esc(b.group)}"` +
        (faded ? ' opacity="0.4"' : '') +
        '>'
    );
    out.push(`<title>${esc(b.label)}</title>`);

    if (isPartial) {
      // Boundary bisects this block: fill the travelling half solid, the rest hatched.
      out.push(
        `<defs><clipPath id="${clipId}">` +
          `<rect x="${b.x + b.w / 2}" y="${b.y}" width="${b.w / 2}" height="${b.h}"/>` +
          `</clipPath></defs>`
      );
    }
    out.push(
      `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" ` +
        `fill="${g.fill}" stroke="${t.stroke}" stroke-width="${round(t.strokeWidth * strokeScale)}"/>`
    );

    if (labels) {
      const { fs, lines, lineHeight } = labelLayout(b.label, b.w, b.h, 30 * scale);
      const y0 = b.y + b.h / 2 - ((lines.length - 1) * lineHeight) / 2 + fs * 0.34;
      lines.forEach((line, i) => {
        out.push(
          `<text x="${b.x + b.w / 2}" y="${y0 + i * lineHeight}" text-anchor="middle" ` +
            `font-size="${round(fs)}" font-family="system-ui, -apple-system, Segoe UI, sans-serif" ` +
            `fill="${t.stroke}">${esc(line)}</text>`
        );
      });
    }
    out.push('</g>');
  }

  // Tool boundary, derived from the swap set.
  if (loops.length) {
    out.push(
      `<path class="td-boundary" d="${outlinePath(loops)}" fill="none" ` +
        `stroke="${t.boundary}" stroke-width="${round(t.connectorWidth * strokeScale)}" ` +
        `stroke-dasharray="${t.boundaryDash.split(' ').map((n) => round(+n * strokeScale)).join(' ')}" stroke-linejoin="miter"/>`
    );
  }

  if (legendBox) out.push(renderLegend(data, legendBox, strokeScale));

  out.push('</svg>');
  return out.join('');
}

/* ------------------------------------------------------------------ *
 * Legend
 *
 * Drawn into the SVG rather than beside it, so the key scales as one image
 * and needs no matching HTML. It sits in the empty space under the mainboard,
 * where the source figure puts it.
 * ------------------------------------------------------------------ */

const LEGEND = { w: 232, fs: 24, line: 28, pad: 14, gap: 18 };

function legendRect(blocks) {
  const main = blocks.find((b) => b.id === 'mainboard') || blocks[0];
  const rows = 1 + 1 + 2 + 2 + 2;   // title, Tool, then two lines per origin
  return {
    x: main.x,
    y: main.y + main.h + 26,
    w: LEGEND.w,
    h: LEGEND.pad * 2 + LEGEND.line * rows + LEGEND.gap * 4,
  };
}

function renderLegend(data, box, strokeScale = 1) {
  const { fs, line, pad, gap } = LEGEND;
  const t = data.tokens;
  const out = [
    `<g class="td-legend">`,
    // Opaque: the labels are colour-coded and those colours only work on a
    // light ground, so the legend carries its own.
    `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#FFFFFF" ` +
      `stroke="${t.stroke}" stroke-width="${round(t.strokeWidth * strokeScale)}"/>`,
  ];
  const text = (x, y, str, fill, weight) =>
    `<text x="${round(x)}" y="${round(y)}" font-size="${fs}" ` +
      `font-family="system-ui, -apple-system, Segoe UI, sans-serif"` +
      (weight ? ` font-weight="${weight}"` : '') +
      ` fill="${fill}">${esc(str)}</text>`;

  let y = box.y + pad;                       // top of the next row
  out.push(text(box.x + pad, y + fs, 'Legend', t.stroke, 'bold'));
  y += line + gap;

  // the tool boundary, shown with the same dashed stroke the diagrams use
  const sw = { x: box.x + pad + 2, y: y + 3, w: 46, h: fs - 2 };
  out.push(
    `<rect x="${sw.x}" y="${round(sw.y)}" width="${sw.w}" height="${sw.h}" fill="none" ` +
      `stroke="${t.boundary}" stroke-width="${round(t.connectorWidth * strokeScale)}" ` +
      `stroke-dasharray="16 12"/>`
  );
  out.push(text(sw.x + sw.w + 16, y + fs, 'Tool', t.stroke, 'bold'));
  y += line + gap;

  // origin colours — one word per line keeps the box narrow, and bold so the
  // blue and the green stay apart at this size. 600 is not safe here: SVG text
  // falls back to regular if the family has no semibold face.
  for (const o of Object.values(t.origin)) {
    for (const word of o.label.split(' ')) {
      out.push(text(box.x + pad, y + fs, word, o.color, 'bold'));
      y += line;
    }
    y += gap;
  }
  out.push('</g>');
  return out.join('');
}


/**
 * Fit a label inside its block.
 *
 * Blocks range from 125x52 (Nozzle) to 232x89 (AMS), so a single font size
 * either overflows the small ones or wastes the large ones. Size down until the
 * longest word fits the width, wrap, then size down again if the lines overrun
 * the height. Character widths are estimated at 0.55em, which is close enough
 * for a sans face and needs no text measurement.
 */
const CHAR_W = 0.55;

function labelLayout(text, boxW, boxH, base = 30) {
  const words = String(text).split(/\s+/);
  const padX = 14;
  const padY = 10;
  const longest = Math.max(...words.map((w) => w.length));

  let fs = Math.min(base, (boxW - padX) / (longest * CHAR_W));
  let lines = wrapAt(words, boxW - padX, fs);
  while (lines.length * fs * 1.15 > boxH - padY && fs > 8) {
    fs -= 1;
    lines = wrapAt(words, boxW - padX, fs);
  }
  return { fs, lines, lineHeight: fs * 1.15 };
}

function wrapAt(words, width, fontSize) {
  const max = Math.max(1, Math.floor(width / (fontSize * CHAR_W)));
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Convenience: render straight from a type id in the data file. */
export function renderType(data, id, opts = {}) {
  const a = data.types.find((x) => x.id === id);
  if (!a) throw new Error(`unknown type: ${id}`);
  return renderDiagram(data, {
    swaps: a.swaps,
    partial: a.partial || [],
    include: a.requires || [],
    swapsEdges: a.swapsEdges || [],
    partialAt: a.partialAt || {},
    edgeOverrides: a.edgeOverrides || [],
    ...opts,
  });
}

export function analyzeType(data, id) {
  const a = data.types.find((x) => x.id === id);
  if (!a) throw new Error(`unknown type: ${id}`);
  return analyze(data, {
    swaps: a.swaps,
    partial: a.partial || [],
    include: a.requires || [],
  });
}
