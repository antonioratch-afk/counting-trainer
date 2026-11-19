// Copies the app files to an output folder and writes the build ID and file list into
// out/sw.js and out/src/build.js. Committed files are never changed.
// Usage: node tools/stamp.mjs --src . --out _site
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const APP_FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'icons', 'styles', 'src', 'data'];

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function utcStamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
}

function buildId(src) {
  try {
    const hash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: src, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
    if (hash) return `${hash}-${utcStamp()}`;
  } catch { /* no git */ }
  return `local-${utcStamp()}`;
}

function replaceLine(file, prefix, line) {
  const text = readFileSync(file, 'utf8');
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*// @stamp$`, 'm');
  if (!re.test(text)) throw new Error(`${file}: placeholder "${prefix}" not found`);
  writeFileSync(file, text.replace(re, `${line} // @stamp`));
}

export function stamp(src, out) {
  src = resolve(src);
  out = resolve(out);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const f of APP_FILES) {
    if (!existsSync(join(src, f))) throw new Error(`missing app file: ${f}`);
    cpSync(join(src, f), join(out, f), { recursive: true });
  }

  // Every file referenced by index.html must exist.
  const html = readFileSync(join(out, 'index.html'), 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^[a-z]+:/i.test(m[1])) continue;
    if (!existsSync(join(out, m[1]))) throw new Error(`index.html references a missing file: ${m[1]}`);
  }

  const files = walk(out)
    .map((p) => `./${relative(out, p).split('\\').join('/')}`)
    .filter((p) => p !== './sw.js')
    .sort();
  const list = ['./', ...files];
  const id = buildId(src);
  replaceLine(join(out, 'sw.js'), 'const BUILD =', `const BUILD = '${id}';`);
  replaceLine(join(out, 'sw.js'), 'const FILES =', `const FILES = ${JSON.stringify(list)};`);
  replaceLine(join(out, 'src', 'build.js'), 'export const BUILD =', `export const BUILD = '${id}';`);
  replaceLine(join(out, 'src', 'build.js'), 'export const FILES =', `export const FILES = ${JSON.stringify(list)};`);
  return { id, files: list };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const r = stamp(arg('src', '.'), arg('out', '_site'));
    console.log(`stamped ${r.id}: ${r.files.length} files`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
