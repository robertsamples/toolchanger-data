/**
 * build-docs.mjs — regenerate the parts of the site that are derived from data.
 *
 * The docs/*.md pages are written by hand. This only produces what would be tedious or
 * error-prone to keep in sync by hand:
 *
 *   docs/assets/diagrams/*.svg   one diagram per type, plus the annotated key
 *   snippets/plate.html          the taxonomy plate on the front page
 *   snippets/type-<id>.md        that type's systems table, and any data note
 *   snippets/systems-*.md        the three tables on the All systems page
 *   docs/llms.txt                the whole taxonomy and table as plain text
 *
 * The pages pull the snippets in with `--8<-- "..."`.
 *
 *   node tools/build-docs.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
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

/**
 * The CSV is maintained separately and does not always use the taxonomy's own
 * ids, so a type may declare the other spellings it answers to. Resolve those
 * up front, then report anything still unmatched grouped by type rather than
 * one line per row.
 */
const byAlias = {};
for (const t of data.types) {
  byAlias[t.id] = t.id;
  for (const a of t.aliases || []) byAlias[a] = t.id;
}

const unknown = {};
for (const r of systems.rows) {
  const resolved = byAlias[r.type];
  if (resolved) r.type = resolved;
  else (unknown[r.type] ||= []).push(r.name);
}
for (const [type, names] of Object.entries(unknown)) {
  warn(`systems.csv: type "${type}" is not in the taxonomy — ${names.length} row(s) `
     + `listed under Other approaches, not in any class band: ${names.slice(0, 3).join(', ')}`
     + (names.length > 3 ? `, +${names.length - 3} more` : ''));
}

/* ---------------------------------------------------------------- *
 * Sanity check against the pages
 * ---------------------------------------------------------------- */

/** Each type has its own page under docs/subtypes/, which the plate links to. */
const slug = (id) => id.replace(/_/g, '-');
const navText = read('mkdocs.yml');

for (const t of data.types) {
  const page = `subtypes/${slug(t.id)}.md`;
  if (!existsSync(join(ROOT, 'docs', page))) warn(`docs/${page} is missing`);
  else if (!navText.includes(page)) warn(`${page} is not in the nav in mkdocs.yml`);
}

/**
 * The plate is raw HTML. MkDocs leaves relative paths in raw HTML alone, while
 * Zensical rewrites them — so a relative path cannot be correct for both. A
 * site-root path is left as-is by both, which is why the images and the subtype
 * links inside the plate are absolute.
 */
const includers = readdirSync(join(ROOT, 'docs'))
  .filter((f) => f.endsWith('.md') && read('docs', f).includes('--8<-- "plate.html"'));

if (includers.length !== 1) {
  warn(`plate.html is included by ${includers.length} pages (${includers.join(', ') || 'none'})`);
}
const SITE_ROOT = '/';

/* ---------------------------------------------------------------- *
 * Diagrams
 * ---------------------------------------------------------------- */

mkdirSync(join(ROOT, 'docs', 'assets', 'diagrams'), { recursive: true });
mkdirSync(join(ROOT, 'snippets'), { recursive: true });

