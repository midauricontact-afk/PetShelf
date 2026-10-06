/* Service worker de PetShelf : ouverture instantanée, fonctionnement hors ligne,
   et photos des figurines gardées en cache sur le téléphone une fois vues (elles restent chez leurs auteurs). */
const CACHE = 'petshelf-v5';
const IMAGES = 'petshelf-images-v1';
const MAX_IMAGES = 5000;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/apple-touch-icon.png'];
const IMAGE_HOSTS = /(^|\.)blogspot\.com$|(^|\.)googleusercontent\.com$|(^|\.)toysisters\.com$/;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== IMAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

let trimming = false;
/** Garde le cache d'images raisonnable : on retire les plus anciennes au-delà de MAX_IMAGES. */
async function trimImages() {
  if (trimming) return;
  trimming = true;
  try {
    const cache = await caches.open(IMAGES);
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - MAX_IMAGES; i++) await cache.delete(keys[i]);
  } finally {
    trimming = false;
  }
}

/** Photo d'une figurine : d'abord le cache, sinon le site d'origine (puis on la garde). */
async function image(req) {
  const cache = await caches.open(IMAGES);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    // Les réponses « opaques » (status 0) viennent d'un autre site sans en-têtes CORS : elles s'affichent quand même.
    if (res.ok || res.type === 'opaque') {
      await cache.put(req.url, res.clone());
      if (Math.random() < 0.05) void trimImages();
    }
    return res;
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    if (req.destination === 'image' && IMAGE_HOSTS.test(url.hostname)) event.respondWith(image(req));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  // Fichiers de l'app (dont le catalogue) : cache d'abord, mise à jour en arrière-plan.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
