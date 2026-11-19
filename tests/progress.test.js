import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionStatus, countedSessions } from '../src/core/session.js';
import { computeProgress, droppedPasses, passedList } from '../src/core/progress.js';
import { allCells } from '../src/core/chart.js';
import { config, chart, bkk } from './helpers/load.js';
import { testSession, attempt, session, generate } from './helpers/gen.js';

const cfg = config();
const ch = chart();
const NOW = bkk(2026, 11, 30, 12);

function progressOf(parts, now = NOW, c = cfg) {
  const sessions = parts.map((p) => p.session);
  const attempts = parts.flatMap((p) => p.attempts);
  return computeProgress(attempts, sessions, ch, c, now);
}

test('session: complete exactly at length; missed counts, voided does not', () => {
  const s = session({ length: 3, startTs: NOW - 60000 });
  const a = (o) => attempt({ sessionId: s.id, ts: NOW - 30000, ...o });
  assert.equal(sessionStatus(s, [a(), a()], NOW, cfg).status, 'open');
  assert.equal(sessionStatus(s, [a(), a(), a({ outcome: 'voided', correct: false, given: '' })], NOW, cfg).status, 'open');
  const st = sessionStatus(s, [a(), a(), a({ outcome: 'missed', correct: false, given: '' })], NOW, cfg);
  assert.equal(st.status, 'complete');
  assert.equal(st.correct, 2);
});

test('session: abandoned after 30 idle minutes, including a session with no attempts', () => {
  const s = session({ length: 50, startTs: NOW - 31 * 60000 });
  assert.equal(sessionStatus(s, [], NOW, cfg).status, 'abandoned');
  assert.equal(sessionStatus(s, [], NOW - 2 * 60000, cfg).status, 'open');
  assert.equal(sessionStatus(s, [attempt({ sessionId: s.id, ts: NOW - 10 * 60000 })], NOW, cfg).status, 'open');
});

test('session: dayKey from startTs; started at 23:58 Bangkok belongs to that day', () => {
  const s = session({ startTs: bkk(2026, 11, 18, 23, 58) });
  assert.equal(sessionStatus(s, [], NOW, cfg).dayKey, '2026-11-18');
});

test('progress: Step 1 thresholds 49/50 pass, 48/50 fail', () => {
  const days = [18, 19, 20];
  const pass = progressOf(days.map((d) => testSession({ startTs: bkk(2026, 11, d), total: 50, correct: 49 })));
  assert.equal(pass.values.passed, true);
  const fail = progressOf(days.map((d) => testSession({ startTs: bkk(2026, 11, d), total: 50, correct: 48 })));
  assert.equal(fail.values.passed, false);
  assert.equal(fail.values.daysCounted, 0);
});

test('progress: Step 2 19/20 passes, 18/20 fails', () => {
  const mk = (c) => [18, 19, 20].map((d) => testSession({ stageId: 'running', startTs: bkk(2026, 11, d), total: 20, correct: c }));
  assert.equal(progressOf(mk(19)).running.passed, true);
  assert.equal(progressOf(mk(18)).running.daysCounted, 0);
});

test('progress: Step 3 48/50 counts a day, 47/50 does not; pass needs full coverage', () => {
  const ok = progressOf([testSession({ stageId: 'strategy', startTs: bkk(2026, 11, 18), total: 50, correct: 48 })]);
  assert.equal(ok.strategy.daysCounted, 1);
  const bad = progressOf([testSession({ stageId: 'strategy', startTs: bkk(2026, 11, 18), total: 50, correct: 47 })]);
  assert.equal(bad.strategy.daysCounted, 0);

  const three = [18, 19, 20].map((d) => testSession({ stageId: 'strategy', startTs: bkk(2026, 11, d), total: 50, correct: 50 }));
  const p = progressOf(three);
  assert.equal(p.strategy.daysCounted, 3);
  assert.equal(p.strategy.passed, false, 'not all cells covered');
  assert.equal(p.strategy.cellsTotal, 330);
});

