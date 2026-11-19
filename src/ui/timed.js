import { h, render } from './dom.js';
import { t } from '../i18n/th.js';
import { ctx, newId, go } from './context.js';
import { cardView } from './cardview.js';
import { keypad } from './keypad.js';
import * as timed from '../core/drills/running-timed.js';
import { newSession } from '../core/session.js';

/** Timed full-deck run, saved as its own mode = speed session. Never affects passing. */
export async function timedScreen(root) {
  const { store, config, rng } = ctx;
  let run = null; // { session, item, startTs, shown }

  const bar = () => h('header', { class: 'bar' },
    h('button', { class: 'link', onClick: () => go('#/home') }, `‹ ${t('common.back')}`),
    h('span', { class: 'title' }, t('timed.title')));

  async function history() {
    const { attempts } = await store.getAll();
    return attempts.filter((a) => a.mode === 'speed' && a.outcome === 'answered').sort((a, b) => b.ts - a.ts).slice(0, 10);
  }

  async function intro(message) {
    const last = await history();
    render(root, bar(), h('section', { class: 'panel' },
      message ? h('p', { class: 'feedback bad' }, message) : null,
      h('p', {}, t('timed.hint')),
      h('button', { class: 'primary', onClick: start }, t('timed.start')),
      last.length ? h('div', {}, h('h3', {}, t('timed.history')),
        h('ol', { class: 'history' }, last.map((a) => h('li', {},
          `${(a.ms / 1000).toFixed(1)} s · ${a.correct ? t('drill.right') : t('drill.wrong', { expected: a.expected })}`)))) : null));
  }

  async function start() {
    const session = newSession({ id: newId(), stageId: 'running', mode: 'speed', length: null, nowTs: Date.now() });
    await store.addSession(session);
    run = { session, item: timed.generate(rng, { config }), startTs: null, shown: 0 };
    show();
  }

  function show() {
    const { item } = run;
    if (run.shown < item.cards.length) {
      render(root, bar(), h('section', { class: 'drill' },
        h('div', { class: 'table' }, cardView(item.cards[run.shown], 'big')),
        h('p', { class: 'muted' }, t('drill.cardNo', { n: run.shown + 1 })),
        h('button', { class: 'primary big-tap', onClick: () => {
          if (run.startTs === null) run.startTs = performance.now();
          run.shown++;
          show();
        } }, t('drill.nextCard'))));
      if (run.startTs === null) run.startTs = performance.now();
    } else {
      render(root, bar(), h('section', { class: 'drill' }, h('p', {}, t('drill.done')), keypad(finish)));
    }
  }

  async function save(outcome, given, correct, ms) {
    const r = run;
    run = null;
    await store.addAttempt({
      id: newId(), v: 1, sessionId: r.session.id, stageId: 'running', drillId: timed.drillId, mode: 'speed',
      itemKey: r.item.itemKey, expected: r.item.expected, given, correct, outcome, ms: Math.min(Math.round(ms), 3600000),
      ts: Date.now(), chartVer: '', cfgVer: config.version,
    });
  }

  async function finish(given) {
    const seconds = (performance.now() - run.startTs) / 1000;
    const g = timed.grade(run.item, given, { seconds, targetSec: config.timedTargetSec });
    const expected = run.item.expected;
    await save('answered', given, g.correct, seconds * 1000);
    await intro(null);
    root.querySelector('.panel')?.prepend(
      h('p', { class: `feedback ${g.correct ? 'ok' : 'bad'}` },
        g.correct ? t('drill.right') : t('drill.wrong', { expected })),
      h('p', {}, t('timed.result', { sec: seconds.toFixed(1), target: config.timedTargetSec })));
  }

  // Leaving the app discards the run as voided.
  const onHide = async () => {
    if (document.visibilityState === 'hidden' && run) await save('voided', '', false, 0).then(() => intro(t('timed.discarded')));
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('hashchange', () => document.removeEventListener('visibilitychange', onHide), { once: true });

  await intro(null);
}
