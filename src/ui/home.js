import { h, render } from './dom.js';
import { t } from '../i18n/th.js';
import { ctx, go } from './context.js';
import { STAGES } from '../core/config.js';
import { computeProgress, droppedPasses, passedList } from '../core/progress.js';
import { sessionStatus, groupBySession } from '../core/session.js';
import { installPanel } from './install.js';
import { BUILD } from '../build.js';

export async function homeScreen(root) {
  const { store, config, chart } = ctx;
  const now = Date.now();
  const { attempts, sessions } = await store.getAll();
  const progress = computeProgress(attempts, sessions, chart, config, now);

  // Pass-drop notice: compare with the last saved pass set, then save the new one.
  const prev = await store.getMeta('lastPassed');
  const next = passedList(progress);
  const dropped = droppedPasses(prev, next);
  await store.setMeta('lastPassed', next);

  // Open sessions that can be resumed (test and review only).
  const bySession = groupBySession(attempts);
  const open = sessions
    .filter((s) => s.mode === 'test' || s.mode === 'review')
    .map((s) => ({ s, st: sessionStatus(s, bySession.get(s.id) || [], now, config) }))
    .filter((x) => x.st.status === 'open')
    .sort((a, b) => b.s.startTs - a.s.startTs);

  const lastExport = await store.getMeta('lastExportTs');
  const notice = ctx.notice;
  ctx.notice = null;

  const offline = { ready: t('home.offlineReady'), pending: t('home.offlinePending'), error: t('home.cacheError'), dev: t('home.devMode') }[ctx.offline];

  const stepCard = (stageId) => {
    const p = progress[stageId];
    const today = !p.todayCounted ? t('home.today.none')
      : p.todayOpen ? t('home.today.open')
        : p.todayPassed ? t('home.today.passed') : t('home.today.failed');
    return h('section', { class: `step ${p.passed ? 'passed' : ''}` },
      h('h2', {}, t(`step.${stageId}`)),
      h('p', { class: 'days' }, p.passed ? t('home.passed') : t('home.days', { n: p.daysCounted, need: config.daysToPass })),
      h('div', { class: 'dots' }, Array.from({ length: config.daysToPass }, (_, i) => h('span', { class: `dot ${i < p.daysCounted ? 'on' : ''}` }))),
      h('p', { class: 'muted' }, today),
      p.lastSession ? h('p', { class: 'muted' }, t('home.last', { pct: p.lastSession.pct })) : null,
      stageId === 'strategy' ? h('p', { class: 'muted' }, t('home.cells', { n: p.cellsCovered, total: p.cellsTotal })) : null,
      h('div', { class: 'buttons' },
        h('button', { class: 'secondary', onClick: () => go(`#/lesson/${stageId}`) }, t('home.lesson')),
        h('button', { class: 'secondary', onClick: () => go(`#/drill/${stageId}/learn`) }, t('home.learn')),
        h('button', { class: 'primary', onClick: () => go(`#/drill/${stageId}/test`) }, t('home.test')),
        h('button', { class: 'secondary', onClick: () => go(`#/drill/${stageId}/review`) }, t('home.review')),
        stageId === 'running' ? h('button', { class: 'secondary', onClick: () => go('#/timed') }, t('home.timed')) : null));
  };

  const backupLine = lastExport
    ? t('home.lastBackup', { n: Math.floor((now - lastExport) / 86400000) })
    : t('home.noBackup');

  render(root,
    h('header', { class: 'bar' }, h('span', { class: 'title' }, t('app.title'))),
    installPanel(),
    ctx.updateWaiting && open.length === 0 ? h('button', { class: 'banner', onClick: applyUpdate }, t('home.update')) : null,
    notice ? h('p', { class: 'banner warn' }, notice) : null,
    dropped.map((s) => h('p', { class: 'banner warn' }, t('home.dropped', { step: t(`step.${s}`) }))),
    attempts.length === 0 ? h('section', { class: 'panel' },
      h('button', { class: 'primary', onClick: () => go('#/lesson/values') }, t('home.start')),
      h('button', { class: 'secondary', onClick: () => go('#/backup') }, t('home.restore'))) : null,
    open.map(({ s, st }) => h('button', { class: 'banner', onClick: () => go(`#/resume/${s.id}`) },
      t('home.resume', { step: t(`step.${s.stageId}`), mode: t(`mode.${s.mode}`), done: st.itemsDone, len: s.length }))),
    STAGES.map(stepCard),
    h('footer', {},
      h('p', { class: `status ${ctx.offline}` }, offline),
      h('p', {}, backupLine),
      h('div', { class: 'buttons' },
        h('button', { class: 'link', onClick: () => go('#/backup') }, t('home.backup')),
        h('button', { class: 'link', onClick: () => go('#/diag') }, t('home.diag'))),
      h('p', { class: 'muted' }, t('app.trainingOnly')),
      h('p', { class: 'muted small' }, t('home.version', { build: BUILD, chart: chart.version, cfg: config.version }))));
}

function applyUpdate() {
  const waiting = ctx.reg?.waiting;
  if (!waiting) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  waiting.postMessage('SKIP_WAITING');
}
