import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng.js';
import { runningCount, tag } from '../src/core/hilo.js';
import { cardValue, chartRank } from '../src/core/cards.js';
import { ROWS, UPS, allCells } from '../src/core/chart.js';
import * as values from '../src/core/drills/values.js';
import * as stop from '../src/core/drills/running-stop.js';
import * as timed from '../src/core/drills/running-timed.js';
import * as strategy from '../src/core/drills/strategy.js';
import { drillFor, DRILLS } from '../src/core/drills/index.js';
import { config, chart } from './helpers/load.js';

const cfg = config();
const ch = chart();

test('values: expected tag, item key round-trip, grading', () => {
  const rng = makeRng(1);
  for (let i = 0; i < 200; i++) {
    const it = values.generate(rng);
    assert.equal(Number(it.expected), tag(it.cards[0].rank));
    assert.equal(values.itemFromKey(it.itemKey, rng).expected, it.expected);
    assert.equal(values.grade(it, it.expected).correct, true);
    assert.equal(values.grade(it, '+2').correct, false);
    assert.equal(values.grade(it, '').correct, false);
  }
});

test('running.stop: stop point in range; expected matches a recount; malformed input is wrong', () => {
  const rng = makeRng(2);
  for (let i = 0; i < 300; i++) {
    const it = stop.generate(rng, { config: cfg });
    assert.ok(it.cards.length >= cfg.stopMin && it.cards.length <= cfg.stopMax);
    assert.equal(it.itemKey, `running:stop:${it.cards.length}`);
    assert.equal(it.expected, String(runningCount(it.cards)));
    assert.equal(stop.grade(it, it.expected).correct, true);
  }
  const it = { expected: '-3' };
  for (const bad of ['', '-', '+3', '3.0', ' -3', '-03', '--3']) assert.equal(stop.grade(it, bad).correct, false, bad);
  assert.equal(stop.grade(it, '-3').correct, true);
});

test('running.timed: deck never complete; withinTarget needs a correct count', () => {
  const rng = makeRng(3);
  for (let i = 0; i < 200; i++) {
    const it = timed.generate(rng, { config: cfg });
    assert.ok(it.cards.length >= 52 - cfg.timedRemovedMax && it.cards.length <= 52 - cfg.timedRemovedMin);
    assert.equal(it.expected, String(runningCount(it.cards)));
  }
  const it = { expected: '2' };
  assert.deepEqual(timed.grade(it, '2', { seconds: 25, targetSec: 30 }), { correct: true, withinTarget: true });
  assert.deepEqual(timed.grade(it, '2', { seconds: 31, targetSec: 30 }), { correct: true, withinTarget: false });
  assert.deepEqual(timed.grade(it, '3', { seconds: 10, targetSec: 30 }), { correct: false, withinTarget: false });
});

test('strategy: dealing rules for every row', () => {
  const rng = makeRng(4);
  for (const row of ROWS) {
    for (let i = 0; i < 40; i++) {
      const { cards, dealer } = strategy.deal(row, 'T', rng);
      assert.equal(chartRank(dealer.rank), 'T');
      const [a, b] = cards.map((c) => c.rank);
      if (row[0] === 'H') {
        assert.ok(a !== 'A' && b !== 'A', row);
        assert.notEqual(chartRank(a), chartRank(b), `${row} dealt a pair`);
        assert.equal(cardValue(a) + cardValue(b), Number(row.slice(1)), row);
      } else if (row[0] === 'A') {
        assert.ok([a, b].includes('A'), row);
        assert.ok([a, b].includes(row[1]), row);
      } else {
        assert.equal(chartRank(a), chartRank(b), row);
        assert.equal(chartRank(a), row[1], row);
      }
    }
  }
  for (const up of UPS) assert.equal(chartRank(strategy.deal('H12', up, rng).dealer.rank), up);
});

test('strategy: uncovered cells first; no repeat in a session until all asked', () => {
  const rng = makeRng(5);
  const cells = allCells();
  const covered = new Set(cells.slice(0, 320));
  const asked = new Set();
  for (let i = 0; i < 10; i++) {
    const c = strategy.chooseCell(rng, { covered, asked });
    assert.ok(!covered.has(c), 'should pick an uncovered cell');
    asked.add(c);
  }
  const askedAll = new Set();
  for (let i = 0; i < 330; i++) {
    const c = strategy.chooseCell(rng, { covered: new Set(cells), asked: askedAll });
    assert.ok(!askedAll.has(c), 'repeat before all asked');
    askedAll.add(c);
  }
  assert.ok(cells.includes(strategy.chooseCell(rng, { covered: new Set(), asked: askedAll })));
});

test('strategy: itemFromKey round-trips and grades', () => {
  const rng = makeRng(6);
  const it = strategy.itemFromKey('strategy:P88vA', rng, { chart: ch });
  assert.equal(it.itemKey, 'strategy:P88vA');
  assert.equal(it.expected, 'P');
  assert.equal(strategy.grade(it, 'P').correct, true);
  assert.equal(strategy.grade(it, 'Dh').correct, false);
});

test('registry: drill ids and step mapping', () => {
  assert.deepEqual(Object.keys(DRILLS).sort(), ['running.stop', 'running.timed', 'strategy.cell', 'values.single']);
  assert.equal(drillFor('running').drillId, 'running.stop');
});
