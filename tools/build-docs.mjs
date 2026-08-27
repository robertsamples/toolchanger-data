/**
 * build-docs.mjs — regenerate the parts of the site that are derived from data.
 *
 * docs/index.md is written by hand. This only produces what would be tedious or
 * error-prone to keep in sync by hand:
 *
 *   docs/assets/diagrams/*.svg   one diagram per type, plus the annotated key
 *   snippets/plate.html          the taxonomy plate at the top of the page
 *   snippets/type-<id>.md        that type's systems table, and any data note
 *
 * The page pulls the snippets in with `--8<-- "..."`.
 *
 *   node tools/build-docs.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDiagram } from '../web/toolhead-diagram.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

const data = JSON.parse(read('data', 'toolhead-taxonomy.json'));
const CLASS = Object.fromEntries(data.classes.map((c) => [c.id, c.label]));
const ORG = data.tokens.origin;

const warnings = [];
const warn = (msg) => warnings.push(msg);

/* ---------------------------------------------------------------- *
 * systems.csv
 * ---------------------------------------------------------------- */

/** Minimal RFC4180 reader — handles quoted fields containing commas and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const kept = rows.filter((r) => r.some((v) => v.trim()));
  if (!kept.length) return { columns: [], rows: [] };
  const [head, ...body] = kept;
  const columns = head.map((h) => h.trim());
  return {
    columns,
    rows: body.map((r) => Object.fromEntries(columns.map((c, i) => [c, (r[i] || '').trim()]))),
  };
}

const systems = parseCsv(read('data', 'systems.csv'));

/**
 * A column that is empty for every row is left out, so the table grows as the
 * spreadsheet is filled in. `type` is the join key and never shown.
 */
const columns = systems.columns.filter(
  (c) => c !== 'type' && systems.rows.some((r) => r[c])
);

for (const r of systems.rows) {
  if (!data.types.some((t) => t.id === r.type)) {
    warn(`systems.csv: "${r.name}" has type "${r.type}", which is not in the taxonomy`);
  }
}

/* ---------------------------------------------------------------- *
 * Sanity check against the page
 * ---------------------------------------------------------------- */

const pageText = read('docs', 'index.md');
for (const t of data.types) {
  if (!pageText.includes(`id="type-${t.id}"`)) {
    warn(`docs/index.md has no section for type "${t.id}"`);
  }
}

/* ---------------------------------------------------------------- *
 * Diagrams
 * ---------------------------------------------------------------- */

mkdirSync(join(ROOT, 'docs', 'assets', 'diagrams'), { recursive: true });
mkdirSync(join(ROOT, 'snippets'), { recursive: true });

function writeSvg(name, svg) {
  const doc = `<?xml version="1.0" encoding="UTF-8"?>\n${svg.replace('<svg ', '<svg version="1.1" ')}\n`;
  writeFileSync(join(ROOT, 'docs', 'assets', 'diagrams', name), doc, 'utf8');
  return `assets/diagrams/${name}`;
}

// The source figure uses one absolute line weight throughout. That reads right
// on the small panels but heavy on a diagram shown large, so the key and the
// detail figures get finer strokes.
const keyPath = writeSvg('key.svg', renderDiagram(data, {
  swaps: [], include: ['ams'], labels: true, boundary: false, legend: true,
  strokeScale: 0.42,
}));

const figs = {};
for (const t of data.types) {
  const shared = {
    swaps: t.swaps,
    partial: t.partial || [],
    include: t.requires || [],
    edgeOverrides: t.edgeOverrides || [],
  };
  figs[t.id] = {
    panel: writeSvg(`${t.id}.svg`, renderDiagram(data, { ...shared, labels: false })),
    full: writeSvg(`${t.id}-labeled.svg`, renderDiagram(data, {
      ...shared, labels: true, strokeScale: 0.6,
    })),
  };
}

/* ---------------------------------------------------------------- *
 * Snippets
 * ---------------------------------------------------------------- */

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const heading = (col) => col.charAt(0).toUpperCase() + col.slice(1);

function cell(row, col) {
  const v = row[col];
  if (!v) return '';
  if (col === 'url') return `[link](${v})`;
  if (col === 'origin') return ORG[v] ? ORG[v].label : v;
  // the legend colours names by origin, so the table does the same
  if (col === 'name' && ORG[row.origin]) return `<span class="tc-org-${esc(row.origin)}">${esc(v)}</span>`;
  return v.replace(/\|/g, '\\|');   // a bare pipe would end the table cell
}

function table(rows) {
  if (!rows.length) return ['_No systems recorded yet._'];
  return [
    `| ${columns.map(heading).join(' | ')} |`,
    `| ${columns.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${columns.map((c) => cell(r, c)).join(' | ')} |`),
  ];
}

const banner = '<!-- Generated by tools/build-docs.mjs. Edit data/, not this. -->';

for (const t of data.types) {
  const lines = [banner, ''];
  if (t.note) lines.push('!!! note', '', `    ${t.note}`, '');
  lines.push(...table(systems.rows.filter((r) => r.type === t.id)), '');
  writeFileSync(join(ROOT, 'snippets', `type-${t.id}.md`), lines.join('\n'), 'utf8');
}

writeFileSync(
  join(ROOT, 'snippets', 'systems-all.md'),
  [banner, '', ...table(systems.rows), ''].join('\n'),
  'utf8'
);

/** One HTML block with no blank lines — python-markdown passes it through as-is. */
function plate() {
  const list = (t) => systems.rows
    .filter((r) => r.type === t.id)
    .map((r) => `<span class="tc-org-${esc(r.origin)}">${esc(r.name)}</span>`)
    .join('');

  const card = (t) =>
    `<a class="tc-cell" href="#type-${esc(t.id)}">` +
      `<span class="tc-cell-fig"><img src="${figs[t.id].panel}" alt="${esc(t.label)} block diagram"></span>` +
      `<span class="tc-cell-txt">` +
        `<span class="tc-cell-name">${esc(t.label)}</span>` +
        `<span class="tc-cell-systems">${list(t)}</span>` +
      `</span>` +
    `</a>`;

  const band = (classId, cls = '') =>
    `<div class="tc-band">` +
      `<div class="tc-band-label"><span>${esc(CLASS[classId])}</span></div>` +
      `<div class="tc-band-body ${cls}">` +
        data.types.filter((t) => t.class === classId).map(card).join('') +
      `</div>` +
    `</div>`;

  return `<div class="tc-plate">` +
    `<div class="tc-top">` +
      `<div class="tc-key"><img src="${keyPath}" alt="Annotated toolhead block diagram, with legend"></div>` +
      band('conventional', 'tc-one') +
    `</div>` +
    band('filament_path') +
    band('nozzle') +
  `</div>`;
}

writeFileSync(join(ROOT, 'snippets', 'plate.html'), `${banner}\n${plate()}\n`, 'utf8');

/* ---------------------------------------------------------------- */

console.log(`diagrams  ${data.types.length * 2 + 1} svg`);
console.log(`snippets  plate.html, systems-all.md, ${data.types.length} type tables`);
console.log(`systems   ${systems.rows.length} rows; columns shown: ${columns.join(', ')}`);
for (const w of warnings) console.warn(`warning: ${w}`);
