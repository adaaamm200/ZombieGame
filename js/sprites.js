/* Procedurális pixel-art sprite rendszer — minden grafika kódból születik.
   Betöltéskor sprite-sheeteket előrenderelünk offscreen canvasokra, futásidőben
   csak blit történik. ART=2: 1 logikai egység = 2 art pixel (960×540 render). */
window.ZD = window.ZD || {};

ZD.sprites = (() => {
  const C = ZD.C;
  const ART = 2;
  const r2 = (v) => Math.round(v * ART) / ART;

  function mkc(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return [c, g];
  }

  /* sheet: n keret, origó = keret alsó-közepe */
  function sheet(fw, fh, n, draw) {
    const [c, g] = mkc(fw * n, fh);
    for (let i = 0; i < n; i++) {
      g.save();
      g.translate(i * fw + Math.floor(fw / 2), fh);
      draw(g, i);
      g.restore();
    }
    return { c, fw, fh, n };
  }

  /* rect-helper gyár: p(x, top, w, h, szín) — top = origó feletti magasság.
     k: rajz-lépték (nagyobb karakterekhez a koordináták skálázódnak) */
  const mkP = (g, k = 1) => (x, top, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x * k), Math.round(-top * k), Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
  };

  /* pixeles kör (scanline, q kvantálással) */
  function pxCircle(g, cx, cy, r, col, q = 2) {
    g.fillStyle = col;
    for (let yy = -r; yy < r; yy += q) {
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)) / q) * q;
      if (half > 0) g.fillRect(cx - half, cy + yy, half * 2, q);
    }
  }

  /* ---------- blit-helperek (logikai koordináták, origó lent-középen) ---------- */
  function blit(ctx, sh, frame, x, y, facing = 1, alpha = 1, s = 1) {
    const f = ((frame | 0) % sh.n + sh.n) % sh.n;
    ctx.save();
    ctx.translate(r2(x), r2(y));
    if (facing < 0) ctx.scale(-1, 1);
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(sh.c, f * sh.fw, 0, sh.fw, sh.fh, -sh.fw / 2 / ART * s, -sh.fh / ART * s, sh.fw / ART * s, sh.fh / ART * s);
    ctx.restore();
  }

  function blitRot(ctx, sh, frame, x, y, facing, rot, alpha, sy = 1) {
    const f = ((frame | 0) % sh.n + sh.n) % sh.n;
    ctx.save();
    ctx.translate(r2(x), r2(y));
    if (facing < 0) ctx.scale(-1, 1);
    ctx.rotate(rot);
    if (sy !== 1) ctx.scale(1, sy);
    ctx.globalAlpha = alpha;
    ctx.drawImage(sh.c, f * sh.fw, 0, sh.fw, sh.fh, -sh.fw / 2 / ART, -sh.fh / ART, sh.fw / ART, sh.fh / ART);
    ctx.restore();
  }

  /* középpont-origós blit (robbanás, ikonok) */
  function blitC(ctx, sh, frame, x, y, scale = 1, alpha = 1) {
    const f = Math.max(0, Math.min(sh.n - 1, frame | 0));
    ctx.save();
    ctx.translate(r2(x), r2(y));
    ctx.globalAlpha = alpha;
    const w = sh.fw / ART * scale, h = sh.fh / ART * scale;
    ctx.drawImage(sh.c, f * sh.fw, 0, sh.fw, sh.fh, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  /* fehér/piros villanás: sprite maszkolt átszínezése */
  const [scratch, scrG] = mkc(224, 224);
  function blitTint(ctx, sh, frame, x, y, facing, color, alpha, s = 1) {
    const f = ((frame | 0) % sh.n + sh.n) % sh.n;
    scrG.clearRect(0, 0, scratch.width, scratch.height);
    scrG.globalCompositeOperation = 'source-over';
    scrG.drawImage(sh.c, f * sh.fw, 0, sh.fw, sh.fh, 0, 0, sh.fw, sh.fh);
    scrG.globalCompositeOperation = 'source-in';
    scrG.fillStyle = color;
    scrG.fillRect(0, 0, sh.fw, sh.fh);
    ctx.save();
    ctx.translate(r2(x), r2(y));
    if (facing < 0) ctx.scale(-1, 1);
    ctx.globalAlpha = alpha;
    ctx.drawImage(scratch, 0, 0, sh.fw, sh.fh, -sh.fw / 2 / ART * s, -sh.fh / ART * s, sh.fw / ART * s, sh.fh / ART * s);
    ctx.restore();
  }

  /* determinisztikus pszeudo-random (seedelt dekorokhoz) */
  function lcg(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* =====================================================================
     JÁTÉKOS — katona (idle 4, walk 6, reload 4 keret) + fegyver overlay
     ===================================================================== */
  const SKIN = '#d9a878', SKIN2 = '#c08c5e';

  function playerBody(g, o) {
    const p = mkP(g, 1.3);
    const b = o.bob || 0;
    const lF = o.lF || 0, lR = o.lR || 0;

    // hátizsák (a test mögött)
    p(-16, 40 + b, 6, 14, '#42503a');
    p(-16, 38 + b, 6, 2, '#33402c');
    p(-17, 34 + b, 3, 5, '#54452c');            // oldalzseb

    // hátsó láb + bakancs
    p(-8 + lR, 20, 6, 16, '#39422f');
    p(-9 + lR, 5, 8, 5, '#1b1b1e');
    p(-9 + lR, 2, 8, 1, '#33333a');
    p(-7 + lR, 6, 3, 1, '#454550');             // fűző
    // elülső láb + bakancs
    p(2 + lF, 20, 6, 16, '#434e37');
    p(3 + lF, 18, 4, 6, '#6d5a3a');             // combzseb
    p(1 + lF, 5, 9, 5, '#222226');
    p(1 + lF, 2, 9, 1, '#3a3a42');
    p(3 + lF, 6, 3, 1, '#4c4c58');              // fűző
    // térdvédő
    p(2 + lF, 14, 6, 3, '#565f47');
    p(2 + lF, 14, 6, 1, '#67724f');

    // törzs: mellény
    p(-10, 42 + b, 20, 23, '#55684a');
    p(-10, 42 + b, 3, 23, '#48593f');           // hát-árnyék
    p(-8, 38 + b, 15, 9, '#5f7452');            // mellkas-lemez
    p(-8, 38 + b, 15, 1, '#6c8560');
    p(-7, 42 + b, 2, 22, '#3a4531');            // heveder
    p(4, 42 + b, 2, 22, '#3a4531');
    p(-6, 30 + b, 6, 6, '#6d5a3a');             // táskák
    p(2, 30 + b, 6, 6, '#6d5a3a');
    p(-6, 30 + b, 6, 2, '#54452c');
    p(2, 30 + b, 6, 2, '#54452c');
    p(-4, 27 + b, 2, 1, '#8a7448');             // táska-patent
    p(4, 27 + b, 2, 1, '#8a7448');
    p(7, 36 + b, 3, 5, '#2c2c30');              // rádió az oldalán
    p(8, 38 + b, 1, 2, '#e5484d');
    p(-10, 22 + b, 20, 3, '#4a3b26');           // öv
    p(-2, 22 + b, 4, 3, '#8a7448');             // csat

    // fej + arc
    p(-3, 45 + b, 6, 3, SKIN2);                 // nyak
    p(-6, 56 + b, 12, 12, SKIN);
    p(-6, 47 + b, 12, 3, SKIN2);                // állkapocs-árny
    p(-5, 51 + b, 2, 3, SKIN2);                 // fül
    p(1, 52 + b, 4, 2, '#f2ede2');              // szem
    p(3, 52 + b, 2, 2, '#26241e');
    p(1, 54 + b, 4, 1, '#7a5a3c');              // szemöldök
    p(1, 47 + b, 4, 1, '#8a5f43');              // száj
    p(-2, 49 + b, 2, 1, '#c08c5e');             // borosta-árny
    // sisak
    p(-7, 63 + b, 14, 7, '#44523c');
    p(-8, 57 + b, 16, 3, '#39452f');
    p(-8, 59 + b, 16, 1, '#2f3a26');            // sisak-pánt
    p(-4, 62 + b, 6, 2, '#586a49');
    p(2, 64 + b, 3, 2, '#39452f');              // álcaháló-folt
    p(-5, 55 + b, 1, 6, '#2b2b2b');             // szíj

    /* karok */
    if (o.reload !== undefined) {
      // újratöltés: elülső kéz a tárnál
      const rf = o.reload; // 0..3
      const hy = [30, 26, 26, 32][rf];
      p(-9, 41 + b, 4, 8, '#4a5a40');
      p(-8, 34 + b, 8, 4, '#4a5a40');
      p(5, 40 + b, 5, 6, '#5f7452');
      p(6, hy + b, 8, 4, '#55684a');
      p(12, hy - 1 + b, 5, 5, SKIN);
    } else {
      // célzó tartás: mindkét kar előre
      p(-9, 41 + b, 4, 8, '#4a5a40');            // hátsó váll
      p(-8, 36 + b, 12, 4, '#4a5a40');           // hátsó alkar előre
      p(2, 36 + b, 5, 5, SKIN2);                 // hátsó kéz (foregrip)
      p(5, 41 + b, 5, 7, '#5f7452');             // elülső váll
      p(7, 37 + b, 9, 4, '#55684a');             // elülső alkar
      p(13, 37 + b, 5, 5, SKIN);                 // elülső kéz
    }
  }

  const P_IDLE = sheet(64, 100, 4, (g, i) => playerBody(g, { bob: [0, 0, 1, 1][i] }));
  const P_WALK = sheet(64, 100, 6, (g, i) => {
    const sw = [5, 3, -3, -5, -3, 3][i];
    playerBody(g, { lF: sw, lR: -sw, bob: i % 3 === 0 ? 0 : 1 });
  });
  const P_RELOAD = sheet(64, 100, 4, (g, i) => playerBody(g, { reload: i }));

  /* fegyverek — origó a markolatnál, csőirány +x (1.3× lépték a nagyobb karakterhez) */
  const GUNK = 1.3;
  function gunSheet(draw) {
    const [c, g] = mkc(76, 38);
    g.save();
    g.translate(22, 26);
    draw(g, mkP(g, GUNK));
    g.restore();
    return c;
  }

  const GUNS = {
    pistol: {
      mz: 13, mzy: -2.2,
      c: gunSheet((g, p) => {
        p(-2, 6, 13, 4, '#3a3a40'); p(-2, 6, 13, 1, '#585862');
        p(11, 5, 2, 2, '#26262c');
        p(-1, 2, 4, 6, '#2c2c30'); p(0, 0, 4, 4, '#26262a');
        p(4, 2, 5, 1, '#2c2c30');
      }),
    },
    uzi: {
      mz: 16, mzy: -2.6,
      c: gunSheet((g, p) => {
        p(-9, 5, 5, 2, '#3f3f46');                       // drótváll
        p(-4, 7, 17, 6, '#33333a'); p(-4, 7, 17, 1, '#4c4c55');
        p(13, 6, 4, 3, '#26262c');
        p(3, 1, 4, 8, '#26262a');                        // tár
        p(-2, 1, 4, 6, '#2c2c30');
      }),
    },
    shotgun: {
      mz: 22, mzy: -2.4,
      c: gunSheet((g, p) => {
        p(-12, 7, 9, 5, '#5c4630'); p(-12, 4, 6, 2, '#4a3826');
        p(-4, 6, 26, 3, '#3f4046'); p(-4, 6, 26, 1, '#5a5b64');
        p(5, 3, 9, 3, '#6b5238'); p(5, 3, 9, 1, '#7d6244');
        p(20, 6, 2, 3, '#26262c');
      }),
    },
    rifle: {
      mz: 20, mzy: -2.6,
      c: gunSheet((g, p) => {
        p(-13, 7, 9, 4, '#5c4630');
        p(-4, 7, 13, 4, '#3a3a3e'); p(-4, 7, 13, 1, '#54545c');
        p(6, 7, 8, 3, '#6b5238');                       // fa előagy
        p(12, 6, 8, 2, '#2f2f33');                      // cső
        p(0, 3, 4, 3, '#3d3d34'); p(1, 0, 4, 3, '#3d3d34'); p(3, -2, 4, 3, '#3d3d34'); // ívelt tár
        p(-1, 2, 4, 5, '#2c2c30');
      }),
    },
    flamer: {
      mz: 18, mzy: -2,
      c: gunSheet((g, p) => {
        p(-11, 8, 7, 10, '#7a3d20'); p(-11, 8, 7, 2, '#94512d'); p(-11, 4, 7, 1, '#54290f'); // tartály
        p(-3, 6, 17, 4, '#4a4a52'); p(-3, 6, 17, 1, '#63636e');
        p(14, 5, 5, 3, '#33333a');
        p(17, 4, 2, 2, '#ff9a3d');                      // őrláng
        p(0, 2, 4, 5, '#2c2c30');
      }),
    },
    minigun: {
      mz: 24, mzy: -3,
      c: gunSheet((g, p) => {
        p(-7, 10, 9, 11, '#2f2f33'); p(-7, 10, 9, 2, '#46464e');
        p(2, 9, 20, 2, '#3a3a42');
        p(2, 6, 22, 2, '#44444c');
        p(2, 3, 20, 2, '#3a3a42');
        p(22, 8, 3, 7, '#50505a');                      // elülső gyűrű
        p(-2, 0, 4, 5, '#26262a');
      }),
    },
    rocket: {
      mz: 26, mzy: -2.6,
      c: gunSheet((g, p) => {
        p(-9, 8, 27, 7, '#4a4a3c'); p(-9, 8, 27, 1, '#62624f');
        p(-9, 7, 2, 5, '#222220');
        p(18, 8, 3, 7, '#8f3a3a'); p(21, 7, 3, 5, '#a34444'); p(24, 5, 2, 3, '#b35050'); // robbanófej
        p(2, 11, 5, 3, '#3a3a30');                      // irányzék
        p(0, 1, 4, 5, '#2c2c30');
      }),
    },
    laser: {
      mz: 22, mzy: -2.8,
      c: gunSheet((g, p) => {
        p(-5, 8, 23, 5, '#2c3a44'); p(-5, 8, 23, 1, '#41586a');
        p(-2, 5, 18, 1, '#57c8e8');
        p(18, 8, 4, 5, '#57c8e8'); p(19, 7, 2, 3, '#c8f2ff');
        p(0, 10, 6, 2, '#22303a');
        p(4, 3, 6, 3, '#1e2c34'); p(5, 2, 2, 1, '#7de0ff');
        p(-1, 2, 4, 5, '#26303a');
      }),
    },
  };

  /* torkolattűz — 3 keret, közép-origó */
  const MUZZLE = sheet(28, 28, 3, (g, i) => {
    const p = mkP(g);
    g.translate(0, -14);
    if (i === 0) {
      p(-3, 5, 10, 10, '#fff6d0'); p(-6, 2, 16, 4, '#ffd76a');
    } else if (i === 1) {
      p(-7, 3, 18, 6, '#ffd76a'); p(-3, 7, 10, 14, '#ffb84d');
      p(-1, 4, 6, 8, '#fff6d0'); p(6, 8, 6, 3, '#ff9a3d'); p(6, -2, 6, 3, '#ff9a3d');
    } else {
      p(-4, 3, 10, 6, '#ffb84d'); p(-1, 2, 5, 4, '#ffe9a8');
    }
  });

  const GUN_ANCHOR = { x: 8.4, y: -24 }; // logikai — kéz pozíció (1.3× testhez)

  function drawPlayer(ctx, o) {
    /* o: {x,y,facing,moving,phase,idleT,fireAnim,reloadT,flash,weapon,deathT} */
    /* ÚJ: HD katona-sprite, ha betöltött; különben a procedurális rajz (alább) */
    if (ZD.enemySprites && ZD.enemySprites.hasPlayer()) {
      if (ZD.enemySprites.drawPlayer(ctx, o)) return;
    }

    /* halál: eldőlés + elhalványulás (fegyver nélkül) */
    if (o.deathT !== undefined && o.deathT > 0) {
      const fall = Math.min(1, o.deathT / 0.55);
      const ease = 1 - (1 - fall) * (1 - fall);
      const alpha = o.deathT < 0.9 ? 1 : Math.max(0.25, 1 - (o.deathT - 0.9) / 1.2);
      blitRot(ctx, P_IDLE, 0, o.x, o.y, o.facing, -ease * 1.55, alpha);
      return;
    }

    let sh, frame;
    if (o.reloadT > 0) {
      sh = P_RELOAD; frame = Math.min(3, ((1 - o.reloadT / 0.5) * 4) | 0);
    } else if (o.moving) {
      sh = P_WALK; frame = (o.phase * 1.7) | 0;
    } else {
      sh = P_IDLE; frame = (o.idleT * 3) | 0;
    }
    blit(ctx, sh, frame, o.x, o.y, o.facing);

    /* fegyver a kézben — lövésnél hátrarúg */
    const gun = GUNS[o.weapon.id] || GUNS.pistol;
    const rec = o.fireAnim > 0 ? -2 : 0;
    const tilt = o.reloadT > 0 ? 0.5 : (o.fireAnim > 0 ? -0.06 : 0);
    ctx.save();
    ctx.translate(r2(o.x), r2(o.y));
    if (o.facing < 0) ctx.scale(-1, 1);
    ctx.translate(GUN_ANCHOR.x + rec, GUN_ANCHOR.y + (o.moving ? -0.5 : 0));
    if (tilt) ctx.rotate(tilt);
    ctx.drawImage(gun.c, -22 / ART, -26 / ART, 76 / ART, 38 / ART);
    ctx.restore();

    /* torkolattűz — fegyverenként eltérő méret */
    if (o.fireAnim > 0 && o.weapon.kind !== 'flame') {
      const fs = (o.weapon.flashScale || 1) * 1.35;
      const mx = o.x + o.facing * (GUN_ANCHOR.x + gun.mz * 0.65 + rec);
      const my = o.y + GUN_ANCHOR.y + gun.mzy * 1.3;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(r2(mx), r2(my));
      if (o.facing < 0) ctx.scale(-1, 1);
      const mf = (o.muzzleSeed || 0) % 3;
      ctx.drawImage(MUZZLE.c, mf * 28, 0, 28, 28, -4 / ART * fs, -14 / ART * fs, 28 / ART * fs, 28 / ART * fs);
      // fényudvar
      ctx.globalAlpha = 0.25;
      pxCircle(ctx, 4 * fs, 0, 9 * fs, '#ffd76a', 1);
      ctx.restore();
    }

    /* sérülés-villanás */
    if (o.flash > 0) {
      blitTint(ctx, sh, frame, o.x, o.y, o.facing, '#ff5548', Math.min(o.flash * 2.4, 0.6));
    }
  }

  /* =====================================================================
     ZOMBIK — 6 típus × 2 variáns, walk 4 + attack 3 keret
     ===================================================================== */
  const ZPAL = {
    walker: [
      { skin: '#7fa35e', skin2: '#66854a', cloth: '#5a5f6e', cloth2: '#464a56', acc: '#7e2f2f', eye: '#e04a3a', hair: '#3c3b33' },
      { skin: '#8fae62', skin2: '#75934f', cloth: '#6e5a5a', cloth2: '#584646', acc: '#3a4a56', eye: '#ffd23d', hair: '#55503f' },
    ],
    runner: [
      { skin: '#9db06b', skin2: '#829456', cloth: '#6b4a4a', cloth2: '#553a3a', acc: '#2e3d4a', eye: '#ffd23d', hair: '#2e2b26' },
      { skin: '#a8b06b', skin2: '#8d9456', cloth: '#44566b', cloth2: '#364456', acc: '#6b4a2e', eye: '#ff8a3d', hair: '#3c332a' },
    ],
    crawler: [
      { skin: '#6f9455', skin2: '#5a7a44', cloth: '#4a4a52', cloth2: '#3a3a42', acc: '#6e2424', eye: '#e04a3a', hair: '#33312b' },
      { skin: '#7d9c52', skin2: '#668043', cloth: '#5c4a3a', cloth2: '#483a2e', acc: '#6e2424', eye: '#c8ff4a', hair: '#403a30' },
    ],
    spitter: [
      { skin: '#8a7bb0', skin2: '#726394', cloth: '#4a5266', cloth2: '#3a4152', acc: '#b0ff5b', eye: '#b0ff5b', hair: '#2f2a3d' },
      { skin: '#9a7ba4', skin2: '#7f6389', cloth: '#5c4a66', cloth2: '#493a52', acc: '#d0ff7a', eye: '#e0ff9a', hair: '#3a2f42' },
    ],
    brute: [
      { skin: '#5b8a52', skin2: '#487041', cloth: '#3d3d46', cloth2: '#2e2e36', acc: '#8f3a2a', eye: '#ff5b3d', hair: '#2c3226' },
      { skin: '#6d8a52', skin2: '#577041', cloth: '#463d3d', cloth2: '#362e2e', acc: '#8f3a2a', eye: '#ffb03d', hair: '#33302a' },
    ],
    boss: [
      { skin: '#4a6b45', skin2: '#3a5636', cloth: '#2e2e36', cloth2: '#22222a', acc: '#ff3d3d', eye: '#ff3d3d', hair: '#1e241c', metal: '#3a3d46', metal2: '#565a68' },
      { skin: '#4a6b45', skin2: '#3a5636', cloth: '#2e2e36', cloth2: '#22222a', acc: '#ff3d3d', eye: '#ff3d3d', hair: '#1e241c', metal: '#3a3d46', metal2: '#565a68' },
    ],
  };

  const ZDRAW = {
    walker(g, v, f, atk) {
      const p = mkP(g, 1.3);
      const sw = atk >= 0 ? 0 : [3, 0, -3, 0][f];
      const bob = atk >= 0 ? 0 : [0, 1, 0, 1][f];
      // karok magassága: támadásnál felemel → lecsap
      const aT = atk >= 0 ? [44, 48, 30][atk] : 36 - bob;
      const aB = atk >= 0 ? [38, 42, 26][atk] : 31 - bob;
      // lábak
      p(-8 - sw, 16, 5, 13, v.cloth2);
      p(-9 - sw, 3, 7, 3, '#26262a');
      p(2 + sw, 16, 5, 13, v.cloth);
      p(1 + sw, 3, 7, 3, v.skin2);              // hiányzó cipő
      p(3 + sw, 17, 3, 2, v.skin);              // szakadt nadrág térd
      // törzs (enyhén előredőlt)
      p(-8, 40 - bob, 17, 24, v.cloth);
      p(-8, 40 - bob, 3, 24, v.cloth2);
      p(-8, 40 - bob, 17, 2, v.cloth2);
      p(-2, 30 - bob, 5, 7, v.skin2);           // kilátszó has
      p(-1, 28 - bob, 3, 1, v.skin);            // borda-vonal
      p(-1, 26 - bob, 3, 1, v.skin);
      p(3, 38 - bob, 3, 9, v.acc);              // nyakkendő-maradvány
      p(-7, 40 - bob, 4, 3, '#7e2f2f');         // váll-seb
      p(-6, 33 - bob, 3, 2, '#6e2424');         // oldalseb
      p(5, 25 - bob, 3, 4, v.skin2);            // szakadt ing-lyuk
      // karok előrenyújtva
      p(1, aT, 12, 4, v.skin2);
      p(12, aT - 1, 4, 4, v.skin2);
      p(3, aB, 12, 4, v.skin);
      p(14, aB - 1, 4, 4, v.skin);
      // fej (oldalra billent)
      p(-3, 55 - bob, 11, 12, v.skin);
      p(-3, 46 - bob, 11, 3, v.skin2);
      p(-4, 57 - bob, 12, 3, v.hair);
      p(0, 58 - bob, 2, 2, v.hair); p(4, 58 - bob, 2, 2, v.hair);
      p(4, 51 - bob, 2, 2, v.eye);
      p(-1, 51 - bob, 2, 2, '#20201c');
      p(1, 47 - bob, 5, 2, '#331414');          // nyitott száj
      p(-2, 49 - bob, 2, 2, v.acc);             // arcseb
    },

    runner(g, v, f, atk) {
      const p = mkP(g, 1.3);
      const sw = atk >= 0 ? 2 : [6, 0, -6, 0][f];
      const bob = atk >= 0 ? 2 : [1, 0, 1, 0][f];
      // vékony lábak, nagy kilépés
      p(-7 - sw, 14, 4, 12, v.cloth2);
      p(-9 - sw * 1.3, 3, 7, 3, '#2a2a2e');
      p(3 + sw, 14, 4, 12, v.cloth);
      p(3 + sw * 1.3, 3, 7, 3, '#32323a');
      // előredőlt törzs (két lépcsős)
      p(-6, 34 - bob, 13, 12, v.cloth);
      p(-2, 42 - bob, 13, 12, v.cloth);
      p(-2, 42 - bob, 13, 2, v.cloth2);
      p(6, 36 - bob, 4, 4, v.skin2);            // szakadás
      // karok: futásnál hátracsapva / támadásnál előre
      if (atk >= 0) {
        const ay = [40, 44, 34][atk];
        p(6, ay, 12, 3, v.skin);
        p(17, ay - 1, 4, 4, v.skin);
        p(4, ay - 6, 11, 3, v.skin2);
      } else {
        p(-13, 36 - bob, 10, 3, v.skin2);
        p(-16, 33 - bob, 4, 4, v.skin2);
        p(8, 38 - bob, 8, 3, v.skin);
      }
      // fej előreszegve + kapucni
      p(3, 54 - bob, 10, 11, v.skin);
      p(3, 46 - bob, 10, 2, v.skin2);
      p(1, 56 - bob, 13, 4, v.cloth2);          // kapucni
      p(1, 52 - bob, 3, 8, v.cloth2);
      p(9, 51 - bob, 2, 2, v.eye);
      p(6, 47 - bob, 5, 2, '#331414');
    },

    crawler(g, v, f, atk) {
      const p = mkP(g, 1.3);
      const drag = f % 2 ? 2 : 0;
      const up = atk >= 0 ? [2, 5, 1][atk] : 0;
      // vonszolt csonkok hátul
      p(-22 + drag, 7, 9, 4, v.cloth2);
      p(-24 + drag, 5, 6, 3, v.skin2);
      // gerinc-törzs
      p(-16, 13 + up * 0.4, 24, 10, v.cloth);
      p(-16, 13 + up * 0.4, 24, 2, v.cloth2);
      for (let i = 0; i < 5; i++) p(-13 + i * 5, 15 + up * 0.4, 2, 2, v.skin2); // gerinc-dudorok
      p(-10, 6, 16, 3, '#5a1c1c');              // vérnyom alatta
      // fej elöl, felfelé néz
      p(6, 18 + up, 11, 10, v.skin);
      p(6, 10 + up, 11, 2, v.skin2);
      p(7, 19 + up, 9, 2, v.hair);
      p(12, 15 + up, 2, 2, v.eye);
      p(9, 11 + up, 6, 2, '#331414');
      // húzó kar (keretenként váltva)
      if (atk >= 0) {
        p(14, 16 + up, 9, 3, v.skin);
        p(21, 14 + up, 4, 4, v.skin);
      } else if (f % 2) {
        p(13, 14, 10, 3, v.skin);
        p(21, 12, 4, 4, v.skin);
      } else {
        p(13, 8, 9, 3, v.skin);
        p(20, 9, 4, 5, v.skin);
      }
    },

    spitter(g, v, f, atk) {
      const p = mkP(g, 1.3);
      const bob = [0, 1, 0, 1][atk >= 0 ? 0 : f];
      const pulse = (atk >= 0 ? 1 : f % 2);
      // köpeny-alj
      p(-11, 10, 22, 10, v.cloth2);
      p(-9, 34 - bob, 18, 26, v.cloth);
      p(-9, 34 - bob, 3, 26, v.cloth2);
      // püffedt, világító has
      p(-7, 28 - bob, 14, 13, v.skin2);
      p(-5, 26 - bob, 10, 9, pulse ? '#a6d84e' : '#8cbc3e');
      p(-3, 24 - bob, 6, 5, pulse ? '#ccf27a' : '#b0dc60');
      p(-8, 32 - bob, 2, 2, '#c8e860');          // gennyes hólyagok
      p(6, 27 - bob, 2, 2, '#c8e860');
      p(-6, 19 - bob, 2, 2, '#a6c84e');
      // vékony karok felhúzva
      p(-11, 38 - bob, 4, 10, v.skin2);
      p(8, 38 - bob, 4, 10, v.skin);
      p(8, 30 - bob, 4, 3, v.skin);
      // fej + csuklya
      const hb = atk === 0 ? 2 : atk >= 1 ? -1 : 0;  // támadásnál hátra→előre
      p(-4, 54 - bob + hb, 10, 11, v.skin);
      p(-6, 58 - bob + hb, 14, 5, v.cloth2);
      p(-6, 54 - bob + hb, 3, 9, v.cloth2);
      p(3, 50 - bob + hb, 2, 2, v.eye);
      p(0, 46 - bob + hb, 5, atk >= 1 ? 4 : 2, '#2a3312');
      if (atk >= 1) p(3, 44 - bob, 3, 3, v.acc); // nyálcsomó
      p(2, 42 - bob, 1, 5, v.acc);               // csorgó nyál
    },

    brute(g, v, f, atk) {
      const p = mkP(g, 1.3);
      const sw = atk >= 0 ? 0 : [2, 0, -2, 0][f];
      const bob = atk >= 0 ? 0 : [0, 1, 0, 1][f];
      // oszlop-lábak
      p(-12 - sw, 22, 9, 19, v.cloth);
      p(-14 - sw, 4, 12, 4, '#26262a');
      p(4 + sw, 22, 9, 19, v.cloth2);
      p(3 + sw, 4, 12, 4, '#2c2c30');
      // hatalmas törzs
      p(-16, 56 - bob, 32, 36, v.skin);
      p(-16, 56 - bob, 5, 36, v.skin2);
      p(-6, 50 - bob, 3, 24, v.skin2);          // izom-árnyék
      p(3, 48 - bob, 3, 20, v.skin2);
      p(-13, 44 - bob, 12, 8, v.cloth2);        // szakadt ing-csík
      p(-8, 52 - bob, 5, 4, v.acc);             // seb
      p(6, 40 - bob, 4, 2, v.acc);              // karmolás-hegek
      p(5, 37 - bob, 4, 2, v.acc);
      p(-14, 30 - bob, 3, 6, '#6b5a48');        // betondarab a bőrben
      // vállak + betonvas
      p(-21, 60 - bob, 13, 10, v.skin2);
      p(9, 61 - bob, 13, 10, v.skin2);
      p(13, 70 - bob, 3, 9, '#6b5a48');
      p(14, 74 - bob, 3, 3, '#54453a');
      // karok
      const aLift = atk >= 0 ? [16, 20, -4][atk] : 0;
      p(-24, 52 - bob + aLift * 0.5, 8, 24, v.skin2);
      p(-26, 30 - bob + aLift * 0.5, 11, 9, v.skin2);   // hátsó ököl
      p(14, 54 - bob + aLift, 9, 26, v.skin);
      p(14, 30 - bob + aLift, 12, 10, v.skin2);          // elülső ököl
      // kis fej besüllyesztve
      p(-4, 64 - bob, 11, 10, v.skin);
      p(-4, 66 - bob, 11, 2, v.hair);
      p(2, 61 - bob, 2, 2, v.eye);
      p(-2, 61 - bob, 2, 2, v.eye);
      p(-1, 57 - bob, 6, 2, '#331414');
    },

    boss(g, v, f, atk) {
      const p = mkP(g, 1.2);
      const sw = atk >= 0 ? 0 : [3, 0, -3, 0][f];
      const bob = atk >= 0 ? 0 : [0, 2, 0, 2][f];
      // lábak páncélozott csizmával
      p(-20 - sw, 36, 14, 30, v.cloth);
      p(-23 - sw, 7, 18, 7, v.metal);
      p(-23 - sw, 7, 18, 2, v.metal2);
      p(7 + sw, 36, 14, 30, v.cloth2);
      p(5 + sw, 7, 18, 7, v.metal);
      p(5 + sw, 7, 18, 2, v.metal2);
      // masszív törzs
      p(-26, 92 - bob, 52, 58, v.skin);
      p(-26, 92 - bob, 8, 58, v.skin2);
      p(-10, 80 - bob, 4, 36, v.skin2);
      p(6, 76 - bob, 4, 30, v.skin2);
      // mellvért-lemezek
      p(-22, 88 - bob, 44, 14, v.metal);
      p(-22, 88 - bob, 44, 3, v.metal2);
      p(-20, 86 - bob, 3, 3, v.metal2); p(14, 86 - bob, 3, 3, v.metal2); // szegecsek
      p(-8, 86 - bob, 3, 3, v.metal2); p(2, 86 - bob, 3, 3, v.metal2);
      p(-22, 80 - bob, 44, 1, '#20232a');       // lemez-illesztés
      p(-18, 60 - bob, 10, 8, v.metal);          // has-lemez törött darabja
      p(-16, 58 - bob, 3, 2, v.metal2);
      // izzó mellkas-seb
      p(-6, 66 - bob, 12, 10, '#7e1c10');
      p(-3, 63 - bob, 6, 5, f % 2 ? '#ff6a3a' : '#e04a20');
      // vállak + tüskék
      p(-36, 96 - bob, 18, 15, v.skin2);
      p(18, 98 - bob, 18, 15, v.skin2);
      p(-32, 108 - bob, 5, 12, v.metal); p(-31, 112 - bob, 3, 6, v.metal2);
      p(24, 110 - bob, 5, 14, v.metal); p(25, 115 - bob, 3, 7, v.metal2);
      // karok
      const aLift = atk >= 0 ? [26, 32, -8][atk] : 0;
      p(-40, 88 - bob + aLift * 0.5, 12, 40, v.skin2);
      p(-44, 48 - bob + aLift * 0.5, 17, 14, v.skin2);
      p(24, 90 - bob + aLift, 13, 42, v.skin);
      p(24, 48 - bob + aLift, 19, 16, v.skin2);
      // lánc a csuklón
      for (let i = 0; i < 4; i++) p(30 + i * 3, 44 - bob + aLift - i * 3, 3, 3, '#6a6f7a');
      // fej szarvakkal
      p(-8, 106 - bob, 17, 15, v.skin);
      p(-8, 109 - bob, 17, 3, v.hair);
      p(-10, 116 - bob, 5, 8, v.metal); p(6, 114 - bob, 5, 7, v.metal);
      p(3, 101 - bob, 3, 3, v.eye);
      p(-4, 101 - bob, 3, 3, v.eye);
      p(-2, 95 - bob, 10, 3, '#331414');
      for (let i = 0; i < 3; i++) p(-1 + i * 3, 95 - bob, 1, 2, '#ddd0b8'); // fogak
    },
  };

  const ZDIM = {
    walker:  { fw: 58, fh: 98 },
    runner:  { fw: 62, fh: 92 },
    crawler: { fw: 74, fh: 48 },
    spitter: { fw: 58, fh: 100 },
    brute:   { fw: 84, fh: 132 },
    boss:    { fw: 122, fh: 166 },
  };

  const ZSHEETS = {};
  Object.keys(ZDRAW).forEach((type) => {
    const d = ZDIM[type];
    ZSHEETS[type] = ZPAL[type].map((v) => ({
      walk: sheet(d.fw, d.fh, 4, (g, i) => ZDRAW[type](g, v, i, -1)),
      attack: sheet(d.fw, d.fh, 3, (g, i) => ZDRAW[type](g, v, 0, i)),
    }));
  });

  function drawZombie(ctx, z) {
    /* z: {type, variant, x, y, facing, phase, attacking, atkT, flash, dead, deathT, hpRatio,
          anim, moving, attackingAnim, warnT, bossState, elite, enrage} */
    /* ÚJ: part-rig (Kóbor) — járás + testszakadás. Ha van rig a típushoz, azt
       használjuk; halottnál nincs holttest-rajz, a leszakadt testrészek (gibek)
       kezelik a game.js render-jében. */
    if (ZD.partRig && ZD.partRig.has(z.type)) {
      /* Szétszakadt (gib) halál -> a leszakadt testrészek képviselik, nincs holttest.
         Normál halál -> a rig rajzolja az összecsuklást (z.deathT alapján). */
      if (z.dead && z.gibbed) return;
      if (ZD.partRig.draw(ctx, z)) return;
    }
    /* ÚJ: kép-alapú sprite, ha betöltött; különben a procedurális rajz (alább) */
    if (ZD.enemySprites && ZD.enemySprites.has(z.type)) {
      if (ZD.enemySprites.draw(ctx, z, z.y)) return;
    }
    /* procedurális fallback — új típusnak (bloater) nincs saját proc-sheetje → brute-ot használ */
    const ptype = ZSHEETS[z.type] ? z.type : (z.type === 'bloater' ? 'brute' : 'walker');
    const sheets = ZSHEETS[ptype][z.variant || 0];
    z = (ptype === z.type) ? z : Object.assign({}, z, { type: ptype });

    if (z.dead) {
      // hátraeséses halál: forgás a láb körül, majd elhalványul
      const fall = Math.min(1, z.deathT / 0.45);
      const alpha = z.deathT < 0.7 ? 1 : Math.max(0, 1 - (z.deathT - 0.7) / 0.5);
      if (z.type === 'crawler') {
        blitRot(ctx, sheets.walk, 0, z.x, z.y, z.facing, 0, alpha, 1 - fall * 0.55);
      } else {
        const ease = 1 - (1 - fall) * (1 - fall);
        blitRot(ctx, sheets.walk, 0, z.x, z.y, z.facing, -ease * 1.5, alpha);
      }
      return;
    }

    const s = z.elite ? 1.14 : 1;

    /* elit aura: pulzáló gyűrű a talpán */
    if (z.elite) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16 + 0.08 * Math.sin((z.phase || 0) * 2.2);
      pxCircle(ctx, z.x, z.y - 1, 13, '#ffc14d', 1);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffc14d';
      ctx.fillRect(z.x - 12, z.y - 1, 24, 1.5);
      ctx.restore();
    }

    let sh, frame;
    if (z.attacking) {
      sh = sheets.attack;
      frame = Math.min(2, (z.atkT * 12) | 0);
    } else {
      sh = sheets.walk;
      frame = (z.phase * 1.1) | 0;
    }
    blit(ctx, sh, frame, z.x, z.y, z.facing, 1, s);
    if (z.flash > 0) {
      blitTint(ctx, sh, frame, z.x, z.y, z.facing, '#ffffff', Math.min(z.flash * 6, 0.85), s);
    }
    /* enrage: pulzáló vörös derengés a bosson */
    if (z.enrage) {
      blitTint(ctx, sh, frame, z.x, z.y, z.facing, '#ff3020', 0.14 + 0.1 * Math.sin((z.phase || 0) * 5), s);
    }

    /* HP-csík (csak sérültnek) */
    if (z.hpRatio < 1 && z.hpRatio > 0) {
      const bw = Math.max(ZDIM[z.type].fw / ART * 0.8, 14) * s;
      const bx = z.x - bw / 2, by = z.y - ZDIM[z.type].fh / ART * s - 4;
      ctx.fillStyle = 'rgba(10,6,6,.8)';
      ctx.fillRect(bx - 0.5, by - 0.5, bw + 1, 3);
      ctx.fillStyle = z.elite ? '#ffc14d' : (z.type === 'boss' || z.type === 'brute' ? '#ff5b3d' : '#7ddb4f');
      ctx.fillRect(bx, by, bw * z.hpRatio, 2);
    }
  }

  /* =====================================================================
     ROBBANÁS, PICKUPOK
     ===================================================================== */
  const BOOM = sheet(120, 120, 8, (g, i) => {
    g.translate(0, -60);
    const t = i / 7;
    // lökéshullám-gyűrű
    if (t > 0.1) {
      const r = 10 + t * 52;
      g.globalAlpha = Math.max(0, 0.8 - t);
      pxCircle(g, 0, 0, r, '#ffd9a0', 2);
      g.globalAlpha = 1;
      g.save();
      g.globalCompositeOperation = 'destination-out';
      pxCircle(g, 0, 0, Math.max(0, r - 4), '#000', 2);
      g.restore();
    }
    // tűzgolyó
    const fr = (t < 0.45 ? t / 0.45 : Math.max(0, 1 - (t - 0.45) * 1.6)) * 38;
    if (fr > 2) {
      pxCircle(g, 0, 2, fr, '#c33f1e', 2);
      pxCircle(g, 0, 0, fr * 0.75, '#ff7a2a', 2);
      pxCircle(g, -2, -2, fr * 0.5, '#ffd23d', 2);
      if (t < 0.4) pxCircle(g, -2, -3, fr * 0.28, '#fff6d8', 2);
    }
    // füst
    if (t > 0.35) {
      g.globalAlpha = Math.max(0, 0.55 - (t - 0.35));
      pxCircle(g, -18, -14 - t * 16, 10 + t * 8, '#3a3632', 2);
      pxCircle(g, 14, -20 - t * 18, 8 + t * 8, '#443f3a', 2);
      pxCircle(g, 0, -26 - t * 20, 9 + t * 7, '#38342f', 2);
      g.globalAlpha = 1;
    }
  });

  function drawBoom(ctx, x, y, t01, scale = 1) {
    ctx.save();
    if (t01 < 0.3) ctx.globalCompositeOperation = 'lighter';
    blitC(ctx, BOOM, t01 * 8, x, y - 8 * scale, scale, 1);
    ctx.restore();
  }

  const COIN = sheet(14, 14, 6, (g, i) => {
    g.translate(0, -7);
    const w = [12, 9, 5, 2, 5, 9][i];
    const p = mkP(g);
    p(-w / 2, 6, w, 12, '#a87820');
    p(-w / 2, 6, w, 11, '#ffc14d');
    if (w > 4) {
      p(-w / 4, 4, Math.max(1, w / 3), 7, '#a87820');
      p(-w / 2 + 1, 5, 2, 2, '#ffe9a8');
    }
  });

  function drawCoin(ctx, c, t) {
    blit(ctx, COIN, (t * 10 + (c.spin || 0)) | 0, c.x, c.y + 4);
  }

  const MED = sheet(22, 18, 2, (g, i) => {
    const p = mkP(g);
    p(-10, 16, 20, 15, '#8a8f96');
    p(-9, 16, 18, 14, i ? '#f2f2f0' : '#e2e2e0');
    p(-9, 16, 18, 3, '#c8c8c4');
    p(-2, 13, 4, 9, '#d43d3d');
    p(-5, 10, 10, 4, '#d43d3d');
  });

  function drawMed(ctx, m, t) {
    const bob = Math.sin(t * 4 + m.x) * 1.5;
    // glow
    ctx.save();
    ctx.globalAlpha = 0.14 + 0.08 * Math.sin(t * 5);
    pxCircle(ctx, m.x, m.y - 3 + bob, 10, '#7ddb4f', 1);
    ctx.restore();
    blit(ctx, MED, (t * 3) | 0, m.x, m.y + 2 + bob);
  }

  const GRENADE = sheet(12, 14, 1, (g) => {
    const p = mkP(g);
    p(-3, 9, 7, 8, '#3d4a33');
    p(-3, 9, 7, 2, '#4c5c40');
    p(-2, 11, 4, 2, '#556047');
    p(0, 13, 3, 2, '#8a8f7a');   // kanál
    p(-1, 12, 2, 2, '#6a6f5a');
  });

  function drawGrenade(ctx, gr, t) {
    ctx.save();
    ctx.translate(r2(gr.x), r2(gr.y));
    ctx.rotate(t * 9 + gr.x);
    ctx.drawImage(GRENADE.c, -3, -4, 6, 7);
    ctx.restore();
  }

  /* védendő generátor (defense mód) — homokzsákok + gépezet */
  const GEN = sheet(84, 60, 2, (g, i) => {
    const p = mkP(g);
    // homokzsák-alap
    p(-38, 12, 20, 10, '#4a4232');
    p(-34, 20, 18, 9, '#544a38');
    p(20, 12, 20, 10, '#4a4232');
    p(16, 20, 18, 9, '#544a38');
    // gépház
    p(-16, 40, 32, 38, '#3a4048');
    p(-16, 40, 32, 4, '#4c545e');
    p(-16, 40, 4, 38, '#31373e');
    // hűtőrács
    for (let r = 0; r < 4; r++) p(-11, 33 - r * 6, 22, 3, '#262b31');
    // állapotjelző lámpa (villog)
    p(-6, 48, 12, 6, '#22262b');
    p(-3, 46, 6, 3, i ? '#7ddb4f' : '#3f8f27');
    // kipufogó
    p(12, 46, 6, 8, '#2c3138');
    // kábelek
    p(-24, 6, 10, 3, '#22262b');
    p(16, 5, 12, 3, '#22262b');
  });

  function drawGenerator(ctx, gen, t) {
    const blink = (t * 2.5) | 0;
    blit(ctx, GEN, blink, gen.x, C.GROUND_Y + 1);
    /* HP-csík fölötte */
    const r = Math.max(0, gen.hp / gen.maxHp);
    const bw = 34, bx = gen.x - bw / 2, by = C.GROUND_Y - 38;
    ctx.fillStyle = 'rgba(8,8,12,.85)';
    ctx.fillRect(bx - 1.5, by - 1.5, bw + 3, 6);
    ctx.fillStyle = '#26303a';
    ctx.fillRect(bx, by, bw, 3);
    ctx.fillStyle = r > 0.5 ? '#5bc8d8' : r > 0.25 ? '#ffc14d' : '#e5484d';
    ctx.fillRect(bx, by, bw * r, 3);
    /* rajzolt pajzs-jel (emoji helyett) */
    const sc = r > 0.5 ? '#8fd8e8' : r > 0.25 ? '#ffd98a' : '#ff8a7a';
    const sx = gen.x, sy = by - 7;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 3.5);
    ctx.lineTo(sx + 3, sy - 2);
    ctx.lineTo(sx + 3, sy + 1.5);
    ctx.quadraticCurveTo(sx + 3, sy + 3.5, sx, sy + 4.5);
    ctx.quadraticCurveTo(sx - 3, sy + 3.5, sx - 3, sy + 1.5);
    ctx.lineTo(sx - 3, sy - 2);
    ctx.closePath();
    ctx.fillStyle = sc;
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(sx - 0.5, sy - 2, 1, 5.5);
  }

  /* lőszerláda pickup */
  const AMMOBOX = sheet(24, 18, 2, (g, i) => {
    const p = mkP(g);
    p(-10, 15, 20, 14, '#3f4a36');
    p(-10, 15, 20, 3, i ? '#556047' : '#4a5540');
    p(-10, 15, 3, 14, '#343d2c');
    p(-6, 9, 12, 4, '#2c3326');
    p(-4, 8, 3, 2, '#c9a44a');   // töltények
    p(0, 8, 3, 2, '#c9a44a');
    p(4, 8, 3, 2, '#c9a44a');
  });

  function drawAmmoBox(ctx, a, t) {
    const bob = Math.sin(t * 4 + a.x) * 1.5;
    ctx.save();
    ctx.globalAlpha = 0.13 + 0.07 * Math.sin(t * 5);
    pxCircle(ctx, a.x, a.y - 3 + bob, 9, '#ffc14d', 1);
    ctx.restore();
    blit(ctx, AMMOBOX, (t * 3) | 0, a.x, a.y + 2 + bob);
  }

  function drawShell(ctx, s) {
    ctx.save();
    ctx.translate(r2(s.x), r2(s.y));
    ctx.rotate(s.rot);
    ctx.fillStyle = '#c9a44a';
    ctx.fillRect(-1.5, -0.75, 3, 1.5);
    ctx.fillStyle = '#8f742f';
    ctx.fillRect(0.75, -0.75, 0.75, 1.5);
    ctx.restore();
  }

  /* =====================================================================
     HÁTTEREK — 3 téma: elhagyott utca / labor-bunker / romos város
     ===================================================================== */
  const GY = C.GROUND_Y;
  const TILE_H = GY * ART;

  /* --- 1. téma: ELHAGYOTT UTCA --- */
  function streetFar() {
    const W = 520;
    const [c, g] = mkc(W, TILE_H);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const rnd = lcg(77);
    const H = TILE_H;
    // épület-sziluettek
    const bs = [[14, 150, 96], [126, 120, 78], [216, 176, 110], [340, 138, 86], [438, 160, 70]];
    bs.forEach(([bx, bh, bw], bi) => {
      p(bx, H - bh, bw, bh, '#10161c');
      // tetőelemek
      p(bx + 8, H - bh - 10, 14, 10, '#10161c');
      if (bi % 2) p(bx + bw - 20, H - bh - 16, 4, 16, '#10161c'); // antenna
      // gyér világító ablakok
      for (let wy = H - bh + 14; wy < H - 24; wy += 22) {
        for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) {
          if (rnd() < 0.12) p(wx, wy, 5, 7, rnd() < 0.5 ? '#5a5636' : '#454a38');
          else if (rnd() < 0.3) p(wx, wy, 5, 7, '#181f26');
        }
      }
    });
    // víztorony
    p(240, H - 210, 24, 18, '#0d1318');
    p(244, H - 192, 3, 18, '#0d1318'); p(257, H - 192, 3, 18, '#0d1318');
    return c;
  }

  function streetMid() {
    const W = 560;
    const [c, g] = mkc(W, TILE_H);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const H = TILE_H;
    const rnd = lcg(31);
    // közelebbi házak
    const bs = [[0, 118, 130, '#1a1e26'], [170, 96, 110, '#1e222b'], [320, 128, 120, '#181c24'], [470, 100, 90, '#1c2029']];
    bs.forEach(([bx, bh, bw, col]) => {
      p(bx, H - bh, bw, bh, col);
      p(bx, H - bh, bw, 4, '#23283333');
      // bedeszkázott ablakok
      for (let wy = H - bh + 12; wy < H - 26; wy += 30) {
        for (let wx = bx + 10; wx < bx + bw - 14; wx += 30) {
          p(wx, wy, 12, 16, '#0e1116');
          if (rnd() < 0.55) {
            p(wx - 1, wy + 3, 14, 3, '#3d3226');
            p(wx - 1, wy + 9, 14, 3, '#352c22');
          } else if (rnd() < 0.2) {
            p(wx + 2, wy + 4, 4, 5, '#665f34'); // pislákoló fény
          }
        }
      }
      // graffiti folt
      if (rnd() < 0.7) p(bx + 14 + rnd() * 40, H - 26, 22, 12, 'rgba(90,60,100,.25)');
    });
    // villanyoszlop + lógó kábelek
    [140, 450].forEach((px_) => {
      p(px_, H - 150, 4, 150, '#14171d');
      p(px_ - 12, H - 148, 28, 3, '#14171d');
      g.strokeStyle = '#111419'; g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(px_ + 2, H - 144);
      g.quadraticCurveTo(px_ + 100, H - 110, px_ + 200, H - 146);
      g.stroke();
    });
    return c;
  }

  function streetNear() {
    const W = 260;
    const [c, g] = mkc(W, 76);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // drótkerítés
    for (let x = 0; x < W; x += 52) p(x, 6, 4, 70, '#1d2520');
    p(0, 10, W, 3, '#1a221d');
    p(0, 62, W, 3, '#1a221d');
    g.strokeStyle = '#161e19'; g.lineWidth = 1;
    for (let x = -20; x < W + 20; x += 10) {
      g.beginPath(); g.moveTo(x, 12); g.lineTo(x + 26, 62); g.stroke();
      g.beginPath(); g.moveTo(x + 26, 12); g.lineTo(x, 62); g.stroke();
    }
    return c;
  }

  function streetGround() {
    const W = 260;
    const Hh = (C.VIEW_H - GY) * ART;
    const [c, g] = mkc(W, Hh);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const rnd = lcg(descSeed('street'));
    p(0, 0, W, Hh, '#23262b');
    p(0, 0, W, 8, '#2c2f35');           // járdaszegély
    p(0, 8, W, 2, '#191c20');
    // felezővonal-szakasz
    p(30, 34, 34, 5, '#5a5636');
    p(150, 34, 34, 5, '#555133');
    // repedések
    g.strokeStyle = '#1a1d21'; g.lineWidth = 2;
    [[20, 14, 60, 52], [130, 20, 100, 66], [210, 12, 250, 40]].forEach(([x1, y1, x2, y2]) => {
      g.beginPath(); g.moveTo(x1, y1);
      g.lineTo((x1 + x2) / 2 + 8, (y1 + y2) / 2);
      g.lineTo(x2, y2); g.stroke();
    });
    // csatornafedél
    pxCircle(g, 106, 52, 12, '#1b1e22', 2);
    pxCircle(g, 106, 52, 9, '#26292e', 2);
    // szemét
    for (let i = 0; i < 14; i++) p(rnd() * W, 12 + rnd() * (Hh - 16), 2 + rnd() * 3, 2, '#191c20');
    return c;
  }
  function descSeed(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; }

  /* --- 2. téma: LABOR / BUNKER --- */
  function labFar() {
    const W = 480;
    const [c, g] = mkc(W, TILE_H);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const H = TILE_H;
    p(0, 0, W, H, '#14181c');
    // betonpanelek
    for (let x = 0; x < W; x += 80) {
      p(x, 0, 2, H, '#0f1216');
      p(x + 2, 0, 78, 3, '#191d22');
      // szegecsek
      for (let y = 30; y < H; y += 90) { p(x + 8, y, 3, 3, '#20262c'); p(x + 68, y, 3, 3, '#20262c'); }
    }
    // festett szektor-jel
    g.fillStyle = '#2c3a2c';
    g.font = 'bold 44px monospace';
    g.fillText('B-7', 120, H - 160);
    g.fillText('C-2', 360, H - 220);
    // szellőzőrács
    [[40, H - 260], [300, H - 300]].forEach(([vx, vy]) => {
      p(vx, vy, 44, 30, '#0e1114');
      for (let i = 0; i < 5; i++) p(vx + 3, vy + 4 + i * 5, 38, 2, '#181d22');
    });
    // csővezetékek a fal mentén
    p(0, 120, W, 10, '#1c2126'); p(0, 120, W, 3, '#262c33');
    p(0, 210, W, 7, '#191e23'); p(0, 210, W, 2, '#232930');
    [60, 220, 390].forEach((jx) => { p(jx, 116, 8, 18, '#232930'); });
    return c;
  }

  function labMid() {
    const W = 520;
    const [c, g] = mkc(W, TILE_H);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const H = TILE_H;
    // fekvő kábelkötegek
    g.strokeStyle = '#101318'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 60); g.quadraticCurveTo(130, 100, 260, 62); g.quadraticCurveTo(390, 100, 520, 60); g.stroke();
    // tartálysor (folyadékos minta-tartályok)
    [[70, 0], [260, 1], [420, 0]].forEach(([tx, kind]) => {
      const th = 150, tw = 56;
      const ty = H - th;
      p(tx - 6, ty + th - 14, tw + 12, 14, '#232930');       // talp
      p(tx - 6, ty + th - 14, tw + 12, 3, '#323a44');
      p(tx, ty, tw, th - 12, '#1c3630');                     // üveg
      p(tx + 3, ty + 16, tw - 6, th - 32, kind ? '#25514266' : '#2c5a4c66');
      g.fillStyle = 'rgba(160,255,120,.10)';
      g.fillRect(tx + 3, ty + 16, tw - 6, th - 32);
      // benne lebegő minta-sziluett
      g.fillStyle = '#0f2620';
      g.fillRect(tx + tw / 2 - 8, ty + 46, 16, 40);
      g.fillRect(tx + tw / 2 - 5, ty + 34, 10, 12);
      p(tx - 6, ty - 10, tw + 12, 12, '#232930');            // kupak
      p(tx - 6, ty - 10, tw + 12, 3, '#323a44');
      p(tx + 8, ty - 4, 6, 4, '#4a8a5a');                    // státusz-led
    });
    // szerver-rack
    p(170, H - 110, 44, 110, '#181c22');
    for (let i = 0; i < 6; i++) {
      p(174, H - 102 + i * 16, 36, 10, '#12151a');
      p(176, H - 100 + i * 16, 3, 3, i % 2 ? '#3a7a4a' : '#7a3a3a');
      p(182, H - 100 + i * 16, 3, 3, '#3a5a7a');
    }
    // ledőlt szék + monitor
    p(340, H - 26, 30, 6, '#20242a');
    p(346, H - 40, 20, 15, '#14171c');
    p(348, H - 38, 16, 10, '#1e3038');
    return c;
  }

  function labNear() {
    const W = 240;
    const [c, g] = mkc(W, 60);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // fémkorlát
    p(0, 4, W, 5, '#262c34');
    p(0, 4, W, 2, '#343c46');
    for (let x = 8; x < W; x += 40) p(x, 9, 4, 51, '#20262e');
    p(0, 34, W, 3, '#20262e');
    return c;
  }

  function labGround() {
    const W = 240;
    const Hh = (C.VIEW_H - GY) * ART;
    const [c, g] = mkc(W, Hh);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    p(0, 0, W, Hh, '#1e2226');
    // veszélycsík a szélén
    for (let x = 0; x < W; x += 24) {
      p(x, 0, 12, 6, '#8f7a2a');
      p(x + 12, 0, 12, 6, '#26262a');
    }
    p(0, 6, W, 2, '#111417');
    // rácsminta
    g.strokeStyle = '#171a1e'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 20) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x, Hh); g.stroke(); }
    for (let y = 14; y < Hh; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // foltok
    const rnd = lcg(descSeed('lab'));
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(60,90,60,.12)';
      g.fillRect(rnd() * W, 10 + rnd() * (Hh - 14), 14, 8);
    }
    return c;
  }

  /* --- 3. téma: ROMOS VÁROS --- */
  function cityFar() {
    const W = 540;
    const [c, g] = mkc(W, TILE_H);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const H = TILE_H;
    // romos tornyok csipkézett tetővel
    const bs = [[10, 190, 90], [130, 140, 70], [230, 220, 110], [370, 150, 80], [470, 180, 60]];
    bs.forEach(([bx, bh, bw], bi) => {
      p(bx, H - bh, bw, bh, '#150e11');
      // letört tető lépcsőzetesen
      for (let i = 0; i < 4; i++) {
        p(bx + i * (bw / 4), H - bh - 8 + i * 5, bw / 4 + 1, 10, '#150e11');
      }
      // lyukak a falon
      const rnd = lcg(bi * 991 + 5);
      for (let i = 0; i < 4; i++) {
        p(bx + 8 + rnd() * (bw - 24), H - bh + 14 + rnd() * (bh - 40), 8 + rnd() * 10, 8 + rnd() * 8, '#1f1216');
      }
    });
    return c;
  }

  function cityMid() {
    const W = 560;
    const [c, g] = mkc(W, TILE_H);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const H = TILE_H;
    // összedőlt épület — ferde födémlapok
    p(20, H - 110, 120, 110, '#241a1c');
    // ferde lap lépcsőzetes rajzolással
    for (let i = 0; i < 10; i++) p(140 + i * 12, H - 18 - i * 8, 14, 10, '#2a1f22');
    // álló félház letört emelettel
    p(300, H - 140, 100, 140, '#221a1e');
    p(300, H - 140, 100, 4, '#2c2226');
    for (let wy = H - 126; wy < H - 24; wy += 34) {
      for (let wx = 310; wx < 386; wx += 30) {
        p(wx, wy, 13, 18, '#120c0e');
      }
    }
    // tűzfény az egyik ablakban (statikus alap, runtime pulzus jön rá)
    p(340, H - 92, 13, 18, '#472013');
    // kilógó betonvasak
    g.strokeStyle = '#161014'; g.lineWidth = 2;
    [[140, H - 96], [260, H - 60], [402, H - 138]].forEach(([rx, ry]) => {
      g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo(rx + 12, ry - 16, rx + 22, ry - 10); g.stroke();
      g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo(rx + 8, ry - 20, rx + 2, ry - 26); g.stroke();
    });
    // távoli roncs
    p(460, H - 30, 70, 26, '#1e1518');
    p(470, H - 42, 40, 14, '#1a1215');
    return c;
  }

  function cityNear() {
    const W = 280;
    const [c, g] = mkc(W, 64);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // homokzsák-barikád + törmelék
    const rnd = lcg(descSeed('citynear'));
    for (let x = 0; x < W; x += 26) {
      const hh = 18 + rnd() * 22;
      pxCircle(g, x + 12, 64 - hh / 2, hh / 2 + 6, '#2a2320', 2);
    }
    for (let x = 6; x < W; x += 34) {
      p(x, 44, 18, 8, '#3a332a');
      p(x + 4, 36, 18, 8, '#332d25');
      p(x, 44, 18, 2, '#453d32');
    }
    return c;
  }

  function cityGround() {
    const W = 260;
    const Hh = (C.VIEW_H - GY) * ART;
    const [c, g] = mkc(W, Hh);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const rnd = lcg(descSeed('cityg'));
    p(0, 0, W, Hh, '#282124');
    p(0, 0, W, 3, '#332a2e');
    // kráter
    pxCircle(g, 70, 30, 22, '#1d171a', 2);
    pxCircle(g, 70, 28, 15, '#231b1e', 2);
    // hamufoltok
    for (let i = 0; i < 5; i++) {
      g.fillStyle = 'rgba(120,110,100,.08)';
      g.fillRect(rnd() * W, 6 + rnd() * (Hh - 12), 24, 10);
    }
    // törmelékdarabok
    for (let i = 0; i < 18; i++) {
      p(rnd() * W, 6 + rnd() * (Hh - 10), 2 + rnd() * 4, 2 + rnd() * 2, rnd() < 0.5 ? '#1c1619' : '#332b2e');
    }
    g.strokeStyle = '#1c1619'; g.lineWidth = 2;
    [[10, 10, 50, 40], [180, 8, 230, 52]].forEach(([x1, y1, x2, y2]) => {
      g.beginPath(); g.moveTo(x1, y1); g.lineTo((x1 + x2) / 2 - 6, (y1 + y2) / 2); g.lineTo(x2, y2); g.stroke();
    });
    return c;
  }

  /* --- dekor-sprite-ok (világtérben) --- */
  function decorSprite(w, h, draw) {
    const [c, g] = mkc(w, h);
    g.save(); g.translate(Math.floor(w / 2), h); draw(g, mkP(g)); g.restore();
    return { c, w, h };
  }

  const DECOR = {
    wreckCar: decorSprite(120, 48, (g, p) => {
      p(-56, 26, 112, 18, '#37424e');
      p(-56, 26, 112, 3, '#46525f');
      p(-36, 40, 62, 15, '#2e3843');
      p(-30, 37, 22, 10, '#141a20');   // betört ablak
      p(-4, 37, 20, 10, '#171d24');
      p(-58, 20, 8, 6, '#5a5636');     // lámpa
      // rozsda + horpadás
      p(-20, 22, 16, 6, '#5a4030');
      p(20, 18, 12, 5, '#54392a');
      // kerekek (egyik hiányzik)
      pxCircle(g, -34, -7, 9, '#15181c', 2);
      pxCircle(g, -34, -7, 4, '#2c3138', 2);
      p(26, 10, 18, 4, '#242a31');     // féktárcsa csonk
    }),
    lamp: decorSprite(44, 128, (g, p) => {
      p(-2, 124, 5, 122, '#232830');
      p(-2, 124, 2, 122, '#31363f');
      p(-2, 126, 22, 5, '#232830');
      p(14, 122, 10, 5, '#3a4a3a');
      p(2, 6, 10, 4, '#1a1e24');       // talp
      p(-4, 4, 14, 4, '#1a1e24');
    }),
    hydrant: decorSprite(20, 26, (g, p) => {
      p(-6, 18, 12, 16, '#7e2f2f');
      p(-6, 18, 12, 3, '#933a3a');
      p(-8, 12, 4, 5, '#6b2626');
      p(4, 12, 4, 5, '#6b2626');
      p(-4, 22, 8, 4, '#933a3a');
      p(-3, 4, 6, 2, '#5a1f1f');
    }),
    trash: decorSprite(46, 22, (g, p) => {
      pxCircle(g, -10, -6, 9, '#20261e', 2);
      pxCircle(g, 6, -5, 8, '#242b21', 2);
      pxCircle(g, 14, -8, 6, '#1c211a', 2);
      p(-16, 6, 8, 4, '#2c332a');
      p(2, 4, 6, 3, '#333b30');
    }),
    tire: decorSprite(26, 24, (g, p) => {
      pxCircle(g, 0, -10, 11, '#191c1f', 2);
      pxCircle(g, 0, -10, 5, '#0c0e10', 2);
    }),
    barrelBio: decorSprite(30, 38, (g, p) => {
      p(-11, 34, 22, 33, '#4a5a2a');
      p(-11, 34, 22, 3, '#5c7034');
      p(-11, 26, 22, 3, '#3a4820');
      p(-11, 14, 22, 3, '#3a4820');
      pxCircle(g, 0, -20, 6, '#2a3316', 2);
      p(-2, 22, 4, 4, '#c8d84a');
      p(-6, 26, 3, 3, '#c8d84a'); p(3, 26, 3, 3, '#c8d84a');
    }),
    crate: decorSprite(38, 32, (g, p) => {
      p(-17, 28, 34, 27, '#3a4048');
      p(-17, 28, 34, 3, '#4a525c');
      p(-17, 28, 3, 27, '#31373e');
      p(-14, 18, 28, 3, '#2c3138');
      p(-8, 24, 16, 8, '#262b31');
      p(-6, 22, 12, 4, '#8f7a2a');
    }),
    monitorJunk: decorSprite(34, 22, (g, p) => {
      p(-14, 18, 24, 16, '#14171c');
      p(-12, 16, 20, 11, '#1e3038');
      p(-10, 14, 6, 4, '#2c4a56');
      p(8, 8, 8, 6, '#20242a');
      p(-16, 4, 10, 3, '#181c20');
    }),
    rubble: decorSprite(60, 30, (g, p) => {
      pxCircle(g, -12, -6, 13, '#2c2326', 2);
      pxCircle(g, 10, -8, 11, '#332a2d', 2);
      pxCircle(g, 22, -4, 7, '#282022', 2);
      p(-26, 10, 14, 6, '#3a2f32');
      p(4, 16, 10, 5, '#241c1f');
      p(-4, 20, 3, 16, '#4a3f35');   // kiálló betonvas
      p(12, 24, 2, 20, '#443a30');
    }),
    burntCar: decorSprite(110, 44, (g, p) => {
      p(-50, 24, 100, 16, '#1e1a1c');
      p(-32, 36, 56, 14, '#181416');
      p(-26, 33, 18, 8, '#0c0a0b');
      p(-2, 33, 16, 8, '#0e0c0d');
      p(-14, 20, 20, 5, '#2e2013');   // égésnyom
      pxCircle(g, -30, -6, 8, '#111013', 2);
      pxCircle(g, 28, -6, 8, '#111013', 2);
    }),
    girder: decorSprite(70, 46, (g, p) => {
      for (let i = 0; i < 8; i++) p(-32 + i * 8, 8 + i * 4, 10, 6, '#3a3d44');
      p(-34, 6, 12, 6, '#2e3138');
      for (let i = 0; i < 4; i++) p(-26 + i * 16, 12 + i * 8, 3, 3, '#565a68');
    }),
  };

  const THEMES = [
    { /* UTCA */
      name: 'utca',
      far: streetFar(), mid: streetMid(), near: streetNear(), ground: streetGround(),
      decor: ['wreckCar', 'lamp', 'trash', 'hydrant', 'tire', 'trash', 'lamp'],
      sky(ctx, t) {
        const g = ctx.createLinearGradient(0, 0, 0, GY);
        g.addColorStop(0, '#0a0e18');
        g.addColorStop(0.7, '#131c26');
        g.addColorStop(1, '#1a2430');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, C.VIEW_W, GY);
        // csillagok
        const rnd = lcg(9);
        ctx.fillStyle = '#8fa3b8';
        for (let i = 0; i < 34; i++) {
          const sx = rnd() * C.VIEW_W, sy = rnd() * 120;
          if ((t * 2 + i) % 7 > 0.4) ctx.fillRect(sx, sy, 1, 1);
        }
        // hold + udvar
        ctx.save();
        ctx.globalAlpha = 0.10;
        pxCircle(ctx, C.VIEW_W - 74, 46, 30, '#c8d0d8', 2);
        ctx.restore();
        pxCircle(ctx, C.VIEW_W - 74, 46, 17, '#d8dcd0', 2);
        ctx.fillStyle = '#b8bcac';
        ctx.fillRect(C.VIEW_W - 80, 40, 4, 4);
        ctx.fillRect(C.VIEW_W - 69, 50, 5, 3);
        ctx.fillRect(C.VIEW_W - 76, 52, 3, 2);
        // vonuló felhősáv
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#0c1016';
        const cx1 = (t * 3) % (C.VIEW_W + 200) - 100;
        ctx.fillRect(cx1 - 60, 30, 160, 12);
        ctx.fillRect(cx1 - 20, 38, 120, 8);
        const cx2 = (t * 2 + 260) % (C.VIEW_W + 260) - 130;
        ctx.fillRect(cx2, 70, 200, 10);
        ctx.restore();
      },
      anim(ctx, cam, t, decor) {
        // lámpák fénykúpja pislákolással
        decor.forEach((d) => {
          if (d.key !== 'lamp') return;
          const sx = d.x - cam;
          if (sx < -60 || sx > C.VIEW_W + 60) return;
          const seed = (d.x * 13) | 0;
          const flick = Math.sin(t * 17 + seed) > -0.82 ? 1 : 0.25;
          ctx.save();
          ctx.globalAlpha = 0.10 * flick;
          ctx.fillStyle = '#ffe9a8';
          ctx.beginPath();
          ctx.moveTo(sx + 9, GY - 61);
          ctx.lineTo(sx - 12, GY);
          ctx.lineTo(sx + 30, GY);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 0.5 * flick;
          ctx.fillRect(sx + 6, GY - 62, 6, 3);
          ctx.restore();
        });
      },
    },
    { /* LABOR */
      name: 'labor',
      far: labFar(), mid: labMid(), near: labNear(), ground: labGround(),
      decor: ['barrelBio', 'crate', 'monitorJunk', 'barrelBio', 'crate'],
      sky(ctx, t) {
        ctx.fillStyle = '#101418';
        ctx.fillRect(0, 0, C.VIEW_W, GY);
        // mennyezet + csövek
        ctx.fillStyle = '#0b0e12';
        ctx.fillRect(0, 0, C.VIEW_W, 18);
        ctx.fillStyle = '#1a2026';
        ctx.fillRect(0, 18, C.VIEW_W, 7);
        ctx.fillStyle = '#242b33';
        ctx.fillRect(0, 18, C.VIEW_W, 2);
        ctx.fillStyle = '#161b21';
        ctx.fillRect(0, 30, C.VIEW_W, 4);
      },
      anim(ctx, cam, t) {
        // függőlámpák, kúpfénnyel, enyhe pislákolás
        const spacing = 170;
        let first = Math.floor(cam / spacing) * spacing;
        for (let wx = first - spacing; wx < cam + C.VIEW_W + spacing; wx += spacing) {
          const sx = wx - cam;
          const seed = (wx * 7) | 0;
          const flick = Math.sin(t * 23 + seed) > -0.9 ? 1 : 0.15;
          ctx.fillStyle = '#232930';
          ctx.fillRect(sx - 1, 25, 2, 14);
          ctx.fillRect(sx - 7, 39, 14, 5);
          ctx.save();
          ctx.globalAlpha = 0.07 * flick;
          ctx.fillStyle = '#d8f0c8';
          ctx.beginPath();
          ctx.moveTo(sx - 6, 44);
          ctx.lineTo(sx - 42, GY);
          ctx.lineTo(sx + 42, GY);
          ctx.lineTo(sx + 6, 44);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 0.7 * flick;
          ctx.fillStyle = '#e8ffd8';
          ctx.fillRect(sx - 5, 42, 10, 3);
          ctx.restore();
        }
        // buborékok a tartályokban (mid réteg 0.5 parallax, tartályok x: 70,260,420 / ART)
        const midW = 260; // 520 art / 2
        [35, 130, 210].forEach((tankX, i) => {
          for (let rep = -1; rep < 3; rep++) {
            const wx = tankX + rep * midW - (cam * 0.5) % midW;
            if (wx < -20 || wx > C.VIEW_W + 20) continue;
            ctx.fillStyle = 'rgba(180,255,150,.35)';
            for (let b = 0; b < 3; b++) {
              const ph = ((t * 14 + b * 21 + i * 8) % 55);
              ctx.fillRect(wx + 8 + ((b * 7 + i * 3) % 14), GY - 22 - ph, 2, 2);
            }
          }
        });
      },
    },
    { /* ROMOS VÁROS */
      name: 'romváros',
      far: cityFar(), mid: cityMid(), near: cityNear(), ground: cityGround(),
      decor: ['rubble', 'burntCar', 'girder', 'rubble', 'tire', 'rubble'],
      sky(ctx, t) {
        const g = ctx.createLinearGradient(0, 0, 0, GY);
        g.addColorStop(0, '#180d12');
        g.addColorStop(0.55, '#331612');
        g.addColorStop(1, '#5a2a18');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, C.VIEW_W, GY);
        // vérvörös nap
        ctx.save();
        ctx.globalAlpha = 0.16;
        pxCircle(ctx, 110, 120, 42, '#a83a20', 2);
        ctx.restore();
        pxCircle(ctx, 110, 120, 26, '#7e2c18', 2);
        pxCircle(ctx, 108, 116, 18, '#93361c', 2);
        // sodródó füstfelhők
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#140a0c';
        const s1 = (t * 4) % (C.VIEW_W + 300) - 150;
        pxCircle(ctx, s1, 60, 26, '#140a0c', 2);
        pxCircle(ctx, s1 + 34, 52, 20, '#170c0e', 2);
        pxCircle(ctx, s1 + 60, 66, 16, '#120809', 2);
        const s2 = (t * 2.6 + 300) % (C.VIEW_W + 340) - 170;
        pxCircle(ctx, s2, 96, 22, '#120809', 2);
        pxCircle(ctx, s2 + 28, 88, 16, '#150b0d', 2);
        ctx.restore();
      },
      anim(ctx, cam, t) {
        // tűzfény-pulzus a mid réteg ablakában + felszálló parazsak
        const midW = 280;
        for (let rep = -1; rep < 3; rep++) {
          const wx = 170 + rep * midW - (cam * 0.5) % midW;
          if (wx < -30 || wx > C.VIEW_W + 30) continue;
          const pulse = 0.5 + 0.5 * Math.sin(t * 9 + rep * 2);
          ctx.save();
          ctx.globalAlpha = 0.25 + 0.3 * pulse;
          ctx.fillStyle = '#ff7a2a';
          ctx.fillRect(wx, GY - 46, 6.5, 9);
          ctx.globalAlpha = 0.10 * pulse;
          pxCircle(ctx, wx + 3, GY - 42, 16, '#ff9a3d', 2);
          ctx.restore();
        }
        // parazsak
        ctx.fillStyle = '#ff9a3d';
        for (let i = 0; i < 7; i++) {
          const ph = (t * (16 + i * 3) + i * 47) % 130;
          const ex = ((i * 173 + Math.sin(t * 2 + i) * 18) % C.VIEW_W + C.VIEW_W) % C.VIEW_W;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 0.7 - ph / 130);
          ctx.fillRect(ex, GY - 10 - ph, 1.5, 1.5);
          ctx.restore();
        }
      },
    },
  ];

  /* dekor-elrendezés cache pályánként */
  let decorCache = { level: -1, items: [] };
  function decorFor(level) {
    if (decorCache.level === level) return decorCache.items;
    const th = THEMES[C.themeFor(level)];
    const rnd = lcg(level * 2654435761 + 17);
    const items = [];
    const n = 7 + ((rnd() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const key = th.decor[(rnd() * th.decor.length) | 0];
      let x = 30 + rnd() * (C.WORLD_W - 60);
      // ne torlódjanak
      if (items.some((o) => Math.abs(o.x - x) < 55)) x = (x + 90) % C.WORLD_W;
      items.push({ key, x, spr: DECOR[key] });
    }
    items.sort((a, b) => a.x - b.x);
    decorCache = { level, items };
    return items;
  }

  /* div: a réteg kicsinyítése (alapból ART=2). A level_02/03 far-ja NATÍV méretben
     (div=1) megy: így egyrészt szélesebb a látómezőnél + parallax-úton (nem tileel
     láthatóan), másrészt a teljes képmagasságot kitölti (nem marad üres sáv felül). */
  function tileLayer(ctx, tile, cam, par, bottomY, div) {
    const d = div || ART;
    const w = tile.width / d;
    const h = tile.height / d;
    let off = -((cam * par) % w);
    if (off > 0) off -= w;
    for (let x = off; x < C.VIEW_W; x += w) {
      ctx.drawImage(tile, r2(x), bottomY - h, w, h);
    }
  }
  /* TALAJ: a felső éle = GROUND_Y (a talp-vonal), így a propok/épületek/játékos a talaj
     LÁTHATÓ FELSZÍNÉN állnak, nem 10px-el belesüppedve. Természetes magasság (a képernyő
     aljáig, esetleg alá lóg — clippel). Parallax 1 (a kamerával mozog). */
  function drawGround(ctx, tile, cam) {
    if (!tile || !tile.width) return;   // Image (naturalWidth→.width) VAGY canvas is OK
    const w = tile.width / ART, h = tile.height / ART;
    let off = -(cam % w); if (off > 0) off -= w;
    for (let x = off; x < C.VIEW_W; x += w) ctx.drawImage(tile, r2(x), GY, w, h);
  }

  /* ---- HD MAP-RÉTEGEK (assets/maps/) — a procedurális háttér HELYETT, ha betöltött.
     Egyelőre a level_01 „quarantine street" (theme 0 = utca). Fallback: procedurális.
     Rétegek: far/mid/near/ground + propok (járművek/barikádok) + fx (rain/fog/lightpool)
     + fg (előtér-törmelék). ---- */
  const MAPS = {};
  function img1(base, name) { const im = new Image(); im.src = base + name; return im; }
  function loadMap(theme, base, cfg) {
    const m = { ready: false, base, struct: {}, props: {}, fx: {}, structPattern: cfg.structPattern || [], structPeriod: cfg.structPeriod || 560, place: cfg.place || [], farDiv: cfg.farDiv || ART };
    MAPS[theme] = m;
    /* tiszta réteg-modell: far (skyline) + ground (talaj) + diszkrét struktúrák + ritka propok */
    ['far', 'ground'].forEach((k) => { m[k] = img1(base, k + '.png'); });
    (cfg.struct || []).forEach((p) => { m.struct[p] = img1(base, p + '.png'); });
    (cfg.props || []).forEach((p) => { m.props[p] = img1(base, 'props/' + p + '.png'); });
    /* az atmoszféra (köd/eső) most PROCEDURÁLIS — csak a lokális utcalámpa-fény PNG marad */
    ['lightpool'].forEach((k) => { m.fx[k] = img1(base + 'fx/', k + '.png'); });
    /* ready, amint a far + ground betöltött (a struktúrák/propok/fx best-effort) */
    let n = 0; const need = 2;
    ['far', 'ground'].forEach((k) => { m[k].onload = () => { if (++n >= need) m.ready = true; }; m[k].onerror = () => { if (++n >= need) m.ready = !!(m.far.naturalWidth); }; });
  }
  function loadMaps() {
    /* theme 0 = level_01 „Quarantine Street" (kampány 1–5. nap) */
    loadMap(0, 'assets/maps/level_01/', {
      struct: ['bld_a', 'bld_b', 'watertower'],
      /* diszkrét midground struktúra-minta (parallax 0.5), egy perióduson belüli x-eltolással
         → NEM tilelt kollázs-strip, hanem néhány tiszta, ismétlődő épület/torony sziluett */
      structPattern: [[20, 'bld_a'], [250, 'watertower'], [340, 'bld_b']],
      structPeriod: 560,
      props: ['bus', 'car', 'police'],
      /* ritka, jól szeparált street-dressing (világ-x, prop) — kevés, de tiszta */
      place: [[190, 'bus'], [470, 'car'], [820, 'police']],
    });
    /* theme 1 = level_02 „Quick Mart" (kampány 6–10. nap) — ugyanaz a tiszta modell:
       far skyline + diszkrét midground (bolt-homlokzat + oszlop) + talaj + ritka propok */
    loadMap(1, 'assets/maps/level_02/', {
      /* farDiv 1: a far natív méretben (551×236) — kitölti a képmagasságot, és a
         parallax-úton (480 + 0.2·560 ≈ 592px) alig ismétlődik. ART=2-vel csak egy
         vékony 118px-es sáv volt, felette üres éggel. */
      farDiv: 1,
      struct: ['facade', 'power_pole'],
      structPattern: [[40, 'facade'], [400, 'power_pole']],
      /* 640 → 760: a 299px-es homlokzat így nem tűnik fel kétszer egy képernyőn */
      structPeriod: 760,
      props: ['car', 'gas_pump', 'dumpster', 'gas_sign'],
      place: [[150, 'gas_pump'], [360, 'car'], [630, 'dumpster'], [880, 'gas_sign']],
    });
    /* theme/map 2 = level_03 „Zombie Alley" (3. misszió minden napon) — TURBO:
       a teljes festett alley-jelenet (neon/glow/nedves tükröződés) a gazdag ÉLŐ far-háttér,
       + nedves aszfalt talaj + ritka propok. Nincs külön midground struktúra (a jelenet gazdag). */
    loadMap(2, 'assets/maps/level_03/', {
      /* farDiv 1: EZ VOLT A LEGNAGYOBB BAJ. A far egy PERSPEKTIVIKUS jelenet
         (utcalámpa + enyészpont), amit ART=2-vel a motor 367px-en tileelt -> ugyanaz
         a lámpa 2-3× ismétlődött egy képernyőn, felette 40% üres feketével.
         Natív méretben (735×236) egyetlen összefüggő jelenet, ismétlődés nélkül. */
      farDiv: 1,
      struct: [],
      props: [],   // a festett jelenet baked-in propokat tartalmaz — nincs külön cropped prop
      place: [],
    });
  }
  const rd2 = (v) => Math.round(v * ART) / ART;
  /* additív, tilelő overlay (fény/köd/eső) — a fekete eltűnik, csak az izzás/csík marad */
  function addLayer(ctx, im, cam, par, bottomY, alpha, drift) {
    if (!im || !im.naturalWidth) return;
    const w = im.width / ART, h = im.height / ART;
    let off = -(((cam * par + (drift || 0)) % w));
    if (off > 0) off -= w;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    for (let x = off; x < C.VIEW_W; x += w) ctx.drawImage(im, rd2(x), bottomY - h, w, h);
    ctx.restore();
  }
  /* ================= ATMOSZFÉRA (procedurális, mélység-sávos) =================
     NEM teljes-képernyős haze/PNG-felhő. A köd MÉLYSÉG-SÁVOKBAN, finom sodródó
     pamacsokként (far erősebb → mid halvány → előtér szinte láthatatlan); az eső
     vékony, ritka, mozgó csík. Vezérlés: C.atmosphere (enabled + intensity + alfák). */
  const AMUL = { off: 0, subtle: 1, strong: 1.85 };
  function atmoCfg() { return C.atmosphere || {}; }
  function atmoMul() { const a = atmoCfg(); if (a.enabled === false) return 0; const iv = a.intensity; return typeof iv === 'number' ? Math.max(0, iv) : (AMUL[iv] != null ? AMUL[iv] : 1); }
  function atmoOn() { return atmoMul() > 0; }
  /* egy mélység-sáv finom, sodródó köd-pamacsokkal (lokális sáv, nem full-screen).
     key: 'far'|'mid'|'fg' → a config megfelelő alfája; yc = sáv-közép, hh = sáv-magasság. */
  function drawFogBand(ctx, cam, t, key, yc, hh) {
    const a = atmoCfg(); if (!atmoOn() || a.fogEnabled === false) return;
    const baseA = key === 'far' ? (a.fogFarAlpha != null ? a.fogFarAlpha : 0.10)
      : key === 'mid' ? (a.fogMidAlpha != null ? a.fogMidAlpha : 0.05)
        : (a.fogForegroundAlpha != null ? a.fogForegroundAlpha : 0.02);
    const alpha = baseA * atmoMul(); if (alpha <= 0.004) return;
    const par = key === 'far' ? 0.18 : key === 'mid' ? 0.42 : 0.85;   // sodródás-parallax
    const speed = key === 'far' ? 6 : key === 'mid' ? 9 : 12;          // lassú vízszintes drift
    const span = C.VIEW_W + 260, puffs = key === 'fg' ? 3 : 4;
    const tint = key === 'far' ? '150,166,184' : key === 'mid' ? '140,152,168' : '120,132,150';
    ctx.save();
    for (let i = 0; i < puffs; i++) {
      const seed = i * 2.3994;
      let x = (i + 0.5) * span / puffs - cam * par - t * speed + Math.sin(t * 0.25 + seed) * 16;
      x = ((x % span) + span) % span - 130;                            // vízszintes wrap
      const y = yc + Math.sin(t * 0.4 + seed) * 3;
      const rw = 150 + (i % 2) * 54;
      ctx.save(); ctx.translate(r2(x), y); ctx.scale(1, hh / rw);       // lapos ellipszis-pamacs
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rw);
      g.addColorStop(0, 'rgba(' + tint + ',' + alpha.toFixed(3) + ')');
      g.addColorStop(0.6, 'rgba(' + tint + ',' + (alpha * 0.5).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + tint + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rw, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  const frac = (v) => v - Math.floor(v);
  /* vékony, ritka, mozgó eső-csíkok (procedurális — nincs PNG-felhő). A legelöl, halványan. */
  function drawAtmoRain(ctx, cam, t) {
    const a = atmoCfg(); if (!atmoOn() || a.rainEnabled === false) return;
    const alpha = (a.rainAlpha != null ? a.rainAlpha : 0.12) * atmoMul(); if (alpha <= 0.004) return;
    const density = Math.min(1, (a.rainDensity != null ? a.rainDensity : 0.35) * atmoMul());
    const speed = a.rainSpeed != null ? a.rainSpeed : 1;
    const N = Math.round(78 * density); if (N <= 0) return;
    const W = C.VIEW_W, H = C.VIEW_H, span = W + 40, wind = 2.4;
    ctx.save();
    ctx.strokeStyle = 'rgba(206,220,236,' + alpha.toFixed(3) + ')';
    ctx.lineWidth = 0.7; ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const h1 = frac(Math.sin(i * 12.9898) * 43758.5453);   // determinisztikus „random" per csík
      const h2 = frac(Math.sin(i * 78.233) * 12543.113);
      const h3 = frac(Math.sin(i * 39.425) * 9631.31);
      const sp = (128 + h2 * 150) * speed;                    // randomizált sebesség
      let x = h1 * span - (cam * 0.3) % span; x = ((x % span) + span) % span - 20;
      const y = ((t * sp + h3 * (H + 40)) % (H + 40)) - 20;   // függőleges hurok
      const len = 5 + h2 * 7;                                 // rövid szakasz
      ctx.moveTo(r2(x), r2(y)); ctx.lineTo(r2(x - wind), r2(y + len));  // enyhén átlós (szél)
    }
    ctx.stroke(); ctx.restore();
  }

  /* Diszkrét MIDGROUND struktúrák (épületek/víztorony) — NEM tilelt strip, hanem néhány
     tiszta sziluett egy parallax-perióduson belül ismételve (par 0.5). Talp GY-en. */
  function drawStructures(ctx, m, cam) {
    const pat = m.structPattern; if (!pat || !pat.length) return;
    const par = 0.5, P = m.structPeriod || 560;
    let base = -((cam * par) % P); if (base > 0) base -= P;
    for (let bx = base; bx < C.VIEW_W + P; bx += P) {
      for (const [ox, name] of pat) {
        const im = m.struct[name]; if (!im || !im.naturalWidth) continue;
        const w = im.width / ART, h = im.height / ART, sx = bx + ox;
        if (sx < -w - 20 || sx > C.VIEW_W + 20) continue;
        ctx.drawImage(im, r2(sx), GY - h + 1, w, h);
      }
    }
  }
  /* HD propok kirajzolása (talp GY-en, lágy árnyék) — az entitások MÖGÖTT */
  function drawMapProps(ctx, m, cam) {
    for (const [wx, name] of m.place) {
      const im = m.props[name]; if (!im || !im.naturalWidth) continue;
      const sx = wx - cam;
      if (sx < -140 || sx > C.VIEW_W + 140) continue;
      const w = im.width / ART, h = im.height / ART;
      // árnyék
      ctx.save(); ctx.globalAlpha = 0.34; ctx.fillStyle = '#02040a';
      ctx.beginPath(); ctx.ellipse(rd2(sx), GY + 1, w * 0.44, Math.max(2, w * 0.1), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.drawImage(im, rd2(sx - w / 2), GY - h + 1, w, h);
    }
  }

  function drawBackground(ctx, cam, level, t) {
    const theme = C.themeFor(level);
    const th = THEMES[theme];
    th.sky(ctx, t || 0);
    const hd = MAPS[C.mapKeyFor(level)];   // a HD map a HELYSZÍNHEZ (misszió-sorszám) kötve
    if (hd && hd.ready) {
      /* TISZTA RÉTEG-MODELL + FINOM MÉLYSÉG-SÁVOS ATMOSZFÉRA (nem full-screen szűrő):
         far → FAR mist → struktúrák → MID mist (halvány) → talaj → fénypool → propok.
         Az előtér-köd + eső a drawForeground-ban, az entitások UTÁN. */
      if (hd.far.naturalWidth) tileLayer(ctx, hd.far, cam, 0.2, GY, hd.farDiv);
      drawFogBand(ctx, cam, t || 0, 'far', GY - 60, 30);        // horizont/far mist (erősebb, de halvány)
      drawStructures(ctx, hd, cam);                              // épületek + víztorony (par 0.5)
      drawFogBand(ctx, cam, t || 0, 'mid', GY - 16, 18);        // midground/struktúra-tő (nagyon halvány)
      drawGround(ctx, hd.ground, cam);   // talaj felszíne = GROUND_Y (propok nem süppednek bele)
      if (atmoOn() && atmoCfg().lightPools !== false) addLayer(ctx, hd.fx.lightpool, cam, 1, GY + 8, 0.3, 0); // utcalámpa-fény a talajon (lokális, meleg)
      drawMapProps(ctx, hd, cam);                                // ritka járművek (entitások mögött)
      return drawBgOverlay(ctx);   // scene-grade + vignetta (entitások ELŐTT)
    }
    tileLayer(ctx, th.far, cam, 0.2, GY);
    tileLayer(ctx, th.mid, cam, 0.5, GY);
    // horizont-köd
    const fog = ctx.createLinearGradient(0, GY - 60, 0, GY);
    fog.addColorStop(0, 'rgba(20,26,30,0)');
    fog.addColorStop(1, 'rgba(30,38,42,.28)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, GY - 60, C.VIEW_W, 60);
    tileLayer(ctx, th.near, cam, 0.8, GY);
    // talaj — felszíne = GROUND_Y (a talp-vonal), nem 10px-el feljebb
    drawGround(ctx, th.ground, cam);
    // dekorok világtérben
    const items = decorFor(level);
    items.forEach((d) => {
      const sx = d.x - cam;
      if (sx < -80 || sx > C.VIEW_W + 80) return;
      ctx.drawImage(d.spr.c, r2(sx - d.spr.w / 2 / ART), GY - d.spr.h / ART + 1, d.spr.w / ART, d.spr.h / ART);
    });
    th.anim(ctx, cam, t || 0, items);
    drawBgOverlay(ctx);
  }

  /* JELENET-INTEGRÁCIÓ (a HÁTTÉRRE, az entitások ELŐTT): cinematikus sötétítés + köd +
     talaj-kontakt + vignetta → a HD karakterek kiemelkednek és beleolvadnak a jelenetbe. */
  function drawBgOverlay(ctx) {
    const VW = C.VIEW_W, VH = C.VIEW_H;
    const dim = ctx.createLinearGradient(0, 0, 0, VH);
    dim.addColorStop(0, 'rgba(6,10,18,.44)');
    dim.addColorStop(0.55, 'rgba(6,8,12,.24)');
    dim.addColorStop(1, 'rgba(12,7,4,.5)');
    ctx.fillStyle = dim; ctx.fillRect(0, 0, VW, VH);
    const haze = ctx.createLinearGradient(0, GY - 92, 0, GY + 8);
    haze.addColorStop(0, 'rgba(42,52,60,0)');
    haze.addColorStop(1, 'rgba(40,48,56,.2)');
    ctx.fillStyle = haze; ctx.fillRect(0, GY - 92, VW, 100);
    const gd = ctx.createLinearGradient(0, GY - 8, 0, VH);
    gd.addColorStop(0, 'rgba(2,3,6,0)');
    gd.addColorStop(1, 'rgba(2,3,6,.55)');
    ctx.fillStyle = gd; ctx.fillRect(0, GY - 8, VW, VH - GY + 8);
    const vg = ctx.createRadialGradient(VW / 2, VH * 0.54, VH * 0.26, VW / 2, VH * 0.54, VH * 0.92);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.44)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  }

  /* HD ELŐTÉR (az entitások UTÁN rajzolva): szinte láthatatlan előtér-köd + vékony,
     ritka, procedurális eső-csíkok. NINCS PNG-felhő és NINCS teljes-képernyős haze —
     az artwork éles és olvasható marad. */
  function drawForeground(ctx, cam, level, t) {
    const m = MAPS[C.mapKeyFor(level)];   // a HD map a HELYSZÍNHEZ kötve (mint drawBackground)
    if (!m || !m.ready) return;
    drawFogBand(ctx, cam, t || 0, 'fg', C.VIEW_H - 6, 14);   // előtér-köd — szinte láthatatlan
    drawAtmoRain(ctx, cam, t || 0);                          // vékony eső a legelöl
  }

  /* menü-háttér: lassan pásztázó jelenet vonuló zombi-sziluettekkel */
  function drawMenuScene(ctx, t) {
    const cam = (t * 9) % (C.WORLD_W - C.VIEW_W);
    /* enyhe zoom, hogy a menü mögötti jelenet is közelibb, élőbb legyen */
    ctx.save();
    const MZ = 1.35;
    ctx.scale(MZ, MZ);
    ctx.translate(0, -(GY - 240 / MZ));
    drawBackground(ctx, cam, 1, t);
    // sziluett-zombik
    for (let i = 0; i < 3; i++) {
      const wx = ((t * (7 + i * 2.4) + i * 210) % (C.VIEW_W + 120)) - 60;
      const type = i === 1 ? 'runner' : 'walker';
      const sh = ZSHEETS[type][i % 2].walk;
      blitTint(ctx, sh, (t * 4 + i * 2) | 0, wx, GY, 1, '#060a08', 0.88);
    }
    ctx.restore();
    // sötétítő vignetta
    const v = ctx.createRadialGradient(C.VIEW_W / 2, C.VIEW_H * 0.42, 60, C.VIEW_W / 2, C.VIEW_H / 2, C.VIEW_W * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(2,5,3,.72)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  }

  /* =====================================================================
     UI-IKONOK (bolt, labor)
     ===================================================================== */
  function weaponIcon(weapon) {
    const [c, g] = mkc(120, 60);
    const gun = GUNS[weapon.id] || GUNS.pistol;
    g.save();
    g.translate(2, 1);
    g.scale(1.55, 1.55);
    g.drawImage(gun.c, 0, 0);
    g.restore();
    return c.toDataURL();
  }

  function upgIcon(id) {
    const [c, g] = mkc(36, 36);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    g.save();
    g.translate(18, 18);
    switch (id) {
      case 'hp': // szív
        pxCircle(g, -5, -5, 6, '#e5484d', 2);
        pxCircle(g, 5, -5, 6, '#e5484d', 2);
        p(-9, -4, 18, 6, '#e5484d');
        p(-7, 2, 14, 4, '#c93b40');
        p(-4, 6, 8, 3, '#c93b40');
        p(-2, 9, 4, 2, '#a83034');
        p(-6, -7, 4, 3, '#f2787c');
        break;
      case 'regen': // kereszt pulzussal
        p(-4, -12, 8, 24, '#7ddb4f');
        p(-12, -4, 24, 8, '#7ddb4f');
        p(-4, -12, 8, 4, '#a5e87e');
        break;
      case 'dmg': // lövedék
        p(-10, -3, 14, 7, '#c9a44a');
        p(4, -3, 4, 7, '#8f742f');
        pxCircle(g, 8, 0, 4, '#e8c96a', 2);
        p(-12, -5, 3, 11, '#8f742f');
        break;
      case 'crit': // csillag-villanás
        p(-2, -14, 4, 28, '#ffc14d');
        p(-14, -2, 28, 4, '#ffc14d');
        p(-8, -8, 4, 4, '#ffe9a8'); p(4, 4, 4, 4, '#ffe9a8');
        p(4, -8, 4, 4, '#ffe9a8'); p(-8, 4, 4, 4, '#ffe9a8');
        p(-2, -2, 4, 4, '#fff6d0');
        break;
      case 'speed': // szárnyas bakancs
        p(-8, -2, 12, 10, '#6d5a3a');
        p(-8, 4, 16, 6, '#54452c');
        p(-8, 8, 16, 3, '#2c2c30');
        p(-14, -6, 8, 3, '#d8e2e8'); p(-16, -2, 10, 3, '#b8c6d0'); p(-13, 2, 7, 2, '#d8e2e8');
        break;
      case 'gren': // gránát
        pxCircle(g, 0, 2, 9, '#3d4a33', 2);
        pxCircle(g, -2, 0, 4, '#4c5c40', 2);
        p(-3, -12, 6, 4, '#556047');
        p(2, -14, 6, 3, '#8a8f7a');
        break;
      case 'luck': // érme + lóhere
        pxCircle(g, -3, 2, 8, '#ffc14d', 2);
        pxCircle(g, -3, 2, 4, '#a87820', 2);
        pxCircle(g, 8, -8, 4, '#7ddb4f', 2);
        pxCircle(g, 12, -4, 4, '#7ddb4f', 2);
        pxCircle(g, 8, -1, 4, '#7ddb4f', 2);
        p(9, -2, 2, 8, '#4c8a32');
        break;
    }
    g.restore();
    return c.toDataURL();
  }

  function px(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(r2(x), r2(y), Math.max(0.5, r2(w)), Math.max(0.5, r2(h)));
  }

  return {
    drawPlayer, drawZombie, drawBackground, drawMenuScene,
    drawBoom, drawCoin, drawMed, drawGrenade, drawShell,
    drawGenerator, drawAmmoBox,
    weaponIcon, upgIcon, px, pxCircle,
    THEMES, ZDIM, loadMaps, drawForeground,
  };
})();
