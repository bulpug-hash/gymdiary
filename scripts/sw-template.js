// Service worker GymDiary. Šablona – při buildu do ní plugin v vite.config.ts
// dosadí konkrétní build hash a seznam souborů. Sama o sobě se nikdy nenasazuje.
//
// Appka nic nefetchuje za běhu (všechna data jsou v localStorage), takže offline
// je čistě otázka nacachovaného shellu.
const BUILD = '__GD_BUILD__';
const CACHE = `gd-app-${BUILD}`;
const PRECACHE = ['__GD_PRECACHE__'];

const FONT_HOSTS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // no-cache: GitHub Pages posílá max-age=600, bez tohohle by se precache
      // mohla naplnit starou verzí souborů.
      .then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'no-cache' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      // Mažeme VÝHRADNĚ vlastní klíče. Nikdy ne všechno – v originu můžou být
      // cache jiných aplikací.
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('gd-app-') && k !== CACHE).map(k => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isFont(url) {
  return FONT_HOSTS.some(h => url.startsWith(h));
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Navigace: shell z cache. Assety mají hash v názvu a SW se aktualizuje
  // atomicky, takže cache-first nikdy nesmíchá staré HTML s novým JS.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(PRECACHE[0], { ignoreSearch: true })
        .then(hit => hit || fetch(req))
        .catch(() => caches.match(PRECACHE[0], { ignoreSearch: true })),
    );
    return;
  }

  // Písma: stale-while-revalidate, ať appka offline nespadne na Helveticu.
  if (isFont(url.origin)) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(req).then(hit => {
          const net = fetch(req).then(res => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => hit);
          return hit || net;
        }),
      ),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Vlastní statické soubory: cache-first, na pozadí obnov.
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(hit => {
        const net = fetch(req).then(res => {
          if (res.ok && res.type === 'basic') cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      }),
    ),
  );
});
