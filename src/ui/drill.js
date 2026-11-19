import { h, render } from './dom.js';
import { t } from '../i18n/th.js';
import { ctx, newId, go } from './context.js';
import { cardView } from './cardview.js';
import { keypad } from './keypad.js';
import { reference } from './reference.js';
import { drillFor } from '../core/drills/index.js';
import { pickReview } from '../core/review.js';
import { newSession, plannedLength, sessionStatus, countedSessions } from '../core/session.js';
import { coveredCells, meetsBar } from '../core/progress.js';
import { tag, formatTag } from '../core/hilo.js';

const STRATEGY_BUTTONS = ['H', 'S', 'D', 'P', 'R'];

function expectedLabel(stageId, expected) {
  return stageId === 'strategy' ? t(`action.${expected}`) : expected;
}

/**
 * One runner for every drill in learn, test and review modes.
 * resumeId: continue an open session instead of starting a new one.
 */
export async function drillScreen(root, stageId, mode, resumeId) {
  const { store, config, chart, rng } = ctx;
  const all = await store.getAll();
  let session;
  let sessionAttempts = [];
  let keys = null;

  if (resumeId) {
    session = all.sessions.find((s) => s.id === resumeId);
    if (!session) { go('#/home'); return; }
    stageId = session.stageId;
    mode = session.mode;
    sessionAttempts = all.attempts.filter((a) => a.sessionId === session.id);
  }
  const drill = drillFor(stageId);

  if (mode === 'review' && stageId !== 'running') {
    keys = pickReview(all.attempts, stageId, config.reviewItems[stageId]);
    if (!resumeId && keys.length === 0) {
      render(root,
        h('header', { class: 'bar' }, h('button', { class: 'link', onClick: () => go('#/home') }, `‹ ${t('common.back')}`)),
        h('section', { class: 'panel' }, h('p', {}, t('drill.noReview')),
          h('button', { class: 'primary', onClick: () => go(`#/drill/${stageId}/learn`) }, t('drill.toLearn'))));
      return;
    }
  }

  if (!session) {
    const reviewCount = mode === 'review' ? (keys ? keys.length : config.reviewItems[stageId]) : undefined;
    session = newSession({ id: newId(), stageId, mode, length: plannedLength(stageId, mode, config, reviewCount), nowTs: Date.now() });
    await store.addSession(session);
  }

  const covered = coveredCells(all.attempts);
  const asked = new Set(sessionAttempts.filter((a) => a.stageId === 'strategy').map((a) => a.itemKey.slice(9)));
  let current = null; // { item, attemptId, shownTs }
  let showReference = false;

  ctx.activeSessionId = session.id;
  ctx.onPendingRecovered = (r) => {
    if (!current || r.pending.attemptId !== current.attemptId) return;
    sessionAttempts.push(r.attempt);
    const item = current.item;
    current = null;
    feedback(item, null, r.attempt.outcome === 'missed' ? t('drill.leftApp') : t('drill.leftAppVoid'));
  };

  const done = () => sessionAttempts.filter((a) => a.outcome !== 'voided').length;

  function header() {
    const len = session.length;
    return h('header', { class: 'bar' },
      h('button', { class: 'link', onClick: leave }, `‹ ${t('common.back')}`),
      h('span', { class: 'title' }, `${t(`step.${stageId}`)} · ${t(`mode.${mode}`)}`),
      len != null ? h('span', { class: 'count' }, t('drill.progress', { done: done(), len })) : null);
  }

  async function leave() {
    // Leaving mid-question follows the same rule as leaving the app.
    go('#/home');
  }

  function shell(...body) {
    render(root, header(),
      mode === 'test' && done() === 0 ? h('p', { class: 'note' }, t('drill.testNote')) : null,
      h('section', { class: 'drill' }, ...body),
      mode === 'learn' ? h('div', { class: 'learn-tools' },
        h('button', { class: 'secondary', onClick: () => { showReference = !showReference; redraw(); } }, t('drill.reference')),
        h('button', { class: 'secondary', onClick: finishLearn }, t('drill.finish'))) : null,
      mode === 'learn' && showReference ? reference(stageId, chart) : null);
  }
  let redraw = () => {};

  async function next() {
    if (session.length != null && done() >= session.length) { await finish(); return; }
    const dctx = { config, chart, covered, asked };
    let item;
    if (keys && keys.length) item = drill.itemFromKey(keys[done() % keys.length], rng, dctx);
    else item = drill.generate(rng, dctx);
    current = { item, attemptId: newId(), shownTs: Date.now() };
    await store.setMeta('pendingItem', {
      attemptId: current.attemptId, sessionId: session.id, stageId, drillId: drill.drillId, mode,
      itemKey: item.itemKey, expected: item.expected, shownTs: current.shownTs,
      chartVer: stageId === 'strategy' ? chart.version : '', cfgVer: config.version,
    });
    if (stageId === 'running') showRun(item, 0);
    else showQuestion(item);
  }

  function showQuestion(item) {
    redraw = () => showQuestion(item);
    if (stageId === 'values') {
      shell(h('div', { class: 'table' }, cardView(item.cards[0], 'big')),
        h('div', { class: 'answers three' }, ['+1', '0', '-1'].map((v) =>
          h('button', { class: 'answer', onClick: () => answer(v) }, v))));
    } else {
      shell(
        h('div', { class: 'table' },
          h('div', { class: 'hand' }, h('span', { class: 'label' }, t('drill.dealer')), cardView(item.dealer)),
          h('div', { class: 'hand' }, h('span', { class: 'label' }, t('drill.you')), item.cards.map((c) => cardView(c)))),
        h('div', { class: 'answers five' }, STRATEGY_BUTTONS.map((a) =>
          h('button', { class: `answer a-${a}`, onClick: () => answer(a) }, t(`action.${a}`)))));
    }
  }

  function showRun(item, shown) {
    redraw = () => showRun(item, shown);
    if (shown < item.cards.length) {
      const c = item.cards[shown];
      const total = item.cards.slice(0, shown + 1).reduce((s, x) => s + tag(x.rank), 0);
      shell(h('div', { class: 'table' }, cardView(c, 'big')),
        h('p', { class: 'muted' }, t('drill.cardNo', { n: shown + 1 })),
        mode === 'learn' ? h('p', { class: 'learn-count' }, `${formatTag(tag(c.rank))} → ${t('drill.running', { n: formatTag(total) })}`) : null,
        h('button', { class: 'primary big-tap', onClick: () => showRun(item, shown + 1) }, t('drill.nextCard')));
    } else {
      shell(h('p', {}, t('drill.done')), keypad((v) => answer(v)));
    }
  }

  async function answer(given) {
    if (!current) return;
    const { item, attemptId, shownTs } = current;
    current = null;
    const now = Date.now();
    const g = drill.grade(item, given);
    const attempt = {
      id: attemptId, v: 1, sessionId: session.id, stageId, drillId: drill.drillId, mode, itemKey: item.itemKey,
      expected: item.expected, given, correct: g.correct, outcome: 'answered', ms: Math.min(now - shownTs, 3600000),
      ts: now, chartVer: stageId === 'strategy' ? chart.version : '', cfgVer: config.version,
    };
    const written = await store.addAttempt(attempt);
    await store.setMeta('pendingItem', undefined);
    if (!written) return; // already recorded by recovery
    sessionAttempts.push(attempt);
    if (stageId === 'strategy') {
      asked.add(item.cellKey);
      if (mode === 'test' && g.correct) covered.add(item.cellKey);
    }
    feedback(item, g.correct);
  }

  function feedback(item, correct, notice) {
    redraw = () => feedback(item, correct, notice);
    const msg = notice || (correct ? t('drill.right') : t('drill.wrong', { expected: expectedLabel(stageId, item.expected) }));
    shell(
      stageId === 'strategy' ? h('div', { class: 'table small' },
        h('div', { class: 'hand' }, cardView(item.dealer)), h('div', { class: 'hand' }, item.cards.map((c) => cardView(c)))) : null,
      h('p', { class: `feedback ${correct ? 'ok' : 'bad'}` }, msg),
      notice ? h('p', { class: 'muted' }, t('drill.wrong', { expected: expectedLabel(stageId, item.expected) })) : null,
      h('button', { class: 'primary', onClick: next }, t('drill.next')));
  }

  async function finishLearn() {
    await store.setMeta('pendingItem', undefined);
    current = null;
    cleanup();
    go('#/home');
  }

  function cleanup() {
    ctx.activeSessionId = null;
    ctx.onPendingRecovered = null;
  }

  async function finish() {
    cleanup();
    const fresh = await store.getAll();
    const st = sessionStatus(session, sessionAttempts, Date.now(), config);
    const total = st.itemsDone;
    const pct = total ? Math.round((st.correct / total) * 1000) / 10 : 0;
    let extra = [];
    if (mode === 'test') {
      const threshold = config.thresholdPct[stageId];
      const met = meetsBar(st.correct, total, threshold);
      const counted = countedSessions(fresh.sessions, config).get(stageId)?.get(st.dayKey)?.id === session.id;
      extra = [
        h('p', { class: `feedback ${met ? 'ok' : 'bad'}` }, met ? t('drill.metBar', { pct: threshold }) : t('drill.missedBar', { pct: threshold })),
        h('p', {}, counted ? t('drill.counted') : t('drill.notCounted')),
      ];
    }
    if ((await store.getMeta('persistResult')) === undefined) await store.requestPersist();
    render(root,
      h('header', { class: 'bar' }, h('span', { class: 'title' }, `${t(`step.${stageId}`)} · ${t(`mode.${mode}`)}`)),
      h('section', { class: 'panel' },
        h('h2', {}, t('drill.result', { correct: st.correct, total, pct })),
        ...extra,
        h('button', { class: 'primary', onClick: () => go('#/home') }, t('drill.home')),
        h('button', { class: 'secondary', onClick: () => go('#/backup') }, t('drill.export'))));
  }

  await next();
}
