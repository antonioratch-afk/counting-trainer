import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, statSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stamp, APP_FILES } from '../tools/stamp.mjs';
import { TH } from '../src/i18n/th.js';
import { ROOT } from './helpers/load.js';

test('stamp: works without git; FILES lists ./ and ./index.html; source unchanged', () => {
  const src = mkdtempSync(join(tmpdir(), 'ct-src-'));
  for (const f of APP_FILES) cpSync(join(ROOT, f), join(src, f), { recursive: true });
  const before = readFileSync(join(src, 'sw.js'), 'utf8');
  const out = join(src, '_site');
  const r = stamp(src, out);
  assert.match(r.id, /^local-\d{12}$/);
  assert.ok(r.files.includes('./'));
  assert.ok(r.files.includes('./index.html'));
  assert.ok(!r.files.includes('./sw.js'));
  for (const f of r.files) {
    assert.ok(!f.startsWith('/'), f);
    if (f !== './') assert.ok(existsSync(join(out, f)), f);
  }
  const sw = readFileSync(join(out, 'sw.js'), 'utf8');
  assert.ok(sw.includes(`const BUILD = '${r.id}';`));
  assert.ok(sw.includes('"./index.html"'));
  assert.ok(readFileSync(join(out, 'src', 'build.js'), 'utf8').includes(r.id));
  assert.equal(readFileSync(join(src, 'sw.js'), 'utf8'), before);
});

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('i18n: every t(\'key\') used in src exists in th.js; no keys are built at run time', () => {
  const missing = [];
  for (const file of walk(join(ROOT, 'src')).filter((f) => f.endsWith('.js'))) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\bt\('([a-z0-9_.-]+)'/g)) if (!(m[1] in TH)) missing.push(`${file}: ${m[1]}`);
  }
  assert.deepEqual(missing, []);
  // Keys built from known lists (step.*, mode.*, action.*, backup.error.*) must all exist.
  for (const s of ['values', 'running', 'strategy']) assert.ok(`step.${s}` in TH);
  for (const m of ['learn', 'test', 'review']) assert.ok(`mode.${m}` in TH);
  for (const a of ['H', 'S', 'D', 'P', 'R']) assert.ok(`action.${a}` in TH);
  for (const e of ['empty', 'too-large', 'not-json', 'wrong-app', 'wrong-schema', 'newer-schema']) assert.ok(`backup.error.${e}` in TH);
});
