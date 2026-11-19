import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateChart, expectedAction, allCells, compareCharts, sourcesComplete, collapse } from '../src/core/chart.js';
import { chart, loadJson, exists } from './helpers/load.js';

const FIXTURE = 'tests/fixtures/chart-check-bja.json';

test('chart: shipped chart passes validateChart and has 330 cells', () => {
  const c = chart();
  assert.deepEqual(validateChart(c).errors, []);
  assert.equal(allCells().length, 330);
});

test('chart: negative cases fail', () => {
  const missing = chart(); delete missing.cells.H16.T;
  assert.ok(validateChart(missing).errors.some((e) => e.includes('H16.T')));
  const unknown = chart(); unknown.cells.H16.T = 'X';
  assert.ok(validateChart(unknown).errors.some((e) => e.includes('unknown code')));
  const extra = chart(); extra.cells.H20 = { ...extra.cells.H19 };
  assert.ok(validateChart(extra).errors.some((e) => e.includes('unknown row')));
  const noSource = chart(); noSource.sources = [{ name: '' }];
  assert.ok(validateChart(noSource).errors.some((e) => e.includes('sources[0].name')));
});

test('chart: Dh/Ds grade as D, Rh/Rs/Rp as R', () => {
  for (const c of ['Dh', 'Ds']) assert.equal(collapse(c), 'D');
  for (const c of ['Rh', 'Rs', 'Rp']) assert.equal(collapse(c), 'R');
  const c = chart();
  assert.equal(expectedAction(c, 'H16vT'), 'R');
  assert.equal(expectedAction(c, 'H11v6'), 'D');
  assert.equal(expectedAction(c, 'A7v4'), 'D');
  assert.equal(expectedAction(c, 'P88vA'), 'P');
  assert.equal(expectedAction(c, 'PTTv6'), 'S');
});

test('chart: spot checks of well-known cells', () => {
  const c = chart();
  const cases = { H12v2: 'H', H12v4: 'S', H9v2: 'H', H9v3: 'D', H10vT: 'H', H11vA: 'H',
    A7v2: 'S', A7v9: 'H', A8v6: 'S', P99v7: 'S', P99v8: 'P', P44v5: 'P', P55v9: 'D', H15vT: 'R', H15vA: 'H',
    H17vA: 'S', H16v7: 'H' };
  for (const [cell, want] of Object.entries(cases)) assert.equal(expectedAction(c, cell), want, cell);
});

test('chart: every cell matches the independently typed check chart or is in overrides',
  { todo: exists(FIXTURE) ? false : 'check fixture not typed yet (design Phase 2, open item E1)' }, () => {
    const r = compareCharts(chart(), loadJson(FIXTURE));
    assert.deepEqual(r.unresolved, [], 'unresolved differences');
    assert.deepEqual(r.stale, [], 'stale overrides');
  });

test('chart: every source records its URL and retrieval date',
  { todo: sourcesComplete(chart()) ? false : 'sources not filled in yet (design open item E1)' }, () => {
    assert.ok(sourcesComplete(chart()));
  });

test('chart: compareCharts finds unresolved and stale entries', () => {
  const a = chart();
  const b = chart();
  b.cells.H16.T = 'H';
  assert.deepEqual(compareCharts(a, b).unresolved, [{ cell: 'H16vT', primary: 'Rh', check: 'H' }]);
  a.overrides = [{ cell: 'H16vT', primary: 'Rh', check: 'H', chosen: 'Rh', reason: 'x' }, { cell: 'H5v2' }];
  const r = compareCharts(a, b);
  assert.deepEqual(r.unresolved, []);
  assert.deepEqual(r.stale, ['H5v2']);
});
