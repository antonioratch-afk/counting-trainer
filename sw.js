// Service worker. BUILD and FILES are written by tools/stamp.mjs at deploy.
const BUILD = 'dev'; // @stamp
const FILES = []; // @stamp
const CACHE = `countingtrainer-${BUILD}`;

self.addEventListener('install', (event) => {
  // Any failed fetch rejects and fails the install.
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(FILES.map(async (f) => {
    const res = await fetch(f, { cache: 'reload' });
    if (!res.ok) throw new Error(`${f}: ${res.status}`);
    await cache.put(new URL(f, self.registration.scope).href, res);
  }))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('countingtrainer-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(caches.open(CACHE)
      .then((c) => c.match(new URL('./index.html', self.registration.scope).href))
      .then((hit) => hit || fetch(req)));
    return;
  }
  event.respondWith(caches.open(CACHE)
    .then((c) => c.match(req, { ignoreSearch: true }))
    .then((hit) => hit || fetch(req)));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
