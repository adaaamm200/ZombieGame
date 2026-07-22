/* ZombieChronicles — PART-RIG réteg (cutout csontváz + testszakadás).
   Egy karaktert külön testrészekből (fej, törzs, kar, 2 láb) rajzol és animál:
   - járás = a lábak (és a kar) külön lengenek a saját forgáspontjuk körül,
   - halál = a valódi testrészek fizikai "gib"-ként leszakadnak és szétrepülnek.

   A juice többi részét (screenshake, hitstop, vér-részecske, decal) a game.js
   meglévő rendszere adja — ez a modul CSAK a rig-megjelenítést + a leszakadó
   testrészeket kezeli. Ha egy típus part-képei nem töltenek be, has() false →
   a játék a régi kép-alapú / procedurális rajzra esik vissza (nincs összeomlás).

   SZEREP-ALAPÚ (role) felépítés:
     head · torso · armF (elülső kar) · legB (hátsó láb) · legF (elülső láb)
   Minden rig maga mondja meg, melyik FÁJL melyik szerep (`files`), így mindegy,
   hogy a Kóbor kézzel vágott part-jai leg_left/leg_right néven vannak, az
   automatán vágott többi entitás meg leg_back/leg_front néven.

   Geometria: a rig-értékek az 1024×1024-es KÉPTÉRBEN vannak (tools/measure_rig.py
   méri ki, tools/gen_rigs.py generálja a bejegyzést). Lásd docs/PART_RIG_PIPELINE.md */
