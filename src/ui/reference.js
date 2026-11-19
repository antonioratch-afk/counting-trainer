import { h } from './dom.js';
import { t } from '../i18n/th.js';
import { ROWS, UPS, collapse } from '../core/chart.js';

/** Reference card, rendered from the same data the grader uses. */
export function reference(stageId, chart) {
  if (stageId !== 'strategy') {
    return h('div', { class: 'reference' },
      h('h3', {}, t('drill.reference')),
      h('table', { class: 'hilo' },
        h('tr', {}, h('th', {}, '2 3 4 5 6'), h('th', {}, '7 8 9'), h('th', {}, '10 J Q K A')),
        h('tr', {}, h('td', {}, '+1'), h('td', {}, '0'), h('td', {}, '-1'))));
  }
  const label = (row) => (row[0] === 'H' ? `H${row.slice(1)}` : row[0] === 'A' ? `A,${row[1]}` : `${row[1]},${row[2]}`.replaceAll('T', '10'));
  return h('div', { class: 'reference' },
    h('h3', {}, t('drill.reference')),
    h('div', { class: 'chart-legend' }, ['H', 'S', 'D', 'P', 'R'].map((a) => h('span', { class: `cell a-${a}` }, `${a} = ${t(`action.${a}`)}`))),
    h('div', { class: 'chart-scroll' },
      h('table', { class: 'chart' },
        h('tr', {}, h('th', {}, ''), UPS.map((u) => h('th', {}, u === 'T' ? '10' : u))),
        ROWS.map((r) => h('tr', {}, h('th', {}, label(r)),
          UPS.map((u) => { const a = collapse(chart.cells[r][u]); return h('td', { class: `cell a-${a}` }, a); }))))));
}
