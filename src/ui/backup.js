import { h, render } from './dom.js';
import { t } from '../i18n/th.js';
import { ctx, go } from './context.js';
import { buildExport, exportFileName, parseImport, planMerge } from '../core/backup.js';
import { shareFile, copyText, pickFile } from '../store/share.js';

export async function backupScreen(root) {
  const { store } = ctx;
  // Prepared now, so the Share tap can call navigator.share directly (iOS needs a direct tap).
  const all = await store.getAll();
  const now = Date.now();
  const text = buildExport(all.attempts, all.sessions, now);
  const name = exportFileName(now);
  const status = h('p', { class: 'status-line', 'aria-live': 'polite' });
  const preview = h('div', {});
  const paste = h('textarea', { rows: '4', placeholder: '{"app":"countingtrainer", ...}' });
  let picking = null;

  const say = (msg, cls = '') => { status.textContent = msg; status.className = `status-line ${cls}`; };

  async function onShare() {
    const r = await shareFile(name, text);
    if (r === 'shared') { await store.setMeta('lastExportTs', now); say('✓'); }
    else if (r === 'unsupported') say(t('backup.shareUnsupported'), 'bad');
  }
  async function onCopy() {
    if (await copyText(text)) { await store.setMeta('lastExportTs', now); say(t('backup.copied'), 'ok'); }
  }
  async function onFile() {
    picking = pickFile();
    cancelBtn.hidden = false;
    const content = await picking.promise;
    cancelBtn.hidden = true;
    picking = null;
    if (content) plan(content);
  }
  const cancelBtn = h('button', { class: 'link', hidden: true, onClick: () => picking?.cancel() }, t('backup.cancel'));

  async function plan(content) {
    const parsed = parseImport(content);
    if (!parsed.ok) { say(t(`backup.error.${parsed.error}`), 'bad'); preview.replaceChildren(); return; }
    const fresh = await store.getAll();
    const p = planMerge(new Set(fresh.attempts.map((a) => a.id)), new Set(fresh.sessions.map((s) => s.id)), parsed.data, Date.now());
    const add = p.toAdd.attempts.length + p.toAdd.sessions.length;
    say('');
    preview.replaceChildren(
      h('p', {}, t('backup.preview', { add, dup: p.duplicates, bad: p.rejected.length })),
      add > 0 ? h('button', { class: 'primary', onClick: async () => {
        await store.addMany(p.toAdd.attempts, p.toAdd.sessions);
        await store.setMeta('lastImportTs', Date.now());
        preview.replaceChildren();
        say(t('backup.result', { add }), 'ok');
      } }, t('backup.confirm')) : null);
  }

  render(root,
    h('header', { class: 'bar' },
      h('button', { class: 'link', onClick: () => go('#/home') }, `‹ ${t('common.back')}`),
      h('span', { class: 'title' }, t('backup.title'))),
    h('section', { class: 'panel' },
      h('button', { class: 'primary', onClick: onShare }, t('backup.share')),
      h('button', { class: 'secondary', onClick: onCopy }, t('backup.copy')),
      status),
    h('section', { class: 'panel' },
      h('button', { class: 'secondary', onClick: onFile }, t('backup.importFile')), cancelBtn,
      paste,
      h('button', { class: 'secondary', onClick: () => plan(paste.value) }, t('backup.importPaste')),
      preview));
}
