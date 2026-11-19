// Writes an import file with generated practice history, for the iPhone start-up check.
// Usage: node tools/gen-attempts.mjs --count 20000 --seed 1 --out gen.json
import { writeFileSync } from 'node:fs';
import { generate } from '../tests/helpers/gen.js';
import { buildExport } from '../src/core/backup.js';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};

const count = Number(arg('count', '20000'));
const seed = Number(arg('seed', '1'));
const out = arg('out', 'gen.json');
const { sessions, attempts } = generate(count, seed);
writeFileSync(out, buildExport(attempts, sessions, Date.now()));
console.log(`wrote ${attempts.length} attempts in ${sessions.length} sessions to ${out}`);
