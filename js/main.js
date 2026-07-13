/* Belépési pont: canvas méretezés, játékciklus, indítás */
window.ZD = window.ZD || {};

(() => {
  const C = ZD.C;
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  /* belső render-felbontás: 960×540 (a logika 480×270-ben fut, RS=2 skálával) */
  cv.width = C.VIEW_W * C.RS;
  cv.height = C.VIEW_H * C.RS;
  ctx.imageSmoothingEnabled = false;

  /* stage (canvas + HUD + gombok + menük) illesztése a képernyőhöz:
     arányos 16:9, maximális kitöltés, minimális letterbox */
  const stage = document.getElementById('stage');
  /* DINAMIKUS LÁTÓTÉR: a logikai MAGASSÁG fix (VIEW_H=270), a SZÉLESSÉG a képernyő-
     arányhoz igazodik (clamp) → a gameplay KITÖLTI a viewportot, mint a menü (nincs
     oldalsó fekete sáv). Side-scrollerként széles képernyőn TÖBB pálya látszik oldalt;
     a függőleges keretezés (GROUND_Y ~86%) és a balansz VÁLTOZATLAN.
     Extrém (ultrawide/keskeny) aránynál a clamp miatt minimális, kontrollált letterbox
     marad — így az in-canvas HUD (boss-sáv, bannerek) SOSEM vágódik le. */
  const ASPECT_MIN = 1.6, ASPECT_MAX = 2.6;
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    const aspect = Math.max(ASPECT_MIN, Math.min(ASPECT_MAX, w / h));
    const vw = Math.round(C.VIEW_H * aspect / 2) * 2; // páros (RS-hez)
    if (vw !== C.VIEW_W) {
      C.VIEW_W = vw;
      cv.width = C.VIEW_W * C.RS; // belső buffer-szélesség frissítése (magasság fix 540)
    }
    /* contain: ha az arány a clamp-tartományban van, a buffer-arány = viewport-arány →
       teljes kitöltés, nulla sáv; extrém aránynál minimális letterbox (nem crop). */
    const scale = Math.min(w / C.VIEW_W, h / C.VIEW_H);
    stage.style.width = `${Math.round(C.VIEW_W * scale)}px`;
    stage.style.height = `${Math.round(C.VIEW_H * scale)}px`;
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 250));
  window.addEventListener('load', fit);
  setTimeout(fit, 120); // iOS PWA: első layout után újraszámolás

  /* DEBUG: ellenség-spawn 1–7 + hitbox overlay (H) — gyors vizuális teszthez.
     1=walker 2=runner 3=tank(brute) 4=spitter 5=bloater 6=crawler 7=boss */
  const DBG_KEYS = { '1': 'walker', '2': 'runner', '3': 'brute', '4': 'spitter', '5': 'bloater', '6': 'crawler', '7': 'boss' };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return; // ne zavarjuk a szövegbevitelt
    if (DBG_KEYS[e.key] && ZD.game.debugSpawn) ZD.game.debugSpawn(DBG_KEYS[e.key]);
    else if ((e.key === 'h' || e.key === 'H') && ZD.game.debugToggleHitbox) ZD.game.debugToggleHitbox();
    else if ((e.key === 'g' || e.key === 'G') && ZD.game.debugToggleAlign) ZD.game.debugToggleAlign();
  });

  /* gesztusok tiltása (iOS dupla koppintás zoom, pinch) */
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  /* játékciklus — fix 60 Hz-es léptetés felhalmozóval */
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;

  function loop(now) {
    requestAnimationFrame(loop);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25; // háttérből visszatérve ne ugorjon
    acc += dt;
    ZD.input.update();
    while (acc >= STEP) {
      ZD.game.update(STEP);
      acc -= STEP;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(C.RS, 0, 0, C.RS, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (ZD.game.st.running) {
      ZD.game.render(ctx);
    } else {
      /* menü mögé élő jelenet */
      ZD.sprites.drawMenuScene(ctx, now * 0.001);
    }
  }

  /* indítás */
  ZD.save.load();
  ZD.save.requestPersistent(); // kérjük a böngészőt: ne törölje magától a mentést
  if (ZD.enemySprites) ZD.enemySprites.load(); // kép-alapú ellenség-sprite-ok betöltése
  if (ZD.partRig) ZD.partRig.load();           // part-rig (Kóbor): járás + testszakadás
  if (ZD.sprites.loadMaps) ZD.sprites.loadMaps(); // HD parallax map-rétegek betöltése
  ZD.ui.build();
  ZD.input.setup();
  ZD.ui.show('title');
  fit();
  requestAnimationFrame(loop);

  /* háttérben: ha a localStorage kiürült, de az IndexedDB-tükörben megvan a
     haladás, állítsuk vissza — majd frissítsük az épp látható képernyőt */
  ZD.save.recover().then((restored) => {
    if (restored && ZD.ui.refreshActive) ZD.ui.refreshActive();
  });

  /* PWA service worker (csak http(s) alatt működik) — megbízható frissítéssel:
     - updateViaCache:'none' → az sw.js SOHA nem a HTTP-cache-ből jön → a verzió-bump
       azonnal észlelhető;
     - reg.update() minden betöltéskor keres új verziót;
     - ha MÁR volt aktív SW és egy ÚJ átveszi az irányítást (controllerchange), egyszer
       automatikusan újratöltünk → a friss assetek azonnal megjelennek (nem kell 100 reload). */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloaded) { reloaded = true; location.reload(); }
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then((reg) => { try { reg.update(); } catch (e) { /* noop */ } })
      .catch(() => {});
  }
})();
