// Shared app state, filled by app.js at start-up.
export const ctx = {
  store: null,      // Store from src/store/db.js
  config: null,
  chart: null,
  rng: null,
  reg: null,        // ServiceWorkerRegistration
  offline: 'pending', // 'pending' | 'ready' | 'error' | 'dev'
  updateWaiting: false,
  notice: null,     // one-time message for the next screen
  activeSessionId: null,
  onPendingRecovered: null, // set by the drill screen
  startupMs: null,
};

export function newId() {
  return crypto.randomUUID();
}

export function go(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}
