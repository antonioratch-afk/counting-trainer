import { h, render } from './dom.js';
import { t } from '../i18n/th.js';
import { LESSONS } from '../i18n/lessons.th.js';
import { reference } from './reference.js';
import { ctx, go } from './context.js';

export function lessonScreen(root, stageId) {
  const lesson = LESSONS[stageId];
  render(root,
    h('header', { class: 'bar' }, h('button', { class: 'link', onClick: () => go('#/home') }, `‹ ${t('common.back')}`)),
    h('article', { class: 'lesson' },
      h('h2', {}, lesson.title),
      lesson.paragraphs.map((p) => h('p', {}, p)),
      reference(stageId, ctx.chart),
      h('button', { class: 'primary', onClick: () => go(`#/drill/${stageId}/learn`) }, t('drill.toLearn'))));
}
