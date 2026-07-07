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
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    const scale = Math.min(w / C.VIEW_W, h / C.VIEW_H);
    stage.style.width = `${Math.round(C.VIEW_W * scale)}px`;
    stage.style.height = `${Math.round(C.VIEW_H * scale)}px`;
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 250));
  window.addEventListener('load', fit);
  setTimeout(fit, 120); // iOS PWA: első layout után újraszámolás

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
  ZD.ui.build();
  ZD.input.setup();
  ZD.ui.show('title');
  fit();
  requestAnimationFrame(loop);

  /* PWA service worker (csak http(s) alatt működik) */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
