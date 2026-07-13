/* ZombieChronicles — PART-RIG réteg (cutout csontváz + testszakadás).
   Egy karaktert külön testrészekből (fej, törzs, kar, 2 láb) rajzol és animál:
   - járás = a lábak (és a kar) külön lengenek a saját forgáspontjuk körül,
   - halál = a valódi testrészek fizikai "gib"-ként leszakadnak és szétrepülnek.

   A juice többi részét (screenshake, hitstop, vér-részecske, decal) a game.js
   meglévő rendszere adja — ez a modul CSAK a rig-megjelenítést + a leszakadó
   testrészeket kezeli. Ha a part-képek nem töltenek be, has() false → a játék a
   régi kép-alapú / procedurális rajzra esik vissza (nincs összeomlás).

   Bővíthető: minden karakter-típushoz egy RIGS-bejegyzés (saját part-képek +
   forgáspontok). Jelenleg: walker (Kóbor). A geometria a kobor_raw.png-ből
   kivágott részekhez van kalibrálva (cut_parts.py, 1024×1024 képtér). */
window.ZD = window.ZD || {};
ZD.partRig = (() => {
  const rnd = (a, b) => a + Math.random() * (b - a);

  const RIGS = {
    walker: {
      base: 'assets/sprites/zombies/kobor/parts_rig/',
      parts: ['head', 'torso', 'arm_front', 'leg_left', 'leg_right'],
      order: ['leg_left', 'torso', 'head', 'leg_right', 'arm_front'],
      anchor: { x: 497, y: 920 },
      contentH: 811,              // fej-teto(109) → talp(920)
      height: 46,                 // kirajzolt magassag (logikai px), a walker atlaszhoz igazitva
      pivots: { neck: { x: 628, y: 236 }, shoulder: { x: 560, y: 415 }, hipL: { x: 455, y: 618 }, hipR: { x: 545, y: 618 } },
      cent: { head: { x: 563, y: 173 }, torso: { x: 512, y: 440 }, arm_front: { x: 591, y: 524 }, leg_left: { x: 371, y: 763 }, leg_right: { x: 617, y: 764 } },
      tune: { legSwing: 10, armSwing: 5, cadence: 2.0 },   // behangolt ertekek
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
  };

  /* feher sziluett-maszk (hit-flash) egy part-kephez */
  function makeMask(im) {
    const m = document.createElement('canvas'); m.width = im.naturalWidth; m.height = im.naturalHeight;
    const g = m.getContext('2d'); g.drawImage(im, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, m.width, m.height);
    return m;
  }

  function load() {
    Object.keys(RIGS).forEach((type) => {
      const rig = RIGS[type];
      rig._left = rig.parts.length;
      rig.parts.forEach((name) => {
        const im = new Image();
        im.onload = () => { rig._img[name] = im; rig._mask[name] = makeMask(im); if (--rig._left <= 0) rig._ok = true; };
        im.onerror = () => { console.warn('[partRig] part load fail:', type, name); rig._left = 999; rig._ok = false; };
        im.src = rig.base + name + '.png';
      });
    });
  }

  function has(type) { const r = RIGS[type]; return !!r && r._ok; }

  let _t = 0;
  const gibs = [];

  function pivotFor(rig, name) {
    return name === 'head' ? rig.pivots.neck : name === 'arm_front' ? rig.pivots.shoulder
      : name === 'leg_left' ? rig.pivots.hipL : name === 'leg_right' ? rig.pivots.hipR : null;
  }

  function drawPartSet(ctx, rig, pose, useMask) {
    const src = useMask ? rig._mask : rig._img;
    for (const name of rig.order) {
      const im = src[name]; if (!im) continue;
      const piv = pivotFor(rig, name);
      const ang = pose[name] || 0;
      ctx.save();
      if (piv && ang) { ctx.translate(piv.x, piv.y); ctx.rotate(ang * Math.PI / 180); ctx.translate(-piv.x, -piv.y); }
      ctx.drawImage(im, 0, 0);
      ctx.restore();
    }
  }

  /* z: a drawZombie snapshot — {type, x, y(=GROUND_Y), facing, phase, moving, flash, elite} */
  function draw(ctx, z) {
    const rig = RIGS[z.type]; if (!rig || !rig._ok) return false;
    const S = rig.height * (z.elite ? 1.12 : 1) / rig.contentH;
    const fac = z.facing < 0 ? -1 : 1;

    const pose = {};
    let bob = 0;
    if (z.moving) {
      const ph = (z.phase || 0) * rig.tune.cadence;
      const sw = Math.sin(ph);
      pose.leg_left = sw * rig.tune.legSwing;
      pose.leg_right = -sw * rig.tune.legSwing;
      pose.arm_front = sw * rig.tune.armSwing;
      pose.head = sw * 3;
      bob = -Math.abs(sw) * rig.height * 0.03;
    } else {
      bob = Math.sin(_t * 1.6) * rig.height * 0.006;
    }

    /* lagy talaj-arnyek (a rig megkeruli az enemySprites arnyekat) */
    const sw2 = rig.height * 0.62;
    ctx.save();
    ctx.globalAlpha = 0.32; ctx.fillStyle = '#020408';
    ctx.beginPath(); ctx.ellipse(z.x, z.y, sw2 * 0.5, Math.max(2, sw2 * 0.16), 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const A = rig.anchor;
    ctx.save();
    ctx.translate(z.x, z.y + bob);
    ctx.scale(fac * S, S);
    ctx.translate(-A.x, -A.y);
    drawPartSet(ctx, rig, pose, false);
    if (z.flash > 0) { ctx.globalAlpha = Math.min(0.85, z.flash * 6); drawPartSet(ctx, rig, pose, true); ctx.globalAlpha = 1; }
    ctx.restore();
    return true;
  }

  /* halalkor: minden testresz leszakad es szetrepul (jatek-skalaju sebesseg) */
  const GIB_SPEC = {
    head:      (f) => ({ vx: f * rnd(15, 35),  vy: -rnd(150, 210), vr: rnd(6, 12) * f }),
    torso:     (f) => ({ vx: -f * rnd(25, 55),  vy: -rnd(110, 150), vr: rnd(-5, 5) }),
    arm_front: (f) => ({ vx: f * rnd(45, 95),  vy: -rnd(130, 180), vr: rnd(8, 16) * f }),
    leg_left:  (f) => ({ vx: -rnd(20, 60),      vy: -rnd(90, 140),  vr: rnd(-10, -3) }),
    leg_right: (f) => ({ vx: rnd(20, 60),       vy: -rnd(90, 140),  vr: rnd(3, 10) }),
  };
  function spawnGibs(z) {
    const rig = RIGS[z.type]; if (!rig || !rig._ok) return;
    const S = rig.height * (z.elite ? 1.12 : 1) / rig.contentH;
    const fac = z.facing < 0 ? -1 : 1;
    const groundY = ZD.C.GROUND_Y;
    for (const name of rig.parts) {
      const c = rig.cent[name];
      const wx = z.x + fac * (c.x - rig.anchor.x) * S;
      const wy = groundY + (c.y - rig.anchor.y) * S;
      const s = GIB_SPEC[name](fac);
      gibs.push({ rig: z.type, name, x: wx, y: wy, S, facing: fac,
        vx: s.vx, vy: s.vy, vrot: s.vr, rot: 0, life: 3.4, bounced: 0, rest: false });
    }
    while (gibs.length > 140) gibs.shift();
  }

  function update(dt) {
    _t += dt;
    const G = ZD.C.GRAVITY, groundY = ZD.C.GROUND_Y;
    for (let i = gibs.length - 1; i >= 0; i--) {
      const g = gibs[i];
      g.life -= dt;
      if (g.life <= 0) { gibs.splice(i, 1); continue; }
      if (g.rest) continue;
      g.vy += G * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.rot += g.vrot * dt;
      if (g.y >= groundY) {
        g.y = groundY;
        if (g.bounced < 2 && Math.abs(g.vy) > 45) { g.vy *= -0.38; g.vx *= 0.55; g.vrot *= 0.5; g.bounced++; }
        else { g.vy = 0; g.vx *= 0.7; g.vrot *= 0.6; if (Math.abs(g.vx) < 3 && Math.abs(g.vrot) < 0.4) { g.rest = true; g.vx = 0; g.vrot = 0; } }
      }
    }
  }

  /* a kamera-transzformon BELUL hivando (vilag-koordinatak) */
  function drawGibs(ctx) {
    for (const g of gibs) {
      const rig = RIGS[g.rig]; const im = rig && rig._img[g.name]; if (!im) continue;
      const c = rig.cent[g.name];
      ctx.save();
      ctx.globalAlpha = g.life < 0.6 ? Math.max(0, g.life / 0.6) : 1;
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);
      ctx.scale(g.facing * g.S, g.S);
      ctx.translate(-c.x, -c.y);
      ctx.drawImage(im, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function reset() { gibs.length = 0; }

  return { load, has, draw, spawnGibs, update, drawGibs, reset };
})();
