import { STAGES } from './config.js';
import { allCells } from './chart.js';
import { dayKey } from './daykey.js';
import { sessionStatus, countedSessions, groupBySession } from './session.js';

export function meetsBar(correct, total, thresholdPct) {
  return total > 0 && correct * 100 >= thresholdPct * total;
}

/**
 * Pass status for each step, calculated from stored rows only.
 * @returns {Record<string, {passed:boolean, daysCounted:number, todayCounted:boolean, todayPassed:boolean,
 *   lastSession:{pct:number,ts:number}|null, bestSession:{pct:number,ts:number}|null,
 *   cellsCovered?:number, cellsTotal?:number}>}
 */
export function computeProgress(attempts, sessions, chart, config, nowTs) {
  const bySession = groupBySession(attempts);
  const counted = countedSessions(sessions, config);
  const today = dayKey(nowTs, config.dayOffsetHours);
  const result = {};

  // Status of every complete test session, for last/best.
  const completeTests = new Map();
  for (const s of sessions) {
    if (s.mode !== 'test') continue;
    const st = sessionStatus(s, bySession.get(s.id) || [], nowTs, config);
    if (st.status === 'complete') completeTests.set(s.id, { session: s, st });
  }

  let covered = null;
  for (const stageId of STAGES) {
    const threshold = config.thresholdPct[stageId];
    let daysCounted = 0;
    let todayCounted = false;
    let todayPassed = false;
    let todayOpen = false;
    for (const [day, s] of counted.get(stageId) || []) {
      const done = completeTests.get(s.id);
      const passedDay = !!done && meetsBar(done.st.correct, done.st.itemsDone, threshold);
      if (passedDay) daysCounted++;
      if (day === today) {
        todayCounted = true;
        todayPassed = passedDay;
        todayOpen = !done && sessionStatus(s, bySession.get(s.id) || [], nowTs, config).status === 'open';
      }
    }

    let lastSession = null;
    let bestSession = null;
    for (const { session, st } of completeTests.values()) {
      if (session.stageId !== stageId) continue;
      const entry = { pct: Math.round((st.correct / st.itemsDone) * 1000) / 10, ts: session.startTs };
      if (!lastSession || entry.ts > lastSession.ts) lastSession = entry;
      if (!bestSession || entry.pct > bestSession.pct || (entry.pct === bestSession.pct && entry.ts < bestSession.ts)) bestSession = entry;
    }

    let passed = daysCounted >= config.daysToPass;
    const out = { passed, daysCounted, todayCounted, todayPassed, todayOpen, lastSession, bestSession };

    if (stageId === 'strategy') {
      if (!covered) covered = coveredCells(attempts);
      const cells = allCells();
      out.cellsTotal = cells.length;
      out.cellsCovered = cells.filter((c) => covered.has(c)).length;
      out.passed = passed && out.cellsCovered === out.cellsTotal;
    }
    result[stageId] = out;
  }
  return result;
}

/** Cells with at least one correct test-mode answer, in any test session. */
export function coveredCells(attempts) {
  const set = new Set();
  for (const a of attempts) {
    if (a.stageId === 'strategy' && a.mode === 'test' && a.correct) set.add(a.itemKey.slice('strategy:'.length));
  }
  return set;
}

export function passedList(progress) {
  return STAGES.filter((s) => progress[s].passed);
}

/** Steps that were passed and are not any more. prev undefined means never saved. */
export function droppedPasses(prev, next) {
  if (!Array.isArray(prev)) return [];
  return prev.filter((s) => !next.includes(s));
}
