import { RANKS, SUITS } from '../cards.js';
import { tag, formatTag } from '../hilo.js';
import { pick } from '../rng.js';

export const stageId = 'values';
export const drillId = 'values.single';

function itemFor(rank, rng) {
  return {
    itemKey: `values:${rank}`,
    cards: [{ rank, suit: pick(rng, SUITS) }],
    expected: formatTag(tag(rank)),
  };
}

export function generate(rng) {
  return itemFor(pick(rng, RANKS), rng);
}

export function itemFromKey(itemKey, rng) {
  const rank = itemKey.slice('values:'.length);
  if (!RANKS.includes(rank)) throw new Error(`bad item key ${itemKey}`);
  return itemFor(rank, rng);
}

export function grade(item, given) {
  return { correct: given === item.expected };
}