function writeSvg(name, svg) {
  const doc = `<?xml version="1.0" encoding="UTF-8"?>\n${svg.replace('<svg ', '<svg version="1.1" ')}\n`;
  writeFileSync(join(ROOT, 'docs', 'assets', 'diagrams', name), doc, 'utf8');
  return `${SITE_ROOT}assets/diagrams/${name}`;
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
    swapsEdges: t.swapsEdges || [],
    partialAt: t.partialAt || {},
    edgeOverrides: t.edgeOverrides || [],
  };
  figs[t.id] = {
    // only `panel` is used from the raw-HTML plate; the labelled figures are
    // referenced with markdown syntax, which MkDocs rewrites for us
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

/**
 * The full list is split three ways.
 *
 *   toolchangers  rows whose type is one of the eight in the taxonomy
 *   ams           AMS and MMU units, which multiplex filament into one hot end
 *   other         everything else — IDEX, colour deposition, virtual colour
 *
 * Only the first table holds machines the block diagram on this site describes.
 */
const AMS_TYPES = new Set(['filament_path_changer']);
const isToolchanger = (r) => data.types.some((t) => t.id === r.type);
const isAms = (r) => AMS_TYPES.has(r.type);

for (const [name, rows] of [
  ['systems-toolchangers.md', systems.rows.filter(isToolchanger)],
  ['systems-ams.md', systems.rows.filter(isAms)],
  ['systems-other.md', systems.rows.filter((r) => !isToolchanger(r) && !isAms(r))],
]) {
  writeFileSync(join(ROOT, 'snippets', name), [banner, '', ...table(rows), ''].join('\n'), 'utf8');
}

/** One HTML block with no blank lines — python-markdown passes it through as-is. */
function plate() {
  const list = (t) => systems.rows
    .filter((r) => r.type === t.id)
    .map((r) => `<span class="tc-org-${esc(r.origin)}">${esc(r.name)}</span>`)
    .join('');

  const card = (t) =>
    `<a class="tc-cell" href="${SITE_ROOT}subtypes/${slug(t.id)}/">` +
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

/* ---------------------------------------------------------------- *
 * llms.txt
 * ---------------------------------------------------------------- *
 *
 * The site is a vocabulary and a table, and both are awkward to recover from
 * the rendered pages — the vocabulary is carried by diagrams and the table is
 * split across eleven of them. This states both in one plain-text file at a
 * well-known path, so an agent does not have to crawl the site to answer
 * "what kind of toolchanger is X" or "which ones swap only the nozzle".
 *
 * Nothing here is new content: the summaries are the opening paragraph of each
 * subtype page and the systems come from the same CSV as the tables, so it
 * cannot drift from what a reader sees.
 */

const SITE = 'https://toolchangers.baconmilkshake.com';
const REPO = 'https://github.com/robertsamples/toolchanger-data';

const BLOCK = Object.fromEntries(data.template.blocks.map((b) => [b.id, b.label]));

/** The first prose paragraph of a subtype page, i.e. what it is in one go. */
function summary(t) {
  const page = read('docs', 'subtypes', `${slug(t.id)}.md`);
  const para = page
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('![') && !p.startsWith('<'));
  if (!para) warn(`docs/subtypes/${slug(t.id)}.md has no opening paragraph for llms.txt`);
  return (para || '').replace(/\s+/g, ' ');
}

function llms() {
  const L = [];
  L.push('# Toolchanger data', '');
  L.push('> A vocabulary for 3D printer toolchangers, and a table of the machines that use');
  L.push('> each kind. Systems get sorted by where the tool/carriage split is drawn, because');
  L.push('> that is what sets the cost per tool, the moving mass, and what has to be broken');
  L.push('> and remade at every change. Three classes, eight subtypes.', '');
  L.push(`Site: ${SITE}/  ·  Source: ${REPO}`);
  L.push('Generated from data/ by tools/build-docs.mjs. Not hand-written.', '');

  L.push('## How the classification works', '');
  L.push('Every subtype is one block diagram of a toolhead with a dashed outline drawn round');
  L.push('the part that leaves with a tool change. Blocks inside the outline exist once per');
  L.push('tool; connections crossing it are broken and remade at every change. The blocks are:');
  L.push(data.template.blocks.map((b) => b.label).join(', ') + '.', '');
  L.push('Each subtype page also carries pros and cons; those are not repeated here.', '');
  L.push('Classes differ in where that outline falls:', '');
  for (const c of data.classes) {
    const kinds = data.types.filter((t) => t.class === c.id).map((t) => t.label);
    L.push(`- ${c.label} — ${kinds.join('; ')}`);
  }
  L.push('');

  for (const c of data.classes) {
    L.push(`## ${c.label}`, '');
    for (const t of data.types.filter((x) => x.class === c.id)) {
      const rows = systems.rows.filter((r) => r.type === t.id);
      L.push(`### ${t.label}`, '');
      L.push(`${SITE}/subtypes/${slug(t.id)}/`, '');
      L.push(`Travels with the tool: ${(t.swaps || []).map((b) => BLOCK[b] || b).join(', ') || 'nothing'}.`);
      if (t.partial?.length) {
        L.push(`Split through: ${t.partial.map((b) => BLOCK[b] || b).join(', ')}.`);
      }
      L.push('');
      const s = summary(t);
      if (s) L.push(s, '');
      if (rows.length) {
        L.push(`Systems (${rows.length}):`);
        for (const r of rows) {
          const bits = [ORG[r.origin]?.label || r.origin];
          if (r['max tools']) bits.push(`up to ${r['max tools']} tools`);
          if (r['change time (s)']) bits.push(`${r['change time (s)']} s change`);
          if (r['total cost (USD)']) bits.push(`$${r['total cost (USD)']}`);
          L.push(`- ${r.name} — ${bits.join(', ')}${r.url ? ` — ${r.url}` : ''}`);
        }
        L.push('');
      }
    }
  }

  L.push('## Not toolchangers', '');
  L.push('Listed on the site for comparison, but outside the classification above: AMS and');
  L.push('MMU units that multiplex filament into one hot end, IDEX and other multi-head');
  L.push('machines, colour deposition, and virtual-colour techniques.');
  L.push(`See ${SITE}/all-systems/`, '');

  L.push('## Data', '');
  L.push(`- Every system as CSV: ${REPO}/blob/main/data/systems.csv`);
  L.push(`- Class and subtype definitions as JSON: ${REPO}/blob/main/data/toolhead-taxonomy.json`);
  L.push(`- All pages: ${SITE}/sitemap.xml`, '');
  L.push('The toolchanger tables were compiled by https://github.com/ukdavewood.');
  L.push('Diagrams, taxonomy and site by https://github.com/robertsamples.', '');

  return L.join('\n');
}

writeFileSync(join(ROOT, 'docs', 'llms.txt'), llms(), 'utf8');

/* ---------------------------------------------------------------- */

console.log(`diagrams  ${data.types.length * 2 + 1} svg`);
console.log(`snippets  plate.html, 3 system tables, ${data.types.length} type tables`);
console.log(`llms.txt  ${llms().split('\n').length} lines`);
console.log(`systems   ${systems.rows.length} rows; columns shown: ${columns.join(', ')}`);
console.log(`plate     included by ${includers.join(', ') || '(nobody)'}, paths rooted at "${SITE_ROOT}"`);
for (const w of warnings) console.warn(`warning: ${w}`);
