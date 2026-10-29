/* Mi Compra Inteligente · funcionamiento sin conexión
   - La página se pide primero a internet (para tener siempre la última versión) y, si no hay
     cobertura o tarda más de 3 segundos, se usa la copia guardada. Así funciona dentro del súper.
   - Iconos y archivos propios: se sirven de la copia guardada.
   - Tipografías de Google: se usan de la copia y se actualizan en segundo plano. */
const VERSION = 'mci-v3-2026-10-29';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function conTiempo(promesa, ms) {
  return new Promise((ok, mal) => {
    const t = setTimeout(() => mal(new Error('timeout')), ms);
    promesa.then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); mal(e); });
  });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Páginas: primero internet, si no, la copia
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const red = await conTiempo(fetch(req), 3000);
        if (red.ok) cache.put('./index.html', red.clone());
        return red;
      } catch (e) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Archivos propios: copia guardada, y si no está, internet
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(req).then(c => c || fetch(req).then(r => {
      if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(cache => cache.put(req, copia)); }
      return r;
    })));
    return;
  }

  // Tipografías: copia al momento y actualización en segundo plano
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(VERSION).then(async cache => {
      const copia = await cache.match(req);
      const red = fetch(req).then(r => { if (r.ok || r.type === 'opaque') cache.put(req, r.clone()); return r; }).catch(() => copia);
      return copia || red;
    }));
  }
});