window.ZD = window.ZD || {};
ZD.partRig = (() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ROLES = ['head', 'torso', 'armF', 'legB', 'legF'];

  const RIGS = {
    /* Kóbor — KÉZZEL hangolt vágás (assets/.../kobor/cut_parts.py), jóváhagyva.
       A part-fájljai még a régi leg_left/leg_right nevet viselik. */
    walker: {
      base: 'assets/sprites/zombies/kobor/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_left', legF: 'leg_right' },
      anchor: { x: 497, y: 920 },
      contentH: 811,
      height: 46,
      pivots: {
        neck: { x: 628, y: 236 }, shoulder: { x: 560, y: 415 },
        hipB: { x: 455, y: 618 }, hipF: { x: 545, y: 618 },
      },
      cent: {
        head: { x: 563, y: 173 }, torso: { x: 512, y: 440 }, armF: { x: 591, y: 524 },
        legB: { x: 371, y: 763 }, legF: { x: 617, y: 764 },
      },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 10, armSwing: 5, cadence: 2.0 },
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    /* --- Automatán kimért entitások (measure_rig.py + cut_parts.py) --- */
    runner: {
      base: 'assets/sprites/zombies/runner/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 514, y: 929 },
      contentH: 815,
      height: 44,
      pivots: {
        neck: { x: 747, y: 207 }, shoulder: { x: 914, y: 337 },
        hipB: { x: 473, y: 594 }, hipF: { x: 543, y: 594 },
      },
      cent: {
        head: { x: 747, y: 164 }, torso: { x: 572, y: 396 }, armF: { x: 914, y: 533 },
        legB: { x: 263, y: 732 }, legF: { x: 734, y: 733 },
      },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      /* armSwing 0: a sprintelő póz miatt a kar-vágás csak a kézfejet fogta meg,
         a "váll"-pivot valójában a kéznél van -> ne lengessük. */
      tune: { legSwing: 12, armSwing: 0, cadence: 2.4 },
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    spitter: {
      base: 'assets/sprites/zombies/spitter/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 490, y: 949 },
      contentH: 885,
      height: 48,
      pivots: {
        neck: { x: 651, y: 161 }, shoulder: { x: 682, y: 302 },
        hipB: { x: 613, y: 604 }, hipF: { x: 683, y: 604 },
      },
      cent: {
        head: { x: 651, y: 116 }, torso: { x: 509, y: 385 }, armF: { x: 682, y: 527 },
        legB: { x: 487, y: 757 }, legF: { x: 678, y: 748 },
      },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 10, armSwing: 5, cadence: 2.0 },
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    bloater: {
      base: 'assets/sprites/zombies/bloater/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 495, y: 965 },
      contentH: 875,
      height: 54,
      pivots: {
        neck: { x: 532, y: 235 }, shoulder: { x: 667, y: 375 },
        hipB: { x: 493, y: 689 }, hipF: { x: 563, y: 689 },
      },
      cent: {
        head: { x: 532, y: 166 }, torso: { x: 506, y: 460 }, armF: { x: 667, y: 475 },
        legB: { x: 402, y: 801 }, legF: { x: 604, y: 819 },
      },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 7, armSwing: 4, cadence: 1.5 },
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    brute: {
      base: 'assets/sprites/zombies/brute/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 516, y: 1010 },
      contentH: 949,
      height: 62,
      pivots: {
        neck: { x: 633, y: 145 }, shoulder: { x: 821, y: 296 },
        hipB: { x: 670, y: 619 }, hipF: { x: 740, y: 619 },
      },
      cent: {
        head: { x: 633, y: 116 }, torso: { x: 517, y: 381 }, armF: { x: 821, y: 542 },
        legB: { x: 480, y: 778 }, legF: { x: 806, y: 730 },
      },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 8, armSwing: 5, cadence: 1.6 },
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    boss: {
      base: 'assets/sprites/zombies/boss/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 513, y: 968 },
      contentH: 877,
      height: 86,
      pivots: {
        neck: { x: 559, y: 169 }, shoulder: { x: 787, y: 309 },
        hipB: { x: 296, y: 607 }, hipF: { x: 366, y: 607 },
      },
      cent: {
        head: { x: 559, y: 146 }, torso: { x: 528, y: 381 }, armF: { x: 787, y: 533 },
        legB: { x: 256, y: 785 }, legF: { x: 602, y: 726 },
      },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 8, armSwing: 5, cadence: 1.4 },
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    /* crawler: KIMARAD — négykézláb, vízszintes póz; az álló-rig fogalmai
       (fej fent / csípő / láb lent) nem értelmezhetők rá. Marad a régi rajz. */

    /* --- JÁTSZHATÓ KARAKTEREK (a C.CHARACTERS id-jaival egyezik) ---
       height 54 = a régi HD játékos-atlasz magassága (enemy_sprites P_CFG.h),
       hogy a méret/hitbox ne változzon. */
    farkas: {
      base: 'assets/sprites/characters/farkas/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 504, y: 953 }, contentH: 858, height: 54,
      pivots: { neck: { x: 538, y: 198 }, shoulder: { x: 693, y: 335 }, hipB: { x: 469, y: 665 }, hipF: { x: 539, y: 665 } },
      cent: { head: { x: 538, y: 150 }, torso: { x: 490, y: 422 }, armF: { x: 693, y: 401 }, legB: { x: 362, y: 788 }, legF: { x: 613, y: 806 } },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 11, armSwing: 6, cadence: 2.2 },
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    szellem: {
      base: 'assets/sprites/characters/szellem/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 490, y: 981 }, contentH: 906, height: 54,
      pivots: { neck: { x: 500, y: 227 }, shoulder: { x: 578, y: 371 }, hipB: { x: 455, y: 681 }, hipF: { x: 525, y: 681 } },
      cent: { head: { x: 500, y: 155 }, torso: { x: 482, y: 428 }, armF: { x: 578, y: 529 }, legB: { x: 367, y: 813 }, legF: { x: 596, y: 824 } },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 11, armSwing: 6, cadence: 2.2 },
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    angyal: {
      base: 'assets/sprites/characters/angyal/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 495, y: 964 }, contentH: 875, height: 54,
      pivots: { neck: { x: 550, y: 185 }, shoulder: { x: 803, y: 325 }, hipB: { x: 460, y: 652 }, hipF: { x: 530, y: 652 } },
      cent: { head: { x: 550, y: 142 }, torso: { x: 489, y: 403 }, armF: { x: 803, y: 393 }, legB: { x: 361, y: 789 }, legF: { x: 611, y: 799 } },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 11, armSwing: 6, cadence: 2.2 },
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    medve: {
      base: 'assets/sprites/characters/medve/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 504, y: 935 }, contentH: 859, height: 54,
      pivots: { neck: { x: 481, y: 168 }, shoulder: { x: 812, y: 305 }, hipB: { x: 469, y: 679 }, hipF: { x: 539, y: 679 } },
      cent: { head: { x: 481, y: 132 }, torso: { x: 479, y: 409 }, armF: { x: 812, y: 388 }, legB: { x: 344, y: 786 }, legF: { x: 614, y: 810 } },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 10, armSwing: 5, cadence: 1.9 },   // nehéz páncél -> lassabb ütem
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
    szikra: {
      base: 'assets/sprites/characters/szikra/parts_rig/',
      files: { head: 'head', torso: 'torso', armF: 'arm_front', legB: 'leg_back', legF: 'leg_front' },
      anchor: { x: 514, y: 943 }, contentH: 852, height: 54,
      pivots: { neck: { x: 524, y: 201 }, shoulder: { x: 675, y: 337 }, hipB: { x: 479, y: 620 }, hipF: { x: 549, y: 620 } },
      cent: { head: { x: 524, y: 149 }, torso: { x: 497, y: 413 }, armF: { x: 675, y: 417 }, legB: { x: 382, y: 759 }, legF: { x: 612, y: 770 } },
      order: ['legB', 'torso', 'head', 'legF', 'armF'],
      tune: { legSwing: 12, armSwing: 7, cadence: 2.4 },    // fürge -> gyorsabb ütem
      _img: {}, _mask: {}, _ok: false, _left: 0,
    },
  };

  const PIVOT_OF = { head: 'neck', armF: 'shoulder', legB: 'hipB', legF: 'hipF' };

  function makeMask(im) {
    const m = document.createElement('canvas'); m.width = im.naturalWidth; m.height = im.naturalHeight;
    const g = m.getContext('2d'); g.drawImage(im, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, m.width, m.height);
    return m;
  }

  function load() {
    Object.keys(RIGS).forEach((type) => {
      const rig = RIGS[type];
      rig._left = ROLES.length;
      ROLES.forEach((role) => {
        const im = new Image();
        im.onload = () => { rig._img[role] = im; rig._mask[role] = makeMask(im); if (--rig._left <= 0) rig._ok = true; };
        im.onerror = () => { console.warn('[partRig] part load fail:', type, role); rig._left = 999; rig._ok = false; };
        im.src = rig.base + rig.files[role] + '.png';
      });
    });
  }

  function has(type) { const r = RIGS[type]; return !!r && r._ok; }

  let _t = 0;
  const gibs = [];

  function drawPartSet(ctx, rig, pose, useMask) {
    const src = useMask ? rig._mask : rig._img;
    for (const role of rig.order) {
      const im = src[role]; if (!im) continue;
      const pk = PIVOT_OF[role];
      const piv = pk ? rig.pivots[pk] : null;
      const ang = pose[role] || 0;
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

    /* HALÁL — ÖSSZECSUKLÁS (nem szétesés!). A testszakadás csak nagy/túlölő
       találatnál jár (lásd game.js killZombie gib-ága); egy pisztolylövéstől a
       zombi eldől, nem hullik mértani darabokra a vágásvonalak mentén. */
    if (z.dead) {
      const t = Math.min(1, (z.deathT || 0) / 0.5);
      const ease = 1 - (1 - t) * (1 - t);
      const alpha = (z.deathT || 0) < 0.9 ? 1 : Math.max(0, 1 - ((z.deathT || 0) - 0.9) / 0.5);
      if (alpha <= 0) return true;
      pose.legB = -34 * ease;          // lábak összecsuklanak
      pose.legF = 22 * ease;
      pose.head = 16 * ease;           // fej előrebukik
      pose.armF = -18 * ease;
      const A2 = rig.anchor;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(z.x, z.y);
      ctx.scale(fac * S, S);
      ctx.translate(-A2.x, -A2.y);
      ctx.translate(A2.x, A2.y);       // eldőlés a TALP körül
      ctx.rotate(-ease * 78 * Math.PI / 180);
      ctx.translate(-A2.x, -A2.y);
      drawPartSet(ctx, rig, pose, false);
      ctx.restore();
      ctx.globalAlpha = 1;
      return true;
    }

    if (z.moving) {
      const sw = Math.sin((z.phase || 0) * rig.tune.cadence);
      pose.legB = sw * rig.tune.legSwing;
      pose.legF = -sw * rig.tune.legSwing;
      pose.armF = sw * rig.tune.armSwing;
      pose.head = sw * 3;
      bob = -Math.abs(sw) * rig.height * 0.03;
    } else {
      bob = Math.sin(_t * 1.6) * rig.height * 0.006;
    }

    /* TALÁLAT-REAKCIÓ: a game.js z.flash-t 0.12s-re állítja találatkor.
       Eddig csak a fehér villanás jött -> az ütés nem "ért be". Most a test is
       reagál: hátrahőköl (dőlés a csípő körül), a fej hátracsapódik, és a
       sziluett összelapul. A hátralökést (z.kb -> z.x) a game.js adja. */
    const hit = Math.max(0, Math.min(1, (z.flash || 0) / 0.12));
    let lean = 0, sqX = 1, sqY = 1;
    if (hit > 0) {
      /* Erős értékek szándékosan: a reakció csak ~0.12s (kb. 7 frame), és a
         zombi a képernyőn csak ~46px -> a finom mozgás egyszerűen nem látszik.
         (9 fokos dőlés a fejet mindössze 3px-et mozdította.) */
      lean = -hit * 16;                          // fok: hátra dől
      sqX = 1 + hit * 0.14;
      sqY = 1 - hit * 0.10;
      pose.head = (pose.head || 0) - hit * 22;   // fej hátracsapódik
      pose.armF = (pose.armF || 0) - hit * 14;
      pose.legB = (pose.legB || 0) - hit * 6;    // a hátsó láb megveti magát
    }

    /* lágy talaj-árnyék (a rig megkerüli az enemySprites árnyékát) */
    const sw2 = rig.height * 0.62;
    ctx.save();
    ctx.globalAlpha = 0.32; ctx.fillStyle = '#020408';
    ctx.beginPath(); ctx.ellipse(z.x, z.y, sw2 * 0.5, Math.max(2, sw2 * 0.16), 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const A = rig.anchor;
    const hipMid = {
      x: (rig.pivots.hipB.x + rig.pivots.hipF.x) / 2,
      y: (rig.pivots.hipB.y + rig.pivots.hipF.y) / 2,
    };
    ctx.save();
    ctx.translate(z.x, z.y + bob);
    ctx.scale(fac * S * sqX, S * sqY);      // squash a talp korul
    ctx.translate(-A.x, -A.y);
    if (lean) {                              // hatrahokoles a csipo korul
      ctx.translate(hipMid.x, hipMid.y);
      ctx.rotate(lean * Math.PI / 180);
      ctx.translate(-hipMid.x, -hipMid.y);
    }
    drawPartSet(ctx, rig, pose, false);
    if (z.flash > 0) { ctx.globalAlpha = Math.min(0.85, z.flash * 6); drawPartSet(ctx, rig, pose, true); ctx.globalAlpha = 1; }
    ctx.restore();
    return true;
  }

  /* halálkor: minden testrész leszakad és szétrepül (játék-skálájú sebesség) */
  const GIB_SPEC = {
    head:  (f) => ({ vx: f * rnd(15, 35),  vy: -rnd(150, 210), vr: rnd(6, 12) * f }),
    torso: (f) => ({ vx: -f * rnd(25, 55), vy: -rnd(110, 150), vr: rnd(-5, 5) }),
    armF:  (f) => ({ vx: f * rnd(45, 95),  vy: -rnd(130, 180), vr: rnd(8, 16) * f }),
    legB:  (f) => ({ vx: -rnd(20, 60),     vy: -rnd(90, 140),  vr: rnd(-10, -3) }),
    legF:  (f) => ({ vx: rnd(20, 60),      vy: -rnd(90, 140),  vr: rnd(3, 10) }),
  };
  function spawnGibs(z) {
    const rig = RIGS[z.type]; if (!rig || !rig._ok) return;
    const S = rig.height * (z.elite ? 1.12 : 1) / rig.contentH;
    const fac = z.facing < 0 ? -1 : 1;
    const groundY = ZD.C.GROUND_Y;
    for (const role of ROLES) {
      const c = rig.cent[role];
      const wx = z.x + fac * (c.x - rig.anchor.x) * S;
      const wy = groundY + (c.y - rig.anchor.y) * S;
      const s = GIB_SPEC[role](fac);
      gibs.push({ rig: z.type, role, x: wx, y: wy, S, facing: fac,
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

  /* a kamera-transzformon BELÜL hívandó (világ-koordináták) */
  function drawGibs(ctx) {
    for (const g of gibs) {
      const rig = RIGS[g.rig]; const im = rig && rig._img[g.role]; if (!im) continue;
      const c = rig.cent[g.role];
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
