import { h, render } from './dom.js';
import { t } from '../i18n/th.js';
import { ctx, go } from './context.js';
import { copyText } from '../store/share.js';
import { BUILD } from '../build.js';
import { DB_VERSION } from '../store/db.js';
import { isStandalone } from './install.js';

export async function diagScreen(root) {
  const { store, config, chart } = ctx;
  const counts = await store.counts();
  let persisted = 'not supported';
  let estimate = 'not supported';
  if (navigator.storage?.persisted) persisted = String(await navigator.storage.persisted());
  if (navigator.storage?.estimate) {
    const e = await navigator.storage.estimate();
    estimate = `${Math.round((e.usage || 0) / 1024)} KB / ${Math.round((e.quota || 0) / 1048576)} MB`;
  }
  const fmt = (ts) => (ts ? new Date(ts).toISOString() : '-');
  const rows = [
    ['build', BUILD],
    ['chart', chart.version],
    ['config', config.version],
    ['schema', DB_VERSION],
    ['standalone', isStandalone()],
    ['service worker', navigator.serviceWorker?.controller ? 'active' : 'none'],
    ['offline', ctx.offline],
    ['persist()', (await store.getMeta('persistResult')) ?? '-'],
    ['persisted()', persisted],
    ['estimate()', estimate],
    ['attempts', counts.attempts],
    ['sessions', counts.sessions],
    ['last export', fmt(await store.getMeta('lastExportTs'))],
    ['last import', fmt(await store.getMeta('lastImportTs'))],
    ['start-up ms', ctx.startupMs == null ? '-' : Math.round(ctx.startupMs)],
  ];
  const errors = (await store.getMeta('errors')) || [];
  const textAll = [...rows.map(([k, v]) => `${k}: ${v}`), '', ...errors.map((e) => `${fmt(e.ts)} ${e.message}`)].join('\n');

  render(root,
    h('header', { class: 'bar' },
      h('button', { class: 'link', onClick: () => go('#/home') }, `‹ ${t('common.back')}`),
      h('span', { class: 'title' }, t('diag.title'))),
    h('section', { class: 'panel' },
      h('table', { class: 'diag' }, rows.map(([k, v]) => h('tr', {}, h('th', {}, k), h('td', {}, String(v))))),
      errors.length ? h('pre', { class: 'errors' }, errors.map((e) => `${fmt(e.ts)} ${e.message}`).join('\n')) : null,
      h('button', { class: 'secondary', onClick: () => copyText(textAll) }, t('diag.copy'))));
}
