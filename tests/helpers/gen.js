// Seeded generator of valid sessions and attempts, shared by tests and tools/gen-attempts.mjs.
import { makeRng, randInt, pick } from '../../src/core/rng.js';
import { allCells } from '../../src/core/chart.js';
import { RANKS } from '../../src/core/cards.js';

function uuid(rng) {
  const h = () => Math.floor(rng() * 16).toString(16);
  const s = (n) => Array.from({ length: n }, h).join('');
  return `${s(8)}-${s(4)}-4${s(3)}-8${s(3)}-${s(12)}`;
}

let counter = 0;
/** Deterministic UUID-shaped ids for hand-built tests. */
export function testId() {
  counter++;
  return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
}

export function attempt(over = {}) {
  return {
    id: testId(), v: 1, sessionId: over.sessionId ?? testId(), stageId: 'values', drillId: 'values.single',
    mode: 'test', itemKey: 'values:K', expected: '-1', given: '-1', correct: true, outcome: 'answered',
    ms: 1000, ts: Date.UTC(2026, 10, 18, 5), chartVer: '', cfgVer: '1', ...over,
  };
}

export function session(over = {}) {
  return { id: testId(), stageId: 'values', mode: 'test', startTs: Date.UTC(2026, 10, 18, 5), length: 50, ...over };
}

/**
 * A test session with `total` items of which `correct` are right, starting at startTs.
 * Returns { session, attempts }.
 */
export function testSession({ stageId = 'values', startTs, total, correct, mode = 'test', length }) {
  const drillId = { values: 'values.single', running: 'running.stop', strategy: 'strategy.cell' }[stageId];
  const s = session({ stageId, mode, startTs, length: length ?? total });
  const cells = allCells();
  const attempts = [];
  for (let i = 0; i < total; i++) {
    const ok = i < correct;
    const itemKey = stageId === 'strategy' ? `strategy:${cells[i % cells.length]}`
      : stageId === 'running' ? 'running:stop:20' : 'values:K';
    attempts.push(attempt({ sessionId: s.id, stageId, drillId, mode, itemKey, correct: ok,
      given: ok ? '-1' : '0', ts: startTs + (i + 1) * 1000, chartVer: stageId === 'strategy' ? '1' : '' }));
  }
  return { session: s, attempts };
}

/** Many random sessions and attempts for performance checks and the iPhone start-up test. */
export function generate(count, seed = 1, startTs = Date.UTC(2026, 0, 2)) {
  const rng = makeRng(seed);
  const sessions = [];
  const attempts = [];
  const cells = allCells();
  let ts = startTs;
  while (attempts.length < count) {
    const stageId = pick(rng, ['values', 'running', 'strategy']);
    const mode = pick(rng, ['test', 'test', 'learn', 'review']);
    const length = mode === 'test' ? { values: 50, running: 20, strategy: 50 }[stageId] : mode === 'review' ? 20 : null;
    const s = { id: uuid(rng), stageId, mode, startTs: ts, length };
    sessions.push(s);
    const n = length ?? randInt(rng, 5, 30);
    for (let i = 0; i < n && attempts.length < count; i++) {
      ts += randInt(rng, 2000, 9000);
      const correct = rng() < 0.92;
      const drillId = { values: 'values.single', running: 'running.stop', strategy: 'strategy.cell' }[stageId];
      const itemKey = stageId === 'values' ? `values:${pick(rng, RANKS)}`
        : stageId === 'running' ? `running:stop:${randInt(rng, 10, 45)}` : `strategy:${pick(rng, cells)}`;
      attempts.push({ id: uuid(rng), v: 1, sessionId: s.id, stageId, drillId, mode, itemKey,
        expected: '0', given: correct ? '0' : '1', correct, outcome: 'answered', ms: randInt(rng, 500, 8000),
        ts, chartVer: stageId === 'strategy' ? '1' : '', cfgVer: '1' });
    }
    ts += 3600000 * randInt(rng, 2, 30);
  }
  return { sessions, attempts };
}
