import { h } from './dom.js';
import { t } from '../i18n/th.js';

/**
 * On-screen number pad with a ± key (the iPhone numeric keyboard has no minus key).
 * onOk receives an integer string with ASCII minus, e.g. "-3".
 */
export function keypad(onOk) {
  let digits = '';
  let negative = false;
  const display = h('div', { class: 'keypad-display', 'aria-live': 'polite' });
  const okBtn = h('button', { class: 'key ok', onClick: () => { if (digits) onOk(value()); } }, t('drill.ok'));

  function value() {
    const n = digits.replace(/^0+(?=\d)/, '');
    return negative && n !== '0' ? `-${n}` : n;
  }
  function refresh() {
    display.textContent = digits ? value() : (negative ? '-' : '');
    okBtn.disabled = !digits;
  }
  function press(k) {
    if (k === '±') negative = !negative;
    else if (k === '⌫') digits = digits.slice(0, -1);
    else if (digits.length < 3) digits = (digits === '0' ? '' : digits) + k;
    refresh();
  }
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '±', '0', '⌫'];
  const grid = h('div', { class: 'keypad-grid' },
    keys.map((k) => h('button', { class: 'key', onClick: () => press(k) }, k)));
  refresh();
  return h('div', { class: 'keypad' }, display, grid, okBtn);
}
