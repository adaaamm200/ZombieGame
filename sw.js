/* Zombi Krónika — offline service worker (cache-first) */
const VERSION = 'zk-v36';
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
  './assets/ui/m-continue.png',
  './assets/ui/m-campaign.png',
  './assets/ui/m-scavenge.png',
  './assets/ui/m-armory.png',
  './assets/ui/m-lab.png',
  './assets/ui/m-settings.png',
  './assets/ui/m-shop.png',
  './assets/ui/m-back.png',
  './assets/ui/s-done.png',
  './assets/ui/s-current.png',
  './assets/ui/s-locked.png',
  './assets/ui/s-boss.png',
  './assets/ui/s-loot.png',
  './assets/ui/s-danger.png',
  './assets/ui/buttons/btn_campaign_board.png',
  './assets/ui/buttons/btn_scavenge_board.png',
  './assets/ui/buttons/btn_settings_board.png',
  './assets/ui/buttons/btn_shop_cta.png',
  './assets/ui/buttons/btn_start_run.png',
  './assets/ui/buttons/btn_replay.png',
  './assets/ui/buttons/btn_fight_boss.png',
  './assets/ui/buttons/btn_back.png',
  './assets/ui/buttons/btn_close.png',
  './js/enemy_sprites.js',
  './assets/enemies/enemy_atlas.json',
  './assets/enemies/enemy_walker_sheet.png',
  './assets/enemies/enemy_runner_sheet.png',
  './assets/enemies/enemy_bloater_sheet.png',
  './assets/enemies/enemy_spitter_sheet.png',
  './assets/enemies/enemy_brute_sheet.png',
  './assets/enemies/enemy_crawler_sheet.png',
  './assets/enemies/enemy_boss_sheet.png',
  './assets/player/player_atlas.json',
  './assets/player/player_sheet.png',
  './assets/maps/level_01/far.png',
  './assets/maps/level_01/mid.png',
  './assets/maps/level_01/near.png',
  './assets/maps/level_01/ground.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) =>
      /* cache: 'reload' → a böngésző HTTP-cache-ét MEGKERÜLVE, a HÁLÓZATRÓL tölti a
         precache-t, így verzió-bumpnál tényleg FRISS assetek kerülnek be (nem a régi,
         azonos nevű, HTTP-cache-elt kép). Per-asset hibatűrés: egy hiányzó fájl nem
         bukatja el az egész install-t. */
      Promise.all(ASSETS.map((u) =>
        fetch(new Request(u, { cache: 'reload' }))
          .then((r) => (r && (r.ok || r.type === 'opaque')) ? c.put(u, r) : null)
          .catch(() => null),
      )),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/* App-shell (HTML/CSS/JS + navigáció) = NETWORK-FIRST → egy friss deploy AZONNAL betölt,
   nem ragad be a cache (ez volt a „nem frissül a játék" gyökér-oka). Offline → cache fallback.
   Kép/egyéb statikus asset = CACHE-FIRST (ritkán változik, gyors + offline). */
const SHELL_RE = /\.(?:html|css|js|webmanifest)(?:$|\?)/i;
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isShell = e.request.mode === 'navigate' || url.pathname === '/' || SHELL_RE.test(url.pathname);
  if (isShell) {
    /* cache:'no-cache' → MINDIG revalidál a szerverrel (ETag), megkerülve a GitHub Pages
       ~10 perces HTTP-cache-ét → egy friss deploy AZONNAL érvényesül (304 esetén gyors). */
    e.respondWith(
      fetch(new Request(e.request.url, { cache: 'no-cache' }))
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')),
        ),
    );
    return;
  }
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
