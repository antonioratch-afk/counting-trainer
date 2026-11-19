import { SUITS, TENS } from '../cards.js';
import { allCells, parseCellKey, expectedAction } from '../chart.js';
import { pick } from '../rng.js';

export const stageId = 'strategy';
export const drillId = 'strategy.cell';

/** Rank for a card value 2..10 (10 picks one of 10, J, Q, K). */
function rankFor(value, rng) {
  return value === 10 ? pick(rng, TENS) : String(value);
}

function card(rank, rng) {
  return { rank, suit: pick(rng, SUITS) };
}

/** Two non-ace cards of different values summing to total (so H16 is never 8+8). */
export function hardPairs(total) {
  const out = [];
  for (let a = 2; a <= 10; a++) for (let b = a + 1; b <= 10; b++) if (a + b === total) out.push([a, b]);
  return out;
}

/** Deals two player cards for a row and a dealer card for an up-card key. */
export function deal(row, up, rng) {
  let cards;
  if (row[0] === 'H') {
    const [a, b] = pick(rng, hardPairs(Number(row.slice(1))));
    cards = [card(rankFor(a, rng), rng), card(rankFor(b, rng), rng)];
  } else if (row[0] === 'A') {
    cards = [card('A', rng), card(row[1], rng)];
  } else {
    const v = row.slice(1, 2);
    const r = () => (v === 'T' ? pick(rng, TENS) : v);
    cards = [card(r(), rng), card(r(), rng)];
  }
  if (rng() < 0.5) cards.reverse();
  const dealer = card(up === 'T' ? pick(rng, TENS) : up, rng);
  return { cards, dealer };
}

function itemFor(cellKey, rng, ctx) {
  const { row, up } = parseCellKey(cellKey);
  const { cards, dealer } = deal(row, up, rng);
  return { itemKey: `strategy:${cellKey}`, cellKey, cards, dealer, expected: expectedAction(ctx.chart, cellKey) };
}

/**
 * ctx.covered: cells already answered correctly in test mode.
 * ctx.asked: cells asked in this session (no repeat until all were asked).
 */
export function chooseCell(rng, ctx) {
  const all = allCells();
  const asked = ctx.asked || new Set();
  const covered = ctx.covered || new Set();
  let pool = all.filter((c) => !asked.has(c));
  if (pool.length === 0) pool = all;
  const uncovered = pool.filter((c) => !covered.has(c));
  return pick(rng, uncovered.length ? uncovered : pool);
}

export function generate(rng, ctx) {
  return itemFor(chooseCell(rng, ctx), rng, ctx);
}

export function itemFromKey(itemKey, rng, ctx) {
  return itemFor(itemKey.slice('strategy:'.length), rng, ctx);
}

export function grade(item, given) {
  return { correct: given === item.expected };
}
