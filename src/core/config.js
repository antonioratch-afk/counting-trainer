export const STAGES = ['values', 'running', 'strategy'];

const isInt = (v) => Number.isInteger(v);

/** @returns {{ ok: boolean, errors: string[] }} */
export function validateConfig(c) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  if (!c || typeof c !== 'object') return { ok: false, errors: ['config: not an object'] };

  need(typeof c.version === 'string' && c.version.length > 0, 'version: must be a non-empty string');
  for (const field of ['itemsPerTest', 'reviewItems', 'thresholdPct']) {
    const obj = c[field];
    if (!obj || typeof obj !== 'object') { errors.push(`${field}: missing`); continue; }
    for (const s of STAGES) {
      const v = obj[s];
      if (!isInt(v)) { errors.push(`${field}.${s}: must be an integer`); continue; }
      if (field === 'thresholdPct') need(v >= 50 && v <= 100, `${field}.${s}: must be 50 to 100`);
      else need(v >= 1 && v <= 500, `${field}.${s}: must be 1 to 500`);
    }
  }
  const ints = ['daysToPass', 'stopMin', 'stopMax', 'timedRemovedMin', 'timedRemovedMax',
    'timedTargetSec', 'abandonAfterMin', 'dayOffsetHours'];
  for (const f of ints) need(isInt(c[f]), `${f}: must be an integer`);
  if (errors.length) return { ok: false, errors };

  need(c.daysToPass >= 1 && c.daysToPass <= 30, 'daysToPass: must be 1 to 30');
  need(c.stopMin >= 1, 'stopMin: must be at least 1');
  need(c.stopMin < c.stopMax, 'stopMin: must be less than stopMax');
  need(c.stopMax <= 312, 'stopMax: must be at most 312');
  need(c.timedRemovedMin >= 0, 'timedRemovedMin: must be at least 0');
  need(c.timedRemovedMin <= c.timedRemovedMax, 'timedRemovedMin: must not exceed timedRemovedMax');
  need(c.timedRemovedMax < 52, 'timedRemovedMax: must be less than 52');
  need(c.timedTargetSec >= 1, 'timedTargetSec: must be at least 1');
  need(c.abandonAfterMin >= 1, 'abandonAfterMin: must be at least 1');
  need(c.dayOffsetHours >= -12 && c.dayOffsetHours <= 14, 'dayOffsetHours: must be -12 to 14');
  return { ok: errors.length === 0, errors };
}
