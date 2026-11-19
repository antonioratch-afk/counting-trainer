import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

export function exists(rel) {
  return existsSync(join(ROOT, rel));
}

export const config = () => loadJson('data/config.json');
export const chart = () => loadJson('data/chart-6d-s17-das-ls.json');

/** Bangkok wall-clock time to UTC ms. */
export function bkk(y, m, d, hh = 12, mm = 0) {
  return Date.UTC(y, m - 1, d, hh - 7, mm);
}
