/**
 * build-docs.mjs — generate the docs site content.
 *
 * Reads:
 *   data/toolhead-taxonomy.json   the block template, the three classes, the eight types
 *   content/types/<id>.md         prose for each type — plain markdown, hand-written
 *   data/systems.csv              one row per shipping system, free-form columns
 *
 * Writes:
 *   docs/assets/diagrams/*.svg    static diagrams, one per type plus the key
 *   docs/index.md                 the page
 *
 * Nothing is generated in the browser — the site ships plain SVG files.
 *
 *   node tools/build-docs.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDiagram } from '../web/toolhead-diagram.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIAGRAMS = join(ROOT, 'docs', 'assets', 'diagrams');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

const data = JSON.parse(read('data', 'toolhead-taxonomy.json'));
const CLASS = Object.fromEntries(data.classes.map((c) => [c.id, c.label]));
const ORG = data.tokens.origin;
const PLATE = '#FFFFFF';

/* ------------------------------------------------------------------ *
 * CSV
 * ------------------------------------------------------------------ */

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
 * Columns with no value anywhere are dropped, so the table grows as the
 * spreadsheet gets filled in rather than showing a wall of empty cells.
 * `type` is the join key, and is implied by the section a row appears under.
 */
const systemColumns = systems.columns.filter(
  (c) => c !== 'type' && systems.rows.some((r) => r[c])
);

/* ------------------------------------------------------------------ *
 * Prose
 *
 * One markdown file per type under content/types/. It is written by hand and
 * never regenerated. The first paragraph doubles as the one-line summary in the
 * plate, so it stays short; the whole body goes into the type's section.
 * ------------------------------------------------------------------ */

function prose(id) {
  const file = join(ROOT, 'content', 'types', `${id}.md`);
  if (!existsSync(file)) return { body: '', summary: '' };

  const body = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '').trim();
  const first = body.split(/\n\s*\n/).find((p) => p.trim() && !p.startsWith('#')) || '';
  const summary = first
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // links keep their text
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { body, summary };
}

/* ------------------------------------------------------------------ *
 * Diagrams
 * ------------------------------------------------------------------ */

mkdirSync(DIAGRAMS, { recursive: true });

function writeSvg(name, svg) {
  const doc = `<?xml version="1.0" encoding="UTF-8"?>\n${svg.replace('<svg ', '<svg version="1.1" ')}\n`;
  writeFileSync(join(DIAGRAMS, name), doc, 'utf8');
  return `assets/diagrams/${name}`;
}

// The source figure uses one absolute line weight throughout. That reads right
// on the small panels but heavy on a diagram shown large, so the key and the
// detail figures get finer strokes.
const keyPath = writeSvg('key.svg', renderDiagram(data, {
  swaps: [], include: ['ams'], labels: true, boundary: false, legend: true,
  background: PLATE, strokeScale: 0.42,
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
    panel: writeSvg(`${t.id}.svg`, renderDiagram(data, { ...shared, labels: false, background: PLATE })),
    full: writeSvg(`${t.id}-labeled.svg`, renderDiagram(data, {
      ...shared, labels: true, background: PLATE, strokeScale: 0.6,
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const anchor = (t) => `type-${t.id}`;
const heading = (col) => col.charAt(0).toUpperCase() + col.slice(1);

function systemCell(row, col) {
  const v = row[col];
  if (!v) return '';
  if (col === 'url') return `[link](${v})`;
  if (col === 'origin') return ORG[v] ? ORG[v].label : v;
  // the legend colours names by origin, so the table does the same
  if (col === 'name' && ORG[row.origin]) return `<span class="tc-org-${esc(row.origin)}">${esc(v)}</span>`;
  return v.replace(/\|/g, '\\|');   // a bare pipe would end the table cell
}

function systemsTable(rows) {
  if (!rows.length) return ['_No systems recorded yet._'];
  return [
    `| ${systemColumns.map(heading).join(' | ')} |`,
    `| ${systemColumns.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${systemColumns.map((c) => systemCell(r, c)).join(' | ')} |`),
  ];
}

/**
 * The plate is emitted as one HTML block with no blank lines — python-markdown
 * passes it through untouched that way.
 */
function plate() {
  // the system list, coloured by origin, as in the source figure
  const listFor = (t) => systems.rows
    .filter((r) => r.type === t.id)
    .map((r) => `<span class="tc-org-${esc(r.origin)}">${esc(r.name)}</span>`)
    .join('');

  const cell = (t) =>
    `<a class="tc-cell" href="#${anchor(t)}">` +
      `<span class="tc-cell-fig"><img src="${figs[t.id].panel}" alt="${esc(t.label)} block diagram"></span>` +
      `<span class="tc-cell-txt">` +
        `<span class="tc-cell-name">${esc(t.label)}</span>` +
        `<span class="tc-cell-systems">${listFor(t)}</span>` +
        `<span class="tc-cell-desc">${esc(prose(t.id).summary) || '<em>Description to follow.</em>'}</span>` +
      `</span>` +
    `</a>`;

  const band = (classId, cls = '') =>
    `<div class="tc-band">` +
      `<div class="tc-band-label"><span>${esc(CLASS[classId])}</span></div>` +
      `<div class="tc-band-body ${cls}">` +
        data.types.filter((t) => t.class === classId).map(cell).join('') +
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

function typeSection(t) {
  const rows = systems.rows.filter((r) => r.type === t.id);

  const lines = [
    `<details class="tc-details" id="${anchor(t)}" markdown>`,
    `<summary>${esc(t.label)}</summary>`,
    '',
    `![${esc(t.label)}](${figs[t.id].full}){ .tc-detail-fig }`,
    '',
    prose(t.id).body || '_Description to follow._',
    '',
    // the figure floats beside the prose; the table starts below it
    '<div class="tc-clear"></div>',
    '',
    ...systemsTable(rows),
    '',
  ];
  if (t.note) lines.push('!!! note', '', `    ${t.note}`, '');
  lines.push('</details>');
  return lines.join('\n');
}

const page = [
  '# Toolchanger separation plane',
  '',
  'Every toolchanger cuts the toolhead at a different height. Everything above the',
  'cut is duplicated on every tool. Eight types, in three classes, all drawn from',
  'the same block diagram.',
  '',
  plate(),
  '',
  '## Toolchanger classes',
  '',
  ...data.classes.flatMap((c) => [
    `### ${c.label}`,
    '',
    ...data.types.filter((t) => t.class === c.id).flatMap((t) => [typeSection(t), '']),
  ]),
  '## All systems',
  '',
  ...systemsTable(systems.rows),
  '',
  '---',
  '',
  'Block diagram taxonomy after the original figure by **baconmilkshake**.',
  '',
].join('\n');

writeFileSync(join(ROOT, 'docs', 'index.md'), page, 'utf8');

const written = data.types.filter((t) => prose(t.id).body).length;
console.log(`diagrams  ${data.types.length * 2 + 1} svg -> docs/assets/diagrams/`);
console.log(`page      docs/index.md (${page.split('\n').length} lines)`);
console.log(`prose     ${written}/${data.types.length} types written in content/types/`);
console.log(`systems   ${systems.rows.length} rows; columns shown: ${systemColumns.join(', ')}`);
