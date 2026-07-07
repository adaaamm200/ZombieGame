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

  /* canvas illesztése a képernyőhöz (letterbox, pixeles nagyítás) */
  function fit() {
    const scale = Math.min(window.innerWidth / C.VIEW_W, window.innerHeight / C.VIEW_H);
    cv.style.width = `${C.VIEW_W * scale}px`;
    cv.style.height = `${C.VIEW_H * scale}px`;
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 250));

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
