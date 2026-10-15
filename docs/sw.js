/* Service Worker: SmilesDrawer Braille — Offline-Cache
 *
 * Strategie:
 *   - install: alle App-Dateien (Core-Assets) + die version-pinneden
 *     CDN-Scripts (jsPDF, svg2pdf) werden vorab gecacht
 *   - Navigation (HTML): Network-First — online immer die frische
 *     Version; offline die gecachte (Fallback: braille.html)
 *   - Alle anderen GET-Requests (JS, Font, Bilder, CDN): Cache-First —
 *     bei Cache-Miss per Netzwerk nachladen und cachen
 *   - Scan2SMILES (OpenWebUI-API, POST) bleibt davon unberührt und
 *     braucht natürlich eine Verbindung
 */
const CACHE_NAME = 'smilesbraille-v1';
const CORE_ASSETS = [
  './',
  './braille.html',
  './index.html',
  './datenschutz.html',
  './impressum.html',
  './js/smiles-drawer.min.js',
  './js/smiles-website.js',
  './fonts/Euro850.ttf',
  './favicon.svg',
  './mbz-logo.svg',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];
// Version-pinned CDN-Dependencies (PDF-Export) — sicher cachebar
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/svg2pdf.js@1.5.0/dist/svg2pdf.min.js'
];
const ALLOWED_ORIGINS = [self.location.origin, 'https://cdn.jsdelivr.net'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS.concat(CDN_ASSETS)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Nur erlaubte Originals anfassen (OpenWebUI & Co. bleiben unberührt)
  if (!ALLOWED_ORIGINS.includes(url.origin)) return;

  // Navigation: Network-First mit Offline-Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('./braille.html'))
        )
    );
    return;
  }

  // Alles andere: Cache-First
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
