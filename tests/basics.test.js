import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, randInt } from '../src/core/rng.js';
import { deck, shoe, shuffle, chartRank, displayRank, cardValue } from '../src/core/cards.js';
import { tag, runningCount, formatTag } from '../src/core/hilo.js';
import { dayKey } from '../src/core/daykey.js';
import { validateConfig } from '../src/core/config.js';
import { config, bkk } from './helpers/load.js';

test('rng: same seed gives same sequence, values in [0,1)', () => {
  const a = makeRng(42), b = makeRng(42);
  for (let i = 0; i < 1000; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test('rng: randInt bounds are inclusive', () => {
  const r = makeRng(1);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(randInt(r, 3, 5));
  assert.deepEqual([...seen].sort(), [3, 4, 5]);
});

test('cards: deck has 52 unique cards; shoe has 312', () => {
  const d = deck();
  assert.equal(d.length, 52);
  assert.equal(new Set(d.map((c) => c.rank + c.suit)).size, 52);
  assert.equal(shoe(6).length, 312);
});

test('cards: shuffle with a fixed seed is stable and keeps all cards', () => {
  const a = shuffle(deck(), makeRng(7)).map((c) => c.rank + c.suit).join();
  const b = shuffle(deck(), makeRng(7)).map((c) => c.rank + c.suit).join();
  assert.equal(a, b);
  assert.equal(new Set(a.split(',')).size, 52);
});

test('cards: chart and display ranks, values', () => {
  assert.equal(chartRank('K'), 'T');
  assert.equal(chartRank('7'), '7');
  assert.equal(displayRank('T'), '10');
  assert.equal(cardValue('A'), 11);
  assert.equal(cardValue('Q'), 10);
});

test('hilo: tags for every rank; a full deck counts to 0', () => {
  for (const r of ['2', '3', '4', '5', '6']) assert.equal(tag(r), 1);
  for (const r of ['7', '8', '9']) assert.equal(tag(r), 0);
  for (const r of ['T', 'J', 'Q', 'K', 'A']) assert.equal(tag(r), -1);
  assert.equal(runningCount(deck()), 0);
  assert.equal(formatTag(1), '+1');
  assert.equal(formatTag(0), '0');
  assert.equal(formatTag(-1), '-1');
});

test('daykey: Bangkok midnight splits days; UTC midnight is 07:00 the same Bangkok day', () => {
  assert.equal(dayKey(bkk(2026, 11, 18, 23, 59)), '2026-11-18');
  assert.equal(dayKey(bkk(2026, 11, 19, 0, 1)), '2026-11-19');
  assert.equal(dayKey(Date.UTC(2026, 10, 18, 0, 0)), '2026-11-18');
});

test('config: shipped config passes', () => {
  assert.deepEqual(validateConfig(config()), { ok: true, errors: [] });
});

test('config: each broken rule names its field', () => {
  const cases = [
    [(c) => { c.thresholdPct.values = 101; }, 'thresholdPct.values'],
    [(c) => { c.itemsPerTest.running = 0; }, 'itemsPerTest.running'],
    [(c) => { c.stopMin = 50; }, 'stopMin'],
    [(c) => { c.stopMax = 400; }, 'stopMax'],
    [(c) => { c.timedRemovedMax = 60; }, 'timedRemovedMax'],
    [(c) => { c.daysToPass = 1.5; }, 'daysToPass'],
    [(c) => { delete c.reviewItems; }, 'reviewItems'],
  ];
  for (const [mutate, field] of cases) {
    const c = config();
    mutate(c);
    const r = validateConfig(c);
    assert.equal(r.ok, false, field);
    assert.ok(r.errors.some((e) => e.startsWith(field)), `${field}: ${r.errors}`);
  }
});
