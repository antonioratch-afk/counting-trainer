// IndexedDB adapter. attempts and sessions rows are written once and never updated.
export const DB_NAME = 'countingtrainer';
export const DB_VERSION = 1;

function req(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('transaction aborted'));
  });
}

/** Rejects with a VersionError when the stored database is newer than this build. */
export function openDb() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = (e) => {
      const db = r.result;
      if (e.oldVersion < 1) {
        const attempts = db.createObjectStore('attempts', { keyPath: 'id' });
        attempts.createIndex('sessionId', 'sessionId');
        attempts.createIndex('stageMode', ['stageId', 'mode']);
        attempts.createIndex('itemTs', ['itemKey', 'ts']);
        db.createObjectStore('sessions', { keyPath: 'id' });
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    r.onsuccess = () => resolve(new Store(r.result));
    r.onerror = () => reject(r.error);
  });
}

export class Store {
  constructor(db) { this.db = db; }

  addSession(session) {
    const tx = this.db.transaction('sessions', 'readwrite');
    tx.objectStore('sessions').add(session);
    return done(tx);
  }

  /** Uses add(), so a second write with the same id fails; that failure is ignored. */
  async addAttempt(attempt) {
    const tx = this.db.transaction('attempts', 'readwrite');
    const r = tx.objectStore('attempts').add(attempt);
    r.onerror = (e) => { if (r.error?.name === 'ConstraintError') { e.preventDefault(); } };
    try { await done(tx); return true; } catch (err) {
      if (err?.name === 'ConstraintError') return false;
      throw err;
    }
  }

  async getAll() {
    const tx = this.db.transaction(['attempts', 'sessions'], 'readonly');
    const [attempts, sessions] = await Promise.all([
      req(tx.objectStore('attempts').getAll()),
      req(tx.objectStore('sessions').getAll()),
    ]);
    return { attempts, sessions };
  }

  async getSession(id) {
    const tx = this.db.transaction(['attempts', 'sessions'], 'readonly');
    const [session, attempts] = await Promise.all([
      req(tx.objectStore('sessions').get(id)),
      req(tx.objectStore('attempts').index('sessionId').getAll(id)),
    ]);
    return { session, attempts };
  }

  /** One transaction for an import. */
  addMany(attempts, sessions) {
    const tx = this.db.transaction(['attempts', 'sessions'], 'readwrite');
    for (const s of sessions) tx.objectStore('sessions').add(s);
    for (const a of attempts) tx.objectStore('attempts').add(a);
    return done(tx);
  }

  async getMeta(key) {
    const tx = this.db.transaction('meta', 'readonly');
    const row = await req(tx.objectStore('meta').get(key));
    return row ? row.value : undefined;
  }

  setMeta(key, value) {
    const tx = this.db.transaction('meta', 'readwrite');
    if (value === undefined) tx.objectStore('meta').delete(key);
    else tx.objectStore('meta').put({ key, value });
    return done(tx);
  }

  async logError(err) {
    try {
      const list = (await this.getMeta('errors')) || [];
      list.push({ ts: Date.now(), message: String(err?.stack || err?.message || err).slice(0, 500) });
      await this.setMeta('errors', list.slice(-20));
    } catch { /* logging must never throw */ }
  }

  /** Calls navigator.storage.persist() only where it exists. */
  async requestPersist() {
    let result = 'unsupported';
    if (navigator.storage?.persist) {
      try { result = (await navigator.storage.persist()) ? 'granted' : 'denied'; } catch { result = 'denied'; }
    }
    await this.setMeta('persistResult', result);
    return result;
  }

  async counts() {
    const tx = this.db.transaction(['attempts', 'sessions'], 'readonly');
    const [a, s] = await Promise.all([
      req(tx.objectStore('attempts').count()),
      req(tx.objectStore('sessions').count()),
    ]);
    return { attempts: a, sessions: s };
  }
}
