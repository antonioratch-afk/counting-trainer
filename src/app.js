import { h, render } from './ui/dom.js';
import { t } from './i18n/th.js';
import { ctx } from './ui/context.js';
import { openDb } from './store/db.js';
import { makeRng } from './core/rng.js';
import { validateConfig } from './core/config.js';
import { validateChart } from './core/chart.js';
import { FILES, BUILD } from './build.js';
import { homeScreen } from './ui/home.js';
import { lessonScreen } from './ui/lesson.js';
import { drillScreen } from './ui/drill.js';
import { timedScreen } from './ui/timed.js';
import { backupScreen } from './ui/backup.js';
import { diagScreen } from './ui/diag.js';

const root = document.getElementById('app');
const STEPS = ['values', 'running', 'strategy'];
const MODES = ['learn', 'test', 'review'];

function fatal(message, detail) {
  render(root, h('section', { class: 'panel fatal' }, h('h2', {}, t('error.title')), h('p', {}, message),
    detail ? h('pre', { class: 'errors' }, detail) : null));
}

window.addEventListener('error', (e) => ctx.store?.logError(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => ctx.store?.logError(e.reason));

/**
 * A question that was on screen when the app was hidden, closed or left is written as
 * missed (test) or voided (learn, review). Called on launch, on return to the foreground,
 * and when leaving a drill screen.
 */
async function recoverPending() {
  const p = await ctx.store.getMeta('pendingItem');
  if (!p) return;
  const outcome = p.mode === 'test' ? 'missed' : 'voided';
  const now = Date.now();
  const attempt = {
    id: p.attemptId, v: 1, sessionId: p.sessionId, stageId: p.stageId, drillId: p.drillId, mode: p.mode,
    itemKey: p.itemKey, expected: p.expected, given: '', correct: false, outcome,
    ms: Math.max(0, Math.min(now - p.shownTs, 3600000)), ts: now, chartVer: p.chartVer, cfgVer: p.cfgVer,
  };
  await ctx.store.addAttempt(attempt);
  await ctx.store.setMeta('pendingItem', undefined);
  const r = { pending: p, attempt };
  if (ctx.onPendingRecovered && ctx.activeSessionId === p.sessionId) ctx.onPendingRecovered(r);
  else ctx.notice = outcome === 'missed' ? t('drill.leftApp') : t('drill.leftAppVoid');
}

let currentRoute = '';
async function route() {
  const hash = location.hash || '#/home';
  const parts = hash.slice(2).split('/');
  const leavingDrill = currentRoute.startsWith('#/drill/') || currentRoute.startsWith('#/resume/');
  if (leavingDrill && hash !== currentRoute) {
    ctx.onPendingRecovered = null;
    ctx.activeSessionId = null;
    await recoverPending();
  }
  currentRoute = hash;
  window.scrollTo(0, 0);
  try {
    if (parts[0] === 'lesson' && STEPS.includes(parts[1])) return lessonScreen(root, parts[1]);
    if (parts[0] === 'drill' && STEPS.includes(parts[1]) && MODES.includes(parts[2])) return await drillScreen(root, parts[1], parts[2]);
    if (parts[0] === 'resume' && parts[1]) return await drillScreen(root, null, null, parts[1]);
    if (parts[0] === 'timed') return await timedScreen(root);
    if (parts[0] === 'backup') return await backupScreen(root);
    if (parts[0] === 'diag') return await diagScreen(root);
    if (hash !== '#/home') { location.replace('#/home'); return; }
    return await homeScreen(root);
  } catch (err) {
    ctx.store?.logError(err);
    fatal(String(err?.message || err));
  }
}

async function checkOffline() {
  try {
    const keys = await caches.keys();
    const name = keys.find((k) => k === `countingtrainer-${BUILD}`);
    if (!name) return;
    const cache = await caches.open(name);
    const have = await Promise.all(FILES.map((f) => cache.match(new URL(f, location.href).href, { ignoreSearch: true })));
    ctx.offline = have.every(Boolean) ? 'ready' : 'pending';
  } catch { /* stays pending */ }
}

async function registerWorker() {
  if (!('serviceWorker' in navigator) || BUILD === 'dev') return;
  try {
    ctx.reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    const watch = (w) => w && w.addEventListener('statechange', () => {
      if (w.state === 'redundant' && !navigator.serviceWorker.controller) { ctx.offline = 'error'; }
      if (w.state === 'activated') checkOffline().then(() => { if (currentRoute === '#/home') route(); });
      if (w.state === 'installed' && navigator.serviceWorker.controller) { ctx.updateWaiting = true; if (currentRoute === '#/home') route(); }
    });
    watch(ctx.reg.installing);
    ctx.reg.addEventListener('updatefound', () => watch(ctx.reg.installing));
    if (ctx.reg.waiting && navigator.serviceWorker.controller) ctx.updateWaiting = true;
    await checkOffline();
  } catch (err) {
    ctx.offline = 'error';
    ctx.store?.logError(err);
  }
}

async function boot() {
  try {
    ctx.store = await openDb();
  } catch (err) {
    if (err?.name === 'VersionError') return fatal(t('error.newerDb'));
    return fatal(t('error.noDb'), String(err?.message || err));
  }
  try {
    const [config, chart] = await Promise.all([
      fetch('./data/config.json').then((r) => r.json()),
      fetch('./data/chart-6d-s17-das-ls.json').then((r) => r.json()),
    ]);
    const vc = validateConfig(config);
    const vh = validateChart(chart);
    if (!vc.ok || !vh.ok) return fatal(t('error.config'), [...vc.errors, ...vh.errors].join('\n'));
    ctx.config = config;
    ctx.chart = chart;
  } catch (err) {
    return fatal(t('error.config'), String(err?.message || err));
  }
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  ctx.rng = makeRng(seed);
  if ((await ctx.store.getMeta('installTs')) === undefined) await ctx.store.setMeta('installTs', Date.now());
  await recoverPending();

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    await recoverPending();
    ctx.reg?.update().catch(() => {});
  });
  window.addEventListener('hashchange', route);

  if (BUILD === 'dev') ctx.offline = 'dev';
  registerWorker();
  await route();
  ctx.startupMs = performance.now();
}

boot();
