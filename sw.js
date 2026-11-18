/* Service Worker: שומר את כל הקבצים כדי שהמשחק יעבוד בלי אינטרנט.
   כשיש רשת: מביא גרסה עדכנית (עד 2.5 שניות), אחרת משתמש בעותק השמור. */
const CACHE = 'hood-v1';
const FILES = [
  './', 'index.html', 'config.js', 'manifest.webmanifest', 'css/style.css',
  'js/core.js', 'js/sound.js', 'js/music.js', 'js/robot.js', 'js/fx.js', 'js/demos.js', 'js/hood.js',
  'js/games/air.js', 'js/games/trash.js', 'js/games/power.js', 'js/games/water.js',
  'js/admin.js', 'js/main.js',
  'fonts/rubik-hebrew.woff2', 'fonts/rubik-latin.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
const AUDIO = ['intro', 'how-air', 'how-trash', 'how-power', 'how-water', 'final'].map(n => 'audio/' + n + '.mp3');

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    await Promise.all(AUDIO.map(async f => { try { const r = await fetch(f, { cache: 'reload' }); if (r.ok) await c.put(f, r); } catch (e) {} }));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
const timeout = (ms) => new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isAudio = new URL(req.url).pathname.includes('/audio/');
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const net = await Promise.race([fetch(req), timeout(2500)]);
      if (net && net.ok) { c.put(req, net.clone()); return net; }
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (isAudio) return new Response(null, { status: 204 });   // אין קובץ קריינות: שקט
      return net;
    } catch (err) {
      const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' && await c.match('index.html'));
      if (hit) return hit;
      if (isAudio) return new Response(null, { status: 204 });
      return new Response('', { status: 504 });
    }
  })());
});
