const cacheName = 'ouo-offline-v1';
const shell = new URL('./', self.registration.scope).href;
const assets = ['./', './offline.js', './app.webmanifest', './icon-192.png', './icon-512.png']
  .map(path => new URL(path, self.registration.scope).href);
const assetUrls = new Set(assets);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(assets.map(url => new Request(url, {cache: 'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('ouo-offline-') && key !== cacheName)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const shellUrl = new URL(shell);
  const isAppPage = request.mode === 'navigate' &&
    (url.pathname === shellUrl.pathname || url.pathname === shellUrl.pathname + 'index.html');
  if (isAppPage) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && !response.redirected) {
          const cache = await caches.open(cacheName);
          try { await cache.put(shell, response.clone()); } catch {}
          return response;
        }
        return (await caches.match(shell, {cacheName})) || response;
      } catch {
        return (await caches.match(shell, {cacheName})) || Response.error();
      }
    })());
  } else if (assetUrls.has(url.href)) {
    event.respondWith(caches.match(request, {cacheName}).then(hit => hit || fetch(request)));
  }
});
