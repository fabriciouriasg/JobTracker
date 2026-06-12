// Job Tracker — Service Worker v2
// Incrementa CACHE al publicar cambios para forzar refresh en iOS PWA
const CACHE = 'jt-v2.2.0';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./', './index.html'])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Nunca cachear llamadas al backend (Apps Script)
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleusercontent.com')) {
    return; // dejar pasar a la red sin interceptar
  }

  // App shell: network-first con fallback a cache (evita versiones viejas pegadas)
  if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./')))
    );
    return;
  }

  // Resto (fuentes, etc.): cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match('./')))
  );
});
