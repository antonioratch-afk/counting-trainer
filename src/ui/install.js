import { h } from './dom.js';
import { t } from '../i18n/th.js';

export function isStandalone() {
  return navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

/** Shown on the home screen when the app runs in a Safari tab instead of from the Home Screen. */
export function installPanel() {
  if (isStandalone()) return null;
  return h('section', { class: 'panel install' },
    h('h3', {}, t('install.title')),
    h('p', {}, t('install.steps')),
    h('p', { class: 'warn' }, t('install.warn')),
    h('p', { class: 'muted' }, t('install.online')));
}
