import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickReview } from '../src/core/review.js';
import { buildExport, parseImport, planMerge, exportFileName } from '../src/core/backup.js';
import { computeProgress } from '../src/core/progress.js';
import { config, chart, bkk } from './helpers/load.js';
import { attempt, session, testSession, testId } from './helpers/gen.js';

const cfg = config();
const ch = chart();
const NOW = bkk(2026, 11, 30, 12);

function hist(itemKey, results, { mode = 'test', start = 1000 } = {}) {
  return results.map((ok, i) => attempt({ stageId: 'strategy', drillId: 'strategy.cell', itemKey, mode,
    correct: ok, given: ok ? 'H' : 'S', ts: start + i * 10 }));
}

test('review: ranks by miss rate, then answers in window, then most recent miss', () => {
  const atts = [
    ...hist('strategy:H12v2', [false]),                       // 1 of 1 = 100%
    ...hist('strategy:H13v2', [false, false, false, false, false]), // 5 of 5 = 100%
    ...hist('strategy:H14v2', [true, false]),                 // 50%
    ...hist('strategy:H15v2', [true, true, true]),            // no miss
    ...hist('strategy:H16v2', [false, true, true, true, true, true]), // miss outside last 5
  ];
  assert.deepEqual(pickReview(atts, 'strategy', 10), ['strategy:H13v2', 'strategy:H12v2', 'strategy:H14v2']);
});

test('review: learn answers and voided items are ignored; running returns []', () => {
  const atts = [
    ...hist('strategy:H12v2', [false], { mode: 'learn' }),
    { ...hist('strategy:H13v2', [false])[0], outcome: 'voided', given: '' },
    ...hist('strategy:H14v2', [false], { mode: 'review' }),
  ];
  assert.deepEqual(pickReview(atts, 'strategy', 10), ['strategy:H14v2']);
  assert.deepEqual(pickReview(atts, 'running', 10), []);
});

function db(parts) {
  return { sessions: parts.map((p) => p.session), attempts: parts.flatMap((p) => p.attempts) };
}

function importInto(target, text) {
  const parsed = parseImport(text);
  assert.ok(parsed.ok, parsed.error);
  const plan = planMerge(new Set(target.attempts.map((a) => a.id)), new Set(target.sessions.map((s) => s.id)), parsed.data, NOW);
  target.sessions.push(...plan.toAdd.sessions);
  target.attempts.push(...plan.toAdd.attempts);
  return plan;
}

test('backup: export then import gives the same progress; second import adds 0', () => {
  const src = db([18, 19, 20].map((d) => testSession({ startTs: bkk(2026, 11, d), total: 50, correct: 50 })));
  const text = buildExport(src.attempts, src.sessions, NOW);
  const dst = { sessions: [], attempts: [] };
  const first = importInto(dst, text);
  assert.equal(first.toAdd.attempts.length, 150);
  assert.deepEqual(computeProgress(dst.attempts, dst.sessions, ch, cfg, NOW), computeProgress(src.attempts, src.sessions, ch, cfg, NOW));
  const second = importInto(dst, text);
  assert.equal(second.toAdd.attempts.length + second.toAdd.sessions.length, 0);
  assert.equal(second.duplicates, 153);
});

test('backup: mid-session export then a later export of the same session matches the source', () => {
  const full = testSession({ startTs: bkk(2026, 11, 18), total: 50, correct: 50 });
  const mid = { session: full.session, attempts: full.attempts.slice(0, 20) };
  const dst = { sessions: [], attempts: [] };
  importInto(dst, buildExport(mid.attempts, [mid.session], NOW));
  importInto(dst, buildExport(full.attempts, [full.session], NOW));
  assert.deepEqual(computeProgress(dst.attempts, dst.sessions, ch, cfg, NOW),
    computeProgress(full.attempts, [full.session], ch, cfg, NOW));
});

test('backup: wrong app, newer schema and bad JSON are refused', () => {
  assert.equal(parseImport('{"app":"other","schema":1,"attempts":[],"sessions":[]}').error, 'wrong-app');
  assert.equal(parseImport('{"app":"countingtrainer","schema":2,"attempts":[],"sessions":[]}').error, 'newer-schema');
  assert.equal(parseImport('{nope').error, 'not-json');
  assert.equal(parseImport('').error, 'empty');
});

test('backup: each validation rule rejects only its bad record', () => {
  const s = session({ startTs: bkk(2026, 11, 18) });
  const good = () => attempt({ sessionId: s.id, ts: bkk(2026, 11, 18, 12, 1) });
  const bads = {
    id: { id: 'nope' }, v: { v: 2 }, stageId: { stageId: 'x' }, drillId: { drillId: 'running.stop' },
    mode: { mode: 'speed' }, outcome: { outcome: 'missed' }, correct: { correct: 'yes' },
    ms: { ms: -1 }, ts: { ts: Date.UTC(2020, 0, 1) }, given: { given: 'x'.repeat(201) },
    'unknown-field': { extra: 1 },
  };
  for (const [reason, over] of Object.entries(bads)) {
    const data = { sessions: [s], attempts: [good(), { ...good(), ...over }] };
    const plan = planMerge(new Set(), new Set(), data, NOW);
    assert.equal(plan.toAdd.attempts.length, 1, reason);
    assert.equal(plan.rejected.length, 1, reason);
    assert.ok(plan.rejected[0].reason.includes(reason.split('-')[0]), `${reason}: ${plan.rejected[0].reason}`);
  }
});

test('backup: a rejected session rejects its attempts; unknown session is rejected', () => {
  const s = session({ startTs: bkk(2026, 11, 18), mode: 'bad' });
  const a = attempt({ sessionId: s.id, ts: bkk(2026, 11, 18, 13) });
  const orphan = attempt({ sessionId: testId(), ts: bkk(2026, 11, 18, 13) });
  const plan = planMerge(new Set(), new Set(), { sessions: [s], attempts: [a, orphan] }, NOW);
  assert.equal(plan.toAdd.attempts.length, 0);
  assert.deepEqual(plan.rejected.map((r) => r.reason), ['session:mode', 'attempt:session-rejected', 'attempt:unknown-session']);
});

test('backup: export file name uses the Thailand date', () => {
  assert.equal(exportFileName(bkk(2026, 11, 19, 0, 30)), 'counting-trainer-20261119.json');
});
