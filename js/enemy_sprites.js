/* ZombieChronicles — KÉP-ALAPÚ ELLENSÉG-SPRITE réteg.
   A tools/prepare-enemy-sprites.js által készített tiszta sheet-eket (assets/enemies/*.png)
   + atlaszt (enemy_atlas.json) tölti be, és a játék talp-anchor konvenciója szerint
   rajzol (origó = talp, x=vízszintes közép, y=GROUND_Y). Ha az assetek nem töltenek be,
   has() false → a sprites.js procedurális rajzra esik vissza (nincs összeomlás).

   Ez NEM nyúl a gameplay-logikához: csak a megjelenítést + animációs állapotot adja. */
window.ZD = window.ZD || {};
ZD.enemySprites = (() => {
  const BASE = 'assets/enemies/';

  /* típusonkénti RENDER-konfig: célmagasság (logikai px, talp→fej), animációs állapotok
     (atlasz frame-kulcsok), frame-időtartam (mp), talaj-árnyék. A gameplay-statok a
     js/const.js ZOMBIES-ban vannak (def.w/def.h = ütköződoboz). */
  const CFG = {
    walker:  { h: 46,  states: { idle: ['idle'], move: ['walk_01', 'walk_02'], attack: ['attack'], hit: ['hit'], defeated: ['defeated'] }, dur: { idle: .34, move: .17, attack: .12, hit: .12, defeated: 9 }, shadow: { w: 30, a: .34 } },
    runner:  { h: 44,  states: { idle: ['idle'], move: ['run_01', 'run_02'], attack: ['attack'], hit: ['hit'], defeated: ['defeated'] }, dur: { idle: .3, move: .1, attack: .1, hit: .1, defeated: 9 }, shadow: { w: 30, a: .32 } },
    bloater: { h: 54,  states: { idle: ['idle'], move: ['walk_01', 'walk_02'], attack: ['attack'], warning: ['warning'], hit: ['attack'], defeated: ['defeated'] }, dur: { idle: .32, move: .24, attack: .18, warning: .12, hit: .12, defeated: 9 }, shadow: { w: 42, a: .38 } },
    spitter: { h: 48,  states: { idle: ['idle'], move: ['walk_01'], attack: ['attack_spit'], hit: ['hit'], defeated: ['defeated'] }, dur: { idle: .3, move: .2, attack: .3, hit: .12, defeated: 9 }, shadow: { w: 32, a: .34 } },
    brute:   { h: 62,  states: { idle: ['idle'], move: ['idle', 'walk_01'], attack: ['guard'], hit: ['hit'], defeated: ['defeated'] }, dur: { idle: .34, move: .26, attack: .28, hit: .14, defeated: 9 }, shadow: { w: 50, a: .42 } },
    crawler: { h: 28,  states: { idle: ['crawl_01'], move: ['crawl_01', 'crawl_02', 'crawl_03'], attack: ['lunge', 'attack'], hit: ['lunge'], defeated: ['defeated'] }, dur: { idle: .3, move: .11, attack: .12, hit: .1, defeated: 9 }, shadow: { w: 46, a: .3 } },
    boss:    { h: 86,  states: { idle: ['idle'], move: ['idle', 'walk_01'], attack: ['attack_slam'], projectile: ['attack_projectile'], summon: ['summon'], rage: ['rage'], hit: ['hit'], defeated: ['defeated'] }, dur: { idle: .34, move: .3, attack: .34, projectile: .34, summon: .4, rage: .16, hit: .16, defeated: 9 }, shadow: { w: 84, a: .46 } },
  };

  const img = {};           // type -> Image
  let atlas = null;
  let ready = false, failed = false;
  const scaleCache = {};

  /* ---- HD JÁTÉKOS-SPRITE (assets/player/) ---- */
  const PBASE = 'assets/player/';
  const P_CFG = {
    h: 54, ref: 'walk_0',    // cél-magasság + skála-referencia frame (álló testmagasság)
    states: {
      idle: ['aim_0'],
      move: ['walk_0', 'walk_1', 'walk_2', 'walk_3'],
      fire: ['shoot_1', 'shoot_2'],
      reload: ['aim_2', 'aim_1'],
      death: ['hurt_3'],
    },
    shadow: { w: 34, a: .36 },
  };
  let pAtlas = null, pImg = null, pReady = false, pScale = 0;

  function load() {
    fetch(BASE + 'enemy_atlas.json', { cache: 'default' })
      .then((r) => r.json())
      .then((a) => {
        atlas = a;
        const types = Object.keys(CFG).filter((t) => a[t]);
        let left = types.length;
        if (!left) { failed = true; return; }
        types.forEach((t) => {
          const im = new Image();
          im.onload = () => { if (--left <= 0) ready = true; };
          im.onerror = () => { console.warn('[enemySprites] sheet load fail:', t); if (--left <= 0) ready = true; };
          im.src = BASE + a[t].image;
          img[t] = im;
        });
      })
      .catch((e) => { console.warn('[enemySprites] atlas load fail:', e); failed = true; });
    /* HD játékos */
    fetch(PBASE + 'player_atlas.json', { cache: 'default' })
      .then((r) => r.json())
      .then((a) => {
        pAtlas = a;
        const ref = a.frames[P_CFG.ref] || a.frames[Object.keys(a.frames)[0]];
        pScale = P_CFG.h / ref.h;
        pImg = new Image();
        pImg.onload = () => { pReady = true; };
        pImg.onerror = () => { console.warn('[enemySprites] player sheet load fail'); };
        pImg.src = PBASE + a.image;
      })
      .catch((e) => { console.warn('[enemySprites] player atlas load fail:', e); });
  }

  function has(type) { return ready && !!atlas && !!atlas[type] && !!CFG[type]; }

  function typeScale(type) {
    if (scaleCache[type] != null) return scaleCache[type];
    const A = atlas[type]; const f = A.frames.idle || A.frames[Object.keys(A.frames)[0]];
    const s = CFG[type].h / f.h;
    scaleCache[type] = s; return s;
  }

  /* ---- animátor: a gameplay-jelzők alapján kiválasztja az állapotot, pörgeti a frame-et ---- */
  function pickState(z) {
    if (z.dead) return 'defeated';
    if (z.type === 'boss' && z.bossState && CFG.boss.states[z.bossState]) return z.bossState;
    if (z.warnT > 0 && CFG[z.type].states.warning) return 'warning';
    if (z.flash > 0.08 && CFG[z.type].states.hit) return 'hit';
    if (z.attackingAnim > 0) return 'attack';
    if (z.moving) return 'move';
    return 'idle';
  }
  function stepAnim(z, dt) {
    if (!z.anim) z.anim = { state: 'idle', idx: 0, t: 0 };
    const cfg = CFG[z.type]; if (!cfg) return;
    const ns = pickState(z);
    const a = z.anim;
    if (a.state !== ns) { a.state = ns; a.idx = 0; a.t = 0; }
    const frames = cfg.states[ns] || cfg.states.idle;
    const dur = cfg.dur[ns] || 0.2;
    a.t += dt * (z.animRate || 1);   // per-egyed anim-tempó → nincs tökéletes szinkron
    while (a.t >= dur) { a.t -= dur; a.idx = (a.idx + 1) % frames.length; }
  }
  function frameKey(z) {
    const cfg = CFG[z.type]; const a = z.anim || { state: 'idle', idx: 0 };
    const frames = cfg.states[a.state] || cfg.states.idle;
    return frames[a.idx % frames.length] || frames[0];
  }

  /* ---- hit-flash tint (scratch-vászon, source-in) ---- */
  const scr = document.createElement('canvas'); const sg = scr.getContext('2d');
  sg.imageSmoothingEnabled = true;

  /* lágy, radiális talaj-árnyék (sötét mag → átlátszó perem) — a lény „a földön ül" */
  function drawShadow(ctx, type, x, y, scaleMul) {
    const sh = CFG[type].shadow; const w = sh.w * (scaleMul || 1); const rx = w * 0.5, ry = Math.max(3, w * 0.2);
    ctx.save();
    ctx.translate(x, y + 0.5);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(2,4,8,' + sh.a + ')');
    g.addColorStop(0.6, 'rgba(2,4,8,' + (sh.a * 0.7) + ')');
    g.addColorStop(1, 'rgba(2,4,8,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* z: a zombi-objektum (type, x, facing, flash, dead, deathT, elite, enrage, anim...)
     o: { y } — a talaj-Y (GROUND_Y). */
  function draw(ctx, z, y) {
    const type = z.type; if (!has(type)) return false;
    const A = atlas[type]; const f = A.frames[frameKey(z)] || A.frames.idle; if (!f) return false;
    const im = img[type]; if (!im || !im.complete || !im.naturalWidth) return false;
    const eScale = z.elite ? 1.12 : 1;
    const sc = typeScale(type) * eScale * (z.sizeVar || 1);   // per-egyed méret-variáció (±)
    const dw = f.w * sc, dh = f.h * sc;
    const fac = z.facing < 0 ? -1 : 1;
    /* jelenetbe illesztő szín-grading: kicsit sötétebb/kevésbé telített, + egyedi fény-variáció */
    const grade = 'brightness(' + (0.9 * (z.briVar || 1)).toFixed(3) + ') contrast(1.07) saturate(0.9)';

    /* haláli elhalványulás */
    let alpha = 1;
    if (z.dead) { alpha = z.deathT < 0.8 ? 1 : Math.max(0, 1 - (z.deathT - 0.8) / 0.5); }

    if (!z.dead) drawShadow(ctx, type, z.x, y, eScale);

    /* elit: pulzáló arany talaj-gyűrű */
    if (z.elite && !z.dead) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffc14d';
      ctx.beginPath();
      ctx.ellipse(z.x, y, CFG[type].shadow.w * 0.55 * eScale, Math.max(2, CFG[type].shadow.w * 0.14), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(Math.round(z.x), Math.round(y));
    if (fac < 0) ctx.scale(-1, 1);
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.filter = grade;
    ctx.drawImage(im, f.x, f.y, f.w, f.h, -dw * f.ax, -dh * f.ay, dw, dh);
    ctx.restore();

    /* hit-flash: fehér sziluett-villanás */
    if (z.flash > 0 && !z.dead) {
      const a = Math.min(0.8, z.flash * 6);
      scr.width = Math.max(1, Math.ceil(f.w)); scr.height = Math.max(1, Math.ceil(f.h));
      sg.clearRect(0, 0, scr.width, scr.height);
      sg.globalCompositeOperation = 'source-over';
      sg.drawImage(im, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      sg.globalCompositeOperation = 'source-in';
      sg.fillStyle = z.enrage ? '#ff5030' : '#ffffff';
      sg.fillRect(0, 0, scr.width, scr.height);
      ctx.save();
      ctx.translate(Math.round(z.x), Math.round(y));
      if (fac < 0) ctx.scale(-1, 1);
      ctx.globalAlpha = a;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(scr, 0, 0, scr.width, scr.height, -dw * f.ax, -dh * f.ay, dw, dh);
      ctx.restore();
    }
    /* enrage boss: pulzáló vörös derengés */
    if (z.enrage && !z.dead) {
      scr.width = Math.max(1, Math.ceil(f.w)); scr.height = Math.max(1, Math.ceil(f.h));
      sg.clearRect(0, 0, scr.width, scr.height);
      sg.globalCompositeOperation = 'source-over';
      sg.drawImage(im, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      sg.globalCompositeOperation = 'source-in';
      sg.fillStyle = '#ff3020';
      sg.fillRect(0, 0, scr.width, scr.height);
      ctx.save();
      ctx.translate(Math.round(z.x), Math.round(y));
      if (fac < 0) ctx.scale(-1, 1);
      ctx.globalAlpha = 0.12 + 0.1 * Math.sin((z.phase || 0) * 5);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(scr, 0, 0, scr.width, scr.height, -dw * f.ax, -dh * f.ay, dw, dh);
      ctx.restore();
    }

    /* HP-csík (csak sérültnek, fej fölött) */
    if (z.hpRatio != null && z.hpRatio < 1 && z.hpRatio > 0 && !z.dead) {
      const bw = Math.max(dw * 0.5, 14);
      const bx = z.x - bw / 2, by = y - dh - 4;
      ctx.fillStyle = 'rgba(10,6,6,.8)';
      ctx.fillRect(bx - 0.5, by - 0.5, bw + 1, 3);
      ctx.fillStyle = z.elite ? '#ffc14d' : (type === 'boss' || type === 'brute' ? '#ff5b3d' : '#7ddb4f');
      ctx.fillRect(bx, by, bw * z.hpRatio, 2);
    }
    return true;
  }

  /* egy tetszőleges frame kirajzolása közép-anchorral (VFX/projektil célra) */
  function drawNamedFrameCentered(ctx, type, key, x, y, targetH, alpha) {
    if (!has(type)) return false;
    const A = atlas[type]; const f = A.frames[key]; if (!f) return false;
    const im = img[type]; if (!im || !im.naturalWidth) return false;
    const sc = targetH / f.h; const dw = f.w * sc, dh = f.h * sc;
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(im, f.x, f.y, f.w, f.h, x - dw / 2, y - dh / 2, dw, dh);
    ctx.restore(); return true;
  }

  /* ---- HD JÁTÉKOS render ---- */
  function hasPlayer() { return pReady && !!pAtlas && !!pImg && pImg.naturalWidth > 0; }
  function drawPlayer(ctx, o) {
    if (!hasPlayer()) return false;
    /* állapot-prioritás: MOZGÁS a lövés ELŐTT → mozgás+lövés közben a járás-póz marad
       (a torkolattűz külön játszik), nincs villogó járás↔lövés váltás. */
    let key;
    if (o.deathT > 0) key = P_CFG.states.death[0];
    else if (o.reloadT > 0) key = P_CFG.states.reload[((1 - o.reloadT / 0.5) * P_CFG.states.reload.length) | 0] || P_CFG.states.reload[0];
    else if (o.moving) key = P_CFG.states.move[((o.phase || 0) * 1.6 | 0) % P_CFG.states.move.length];
    else if (o.fireAnim > 0) key = P_CFG.states.fire[(o.muzzleSeed || 0) % P_CFG.states.fire.length];
    else key = P_CFG.states.idle[0];
    const f = pAtlas.frames[key] || pAtlas.frames[P_CFG.ref]; if (!f) return false;
    const dw = f.w * pScale, dh = f.h * pScale;
    const fac = o.facing < 0 ? -1 : 1;
    let alpha = 1;
    if (o.deathT > 0) alpha = o.deathT < 1.0 ? 1 : Math.max(0.15, 1 - (o.deathT - 1.0) / 1.4);

    if (o.deathT <= 0) {
      // talaj-árnyék
      const sh = P_CFG.shadow, w = sh.w, rx = w * 0.5, ry = Math.max(3, w * 0.2);
      ctx.save(); ctx.translate(o.x, o.y + 0.5); ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, 'rgba(2,4,8,' + sh.a + ')'); g.addColorStop(0.6, 'rgba(2,4,8,' + (sh.a * 0.7) + ')'); g.addColorStop(1, 'rgba(2,4,8,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    ctx.save();
    ctx.translate(Math.round(o.x), Math.round(o.y));
    if (fac < 0) ctx.scale(-1, 1);
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.filter = 'brightness(0.94) contrast(1.05) saturate(0.95)';
    ctx.drawImage(pImg, f.x, f.y, f.w, f.h, -dw * f.ax, -dh * f.ay, dw, dh);
    ctx.restore();

    // sérülés-villanás
    if (o.flash > 0 && o.deathT <= 0) {
      scr.width = Math.max(1, Math.ceil(f.w)); scr.height = Math.max(1, Math.ceil(f.h));
      sg.clearRect(0, 0, scr.width, scr.height);
      sg.globalCompositeOperation = 'source-over'; sg.drawImage(pImg, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#ff5a3c'; sg.fillRect(0, 0, scr.width, scr.height);
      ctx.save(); ctx.translate(Math.round(o.x), Math.round(o.y)); if (fac < 0) ctx.scale(-1, 1);
      ctx.globalAlpha = Math.min(0.7, o.flash * 5); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(scr, 0, 0, scr.width, scr.height, -dw * f.ax, -dh * f.ay, dw, dh);
      ctx.restore();
    }
    return true;
  }

  return { load, has, stepAnim, draw, drawNamedFrameCentered, hasPlayer, drawPlayer, cfg: (t) => CFG[t], get ready() { return ready; } };
})();
