import { deck, shuffle } from '../cards.js';
import { runningCount } from '../hilo.js';
import { randInt } from '../rng.js';
import { INT_RE } from './running-stop.js';

export const stageId = 'running';
export const drillId = 'running.timed';

/** One 52-card deck with 1 to 3 cards removed unseen, so the answer is not always 0. */
export function generate(rng, ctx) {
  const k = randInt(rng, ctx.config.timedRemovedMin, ctx.config.timedRemovedMax);
  const cards = shuffle(deck(), rng).slice(k);
  return { itemKey: 'running:timed', cards, expected: String(runningCount(cards)), removed: k };
}

export function itemFromKey() {
  throw new Error('timed runs do not repeat');
}

/** meta = { seconds, targetSec } */
export function grade(item, given, meta = {}) {
  const correct = INT_RE.test(given) && Number(given) === Number(item.expected);
  const withinTarget = correct && typeof meta.seconds === 'number' && meta.seconds <= meta.targetSec;
  return { correct, withinTarget };
}
