import { dayKey } from './daykey.js';

export const APP = 'countingtrainer';
export const SCHEMA = 1;
export const MAX_BYTES = 20 * 1024 * 1024;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIN_TS = Date.UTC(2026, 0, 1);
const DRILL_STAGE = {
  'values.single': 'values',
  'running.stop': 'running',
  'running.timed': 'running',
  'strategy.cell': 'strategy',
};
const ATTEMPT_FIELDS = ['id', 'v', 'sessionId', 'stageId', 'drillId', 'mode', 'itemKey', 'expected',
  'given', 'correct', 'outcome', 'ms', 'ts', 'chartVer', 'cfgVer'];
const SESSION_FIELDS = ['id', 'stageId', 'mode', 'startTs', 'length'];

export function buildExport(attempts, sessions, nowTs) {
  return JSON.stringify({ app: APP, schema: SCHEMA, exportedTs: nowTs, attempts, sessions });
}

export function exportFileName(nowTs) {
  return `counting-trainer-${dayKey(nowTs, 7).replaceAll('-', '')}.json`;
}

/** @returns {{ ok: boolean, error?: string, data?: { attempts: object[], sessions: object[] } }} */
export function parseImport(text) {
  if (typeof text !== 'string' || text.length === 0) return { ok: false, error: 'empty' };
  if (text.length > MAX_BYTES) return { ok: false, error: 'too-large' };
  let obj;
  try { obj = JSON.parse(text); } catch { return { ok: false, error: 'not-json' }; }
  if (!obj || obj.app !== APP) return { ok: false, error: 'wrong-app' };
  if (typeof obj.schema !== 'number') return { ok: false, error: 'not-json' };
  if (obj.schema > SCHEMA) return { ok: false, error: 'newer-schema' };
  if (obj.schema !== SCHEMA) return { ok: false, error: 'wrong-schema' };
  if (!Array.isArray(obj.attempts) || !Array.isArray(obj.sessions)) return { ok: false, error: 'not-json' };
  return { ok: true, data: { attempts: obj.attempts, sessions: obj.sessions } };
}

const shortStr = (v) => typeof v === 'string' && v.length <= 200;
const inTsRange = (v, nowTs) => Number.isFinite(v) && v >= MIN_TS && v <= nowTs + 86400000;

function unknownFields(obj, allowed) {
  return Object.keys(obj).filter((k) => !allowed.includes(k));
}

export function sessionError(s, nowTs) {
  if (!s || typeof s !== 'object') return 'not-object';
  const extra = unknownFields(s, SESSION_FIELDS);
  if (extra.length) return `unknown-field:${extra[0]}`;
  if (!UUID_RE.test(s.id)) return 'id';
  if (!['values', 'running', 'strategy'].includes(s.stageId)) return 'stageId';
  if (!['learn', 'test', 'review', 'speed'].includes(s.mode)) return 'mode';
  if (s.mode === 'speed' && s.stageId !== 'running') return 'mode';
  if (!inTsRange(s.startTs, nowTs)) return 'startTs';
  if (!(s.length === null || (Number.isInteger(s.length) && s.length >= 1 && s.length <= 500))) return 'length';
  return null;
}

export function attemptError(a, nowTs) {
  if (!a || typeof a !== 'object') return 'not-object';
  const extra = unknownFields(a, ATTEMPT_FIELDS);
  if (extra.length) return `unknown-field:${extra[0]}`;
  if (!UUID_RE.test(a.id)) return 'id';
  if (!UUID_RE.test(a.sessionId)) return 'sessionId';
  if (a.v !== 1) return 'v';
  if (!['values', 'running', 'strategy'].includes(a.stageId)) return 'stageId';
  if (DRILL_STAGE[a.drillId] !== a.stageId) return 'drillId';
  if (!['learn', 'test', 'review', 'speed'].includes(a.mode)) return 'mode';
  if ((a.mode === 'speed') !== (a.drillId === 'running.timed')) return 'mode';
  if (!['answered', 'missed', 'voided'].includes(a.outcome)) return 'outcome';
  if (typeof a.correct !== 'boolean') return 'correct';
  if (a.outcome !== 'answered' && (a.correct || a.given !== '')) return 'outcome';
  for (const f of ['itemKey', 'expected', 'given', 'chartVer', 'cfgVer']) if (!shortStr(a[f])) return f;
  if (!(Number.isFinite(a.ms) && a.ms >= 0 && a.ms <= 3600000)) return 'ms';
  if (!inTsRange(a.ts, nowTs)) return 'ts';
  return null;
}

/**
 * Plans an import. Rows never change, so a record whose id already exists is skipped as a duplicate.
 * A rejected session rejects its attempts; an attempt whose session is in neither the file nor the
 * database is rejected.
 */
export function planMerge(existingAttemptIds, existingSessionIds, data, nowTs) {
  const toAdd = { attempts: [], sessions: [] };
  const rejected = [];
  let duplicates = 0;
  const acceptedSessions = new Set();
  const rejectedSessions = new Set();

  for (const s of data.sessions) {
    const err = sessionError(s, nowTs);
    if (err) { rejected.push({ id: s?.id ?? null, reason: `session:${err}` }); if (s?.id) rejectedSessions.add(s.id); continue; }
    if (existingSessionIds.has(s.id)) { duplicates++; acceptedSessions.add(s.id); continue; }
    if (acceptedSessions.has(s.id)) { duplicates++; continue; }
    acceptedSessions.add(s.id);
    toAdd.sessions.push(s);
  }
  const seenAttempts = new Set();
  for (const a of data.attempts) {
    const err = attemptError(a, nowTs);
    if (err) { rejected.push({ id: a?.id ?? null, reason: `attempt:${err}` }); continue; }
    if (rejectedSessions.has(a.sessionId)) { rejected.push({ id: a.id, reason: 'attempt:session-rejected' }); continue; }
    if (!acceptedSessions.has(a.sessionId) && !existingSessionIds.has(a.sessionId)) {
      rejected.push({ id: a.id, reason: 'attempt:unknown-session' });
      continue;
    }
    if (existingAttemptIds.has(a.id) || seenAttempts.has(a.id)) { duplicates++; continue; }
    seenAttempts.add(a.id);
    toAdd.attempts.push(a);
  }
  return { toAdd, duplicates, rejected };
}