test('progress: coverage counts correct test answers from uncounted sessions too', () => {
  const parts = [18, 19, 20].map((d) => testSession({ stageId: 'strategy', startTs: bkk(2026, 11, d), total: 50, correct: 50 }));
  // A second (uncounted) test session each day covers the remaining cells.
  const cells = allCells();
  const extra = session({ stageId: 'strategy', mode: 'test', startTs: bkk(2026, 11, 20, 18), length: 300 });
  const extraAtt = cells.map((c, i) => attempt({ sessionId: extra.id, stageId: 'strategy', drillId: 'strategy.cell',
    itemKey: `strategy:${c}`, ts: extra.startTs + i * 1000, chartVer: '1' }));
  const p = progressOf([...parts, { session: extra, attempts: extraAtt }]);
  assert.equal(p.strategy.cellsCovered, 330);
  assert.equal(p.strategy.daysCounted, 3);
  assert.equal(p.strategy.passed, true);
});

test('progress: missed items count as wrong', () => {
  const t = testSession({ startTs: bkk(2026, 11, 18), total: 50, correct: 50 });
  t.attempts[0] = { ...t.attempts[0], outcome: 'missed', correct: false, given: '' };
  t.attempts[1] = { ...t.attempts[1], outcome: 'missed', correct: false, given: '' };
  assert.equal(progressOf([t]).values.daysCounted, 0);
});

test('progress: the first test session started each day is the counted one', () => {
  const failFirst = testSession({ startTs: bkk(2026, 11, 18, 9), total: 50, correct: 40 });
  const passSecond = testSession({ startTs: bkk(2026, 11, 18, 10), total: 50, correct: 50 });
  assert.equal(progressOf([failFirst, passSecond]).values.daysCounted, 0);

  const abandoned = { session: session({ startTs: bkk(2026, 11, 18, 9), length: 50 }), attempts: [] };
  assert.equal(progressOf([abandoned, passSecond]).values.daysCounted, 0);

  const passFirst = testSession({ startTs: bkk(2026, 11, 18, 9), total: 50, correct: 50 });
  assert.equal(progressOf([passFirst, passSecond]).values.daysCounted, 1, 'two passing sessions count once');
});

test('progress: 2 days do not pass; 3 non-consecutive days pass', () => {
  const two = [18, 20].map((d) => testSession({ startTs: bkk(2026, 11, d), total: 50, correct: 50 }));
  assert.equal(progressOf(two).values.passed, false);
  const three = [1, 10, 25].map((d) => testSession({ startTs: bkk(2026, 11, d), total: 50, correct: 50 }));
  assert.equal(progressOf(three).values.passed, true);
});

test('progress: learn, review and speed sessions are ignored', () => {
  const parts = [18, 19, 20].flatMap((d) => [
    testSession({ startTs: bkk(2026, 11, d), total: 50, correct: 50, mode: 'learn', length: null }),
    testSession({ startTs: bkk(2026, 11, d, 13), total: 20, correct: 20, mode: 'review' }),
  ]);
  const p = progressOf(parts);
  assert.equal(p.values.daysCounted, 0);
  assert.equal(p.values.lastSession, null);
});

test('progress: todayCounted and todayPassed', () => {
  const today = testSession({ startTs: bkk(2026, 11, 30, 8), total: 50, correct: 30 });
  const p = progressOf([today]);
  assert.equal(p.values.todayCounted, true);
  assert.equal(p.values.todayPassed, false);
  assert.equal(progressOf([]).values.todayCounted, false);
});

test('progress: raising a threshold drops a pass and droppedPasses reports it', () => {
  const parts = [18, 19, 20].map((d) => testSession({ startTs: bkk(2026, 11, d), total: 50, correct: 49 }));
  const before = passedList(progressOf(parts));
  const stricter = structuredClone(cfg);
  stricter.thresholdPct.values = 100;
  const after = passedList(progressOf(parts, NOW, stricter));
  assert.deepEqual(before, ['values']);
  assert.deepEqual(droppedPasses(before, after), ['values']);
  assert.deepEqual(droppedPasses(undefined, after), []);
});

test('progress: counted sessions picks the earliest start per step and day', () => {
  const a = session({ startTs: bkk(2026, 11, 18, 10) });
  const b = session({ startTs: bkk(2026, 11, 18, 9) });
  const map = countedSessions([a, b], cfg);
  assert.equal(map.get('values').get('2026-11-18').id, b.id);
});

test('progress: best of 5 runs under 100 ms on 20,000 generated attempts', () => {
  const { sessions, attempts } = generate(20000, 1);
  let best = Infinity;
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    computeProgress(attempts, sessions, ch, cfg, NOW);
    best = Math.min(best, performance.now() - t0);
  }
  assert.ok(best < 100, `took ${best.toFixed(1)} ms`);
});
