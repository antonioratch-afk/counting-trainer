// Strategy chart: 33 rows x 10 up-cards = 330 cells.
// Row keys: H5..H19 (hard, non-pair), A2..A9 (soft), P22..P99, PTT, PAA.
// Up-card keys: 2..9, T, A. A cellKey is row + 'v' + up, for example H16vT.

export const ROWS = [
  ...Array.from({ length: 15 }, (_, i) => `H${i + 5}`),
  ...Array.from({ length: 8 }, (_, i) => `A${i + 2}`),
  ...['22', '33', '44', '55', '66', '77', '88', '99', 'TT', 'AA'].map((p) => `P${p}`),
];
export const UPS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'];
export const CODES = ['H', 'S', 'D', 'Dh', 'Ds', 'P', 'Rh', 'Rs', 'Rp'];
export const ACTIONS = ['H', 'S', 'D', 'P', 'R'];

export function allCells() {
  const out = [];
  for (const r of ROWS) for (const u of UPS) out.push(`${r}v${u}`);
  return out;
}

export function parseCellKey(cellKey) {
  const m = /^(H(?:[5-9]|1[0-9])|A[2-9]|P(?:[2-9]{2}|TT|AA))v([2-9]|T|A)$/.exec(cellKey);
  if (!m) throw new Error(`bad cell key ${cellKey}`);
  return { row: m[1], up: m[2] };
}

/** Collapses Dh/Ds to D and Rh/Rs/Rp to R: a two-card hand can always double or surrender. */
export function collapse(code) {
  if (code === 'Dh' || code === 'Ds') return 'D';
  if (code === 'Rh' || code === 'Rs' || code === 'Rp') return 'R';
  return code;
}

/** @returns {'H'|'S'|'D'|'P'|'R'} */
export function expectedAction(chart, cellKey) {
  const { row, up } = parseCellKey(cellKey);
  return collapse(chart.cells[row][up]);
}

/** Structure check used at startup and in tests. */
export function validateChart(chart) {
  const errors = [];
  if (!chart || typeof chart !== 'object') return { ok: false, errors: ['chart: not an object'] };
  if (typeof chart.version !== 'string' || !chart.version) errors.push('version: missing');
  if (!Array.isArray(chart.sources) || chart.sources.length === 0) errors.push('sources: missing');
  else chart.sources.forEach((s, i) => {
    if (!s || typeof s.name !== 'string' || !s.name) errors.push(`sources[${i}].name: missing`);
  });
  const cells = chart.cells || {};
  for (const r of ROWS) {
    if (!cells[r]) { errors.push(`cells.${r}: missing row`); continue; }
    for (const u of UPS) {
      const v = cells[r][u];
      if (v === undefined) errors.push(`cells.${r}.${u}: missing`);
      else if (!CODES.includes(v)) errors.push(`cells.${r}.${u}: unknown code ${v}`);
    }
    for (const u of Object.keys(cells[r])) if (!UPS.includes(u)) errors.push(`cells.${r}.${u}: unknown up-card`);
  }
  for (const r of Object.keys(cells)) if (!ROWS.includes(r)) errors.push(`cells.${r}: unknown row`);
  return { ok: errors.length === 0, errors };
}

/** True when every source names where and when it was taken from. */
export function sourcesComplete(chart) {
  return Array.isArray(chart.sources) && chart.sources.every((s) => s.url && s.retrieved);
}

/**
 * Compares the chart with an independently typed check chart.
 * Returns differences not covered by overrides, and overrides that no longer differ (stale).
 */
export function compareCharts(chart, check) {
  const overrides = new Map((chart.overrides || []).map((o) => [o.cell, o]));
  const unresolved = [];
  const stale = [];
  for (const cell of allCells()) {
    const { row, up } = parseCellKey(cell);
    const a = chart.cells[row][up];
    const b = check.cells?.[row]?.[up];
    const differs = a !== b;
    if (differs && !overrides.has(cell)) unresolved.push({ cell, primary: a, check: b });
    if (!differs && overrides.has(cell)) stale.push(cell);
  }
  return { unresolved, stale };
}
