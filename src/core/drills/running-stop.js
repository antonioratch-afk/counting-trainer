import { shoe, shuffle } from '../cards.js';
import { runningCount } from '../hilo.js';
import { randInt } from '../rng.js';

export const stageId = 'running';
export const drillId = 'running.stop';

export const INT_RE = /^-?(0|[1-9][0-9]*)$/;

/** Fresh 6-deck shoe; stops at a random card between stopMin and stopMax. */
export function generate(rng, ctx) {
  const n = randInt(rng, ctx.config.stopMin, ctx.config.stopMax);
  const cards = shuffle(shoe(6), rng).slice(0, n);
  return { itemKey: `running:stop:${n}`, cards, expected: String(runningCount(cards)) };
}

export function itemFromKey() {
  throw new Error('running items do not repeat; review uses fresh runs');
}

export function grade(item, given) {
  return { correct: INT_RE.test(given) && Number(given) === Number(item.expected) };
}
