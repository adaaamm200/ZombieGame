/* Zombi Krónika — offline service worker (cache-first) */
const VERSION = 'zk-v19';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/const.js',
  './js/save.js',
  './js/i18n.js',
  './js/icons.js',
  './js/audio.js',
  './js/sprites.js',
  './js/input.js',
  './js/game.js',
  './js/ui.js',
  './js/main.js',
  './icons/icon-180.png',
  './icons/icon-512.png',
  './assets/references/day1_board_target_clean.png',
  './assets/references/main menu background.png',
  './assets/ui/logo.png',
  './assets/ui/appicon.png',
  './assets/ui/ic-fire.png',
  './assets/ui/ic-ammo.png',
  './assets/ui/ic-swap.png',
  './assets/ui/ic-grenade.png',
  './assets/ui/ic-pause.png',
  './assets/ui/ic-coin.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(e.request, copy));
            return res;
          })
          .catch(() => caches.match('./index.html')),
    ),
  );
});
