/* Belépési pont: canvas méretezés, játékciklus, indítás */
window.ZD = window.ZD || {};

(() => {
  const C = ZD.C;
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
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
    ctx.clearRect(0, 0, C.VIEW_W, C.VIEW_H);
    if (ZD.game.st.running) {
      ZD.game.render(ctx);
    } else {
      /* menü mögé csendes háttér */
      ZD.sprites.drawBackground(ctx, (now * 0.01) % C.WORLD_W, 1);
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
