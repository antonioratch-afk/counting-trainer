import { dayKey } from './daykey.js';

/** Session rows are written once at Start and never changed. */
export function newSession({ id, stageId, mode, length, nowTs }) {
  return { id, stageId, mode, startTs: nowTs, length: length ?? null };
}

/** Planned length for a mode: test uses the step's item count; learn and speed have none. */
export function plannedLength(stageId, mode, config, reviewCount) {
  if (mode === 'test') return config.itemsPerTest[stageId];
  if (mode === 'review') return reviewCount ?? config.reviewItems[stageId];
  return null;
}

/**
 * Status is calculated, never stored.
 * complete: answered or missed items reach length. abandoned: not complete and idle too long.
 */
export function sessionStatus(session, attemptsOfSession, nowTs, config) {
  let itemsDone = 0;
  let correct = 0;
  let lastTs = session.startTs;
  for (const a of attemptsOfSession) {
    if (a.ts > lastTs) lastTs = a.ts;
    if (a.outcome === 'voided') continue;
    itemsDone++;
    if (a.correct) correct++;
  }
  let status;
  if (session.length != null && itemsDone >= session.length) status = 'complete';
  else if (nowTs - lastTs > config.abandonAfterMin * 60000) status = 'abandoned';
  else status = 'open';
  return { status, itemsDone, correct, lastTs, dayKey: dayKey(session.startTs, config.dayOffsetHours) };
}

/** @returns {Map<string, Map<string, object>>} stageId -> dayKey -> first test session started that day */
export function countedSessions(sessions, config) {
  const out = new Map();
  for (const s of sessions) {
    if (s.mode !== 'test') continue;
    const day = dayKey(s.startTs, config.dayOffsetHours);
    if (!out.has(s.stageId)) out.set(s.stageId, new Map());
    const byDay = out.get(s.stageId);
    const prev = byDay.get(day);
    if (!prev || s.startTs < prev.startTs || (s.startTs === prev.startTs && s.id < prev.id)) byDay.set(day, s);
  }
  return out;
}

export function groupBySession(attempts) {
  const map = new Map();
  for (const a of attempts) {
    if (!map.has(a.sessionId)) map.set(a.sessionId, []);
    map.get(a.sessionId).push(a);
  }
  return map;
}
