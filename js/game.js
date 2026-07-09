/* Játékmotor: aréna, hullámok, lövedékek, ütközések, zsákmány + game-feel réteg */
window.ZD = window.ZD || {};

ZD.game = (() => {
  const C = ZD.C;
  const S = () => ZD.save.data;

  const st = {
    running: false,
    paused: false,
    level: 1,
    quota: 0,
    killed: 0,
    bossPhase: false,
    bossRef: null,
    spawnTimer: 0,
    time: 0,
    earned: 0,
    result: null, // 'win' | 'lose'

    player: null,
    zombies: [],
    bullets: [],
    spits: [],
    grenades: [],
    coins: [],
    meds: [],
    ammoBoxes: [], // lőszerláda dropok
    parts: [],   // részecskék
    nums: [],    // lebegő sebzésszámok
    shells: [],  // töltényhüvelyek
    booms: [],   // robbanás-animációk
    decals: [],  // vérfoltok a talajon
    cam: 0,
    shake: 0,
    slowmo: 0,     // lassítás hátralévő ideje (boss-halál)
    hitstop: 0,    // rövid "ütés-fagyás" ölésnél
    banner: null,  // {text, t, total} — cinematikus felirat
    bossBarHp: 0,  // animált boss-HP kijelzés
    mode: 'survival',
    mod: null,     // aktív pálya-módosító id vagy null
    gen: null,     // védendő generátor (defense mód)
    dying: 0,      // játékos halál-szekvencia hátralévő ideje
    groanT: 3,     // következő ambiens zombi-morgásig
    errFlash: 0,   // rövid piros keret-villanás (pl. nincs elég pénz)
    isFree: false, // Free Mode fut-e
    wave: 0,       // Free Mode: aktuális hullám
    waveKills: 0,  // Free Mode: kiiktatva a hullámban
    waveQuota: 0,  // Free Mode: kell a hullám továbblépéséhez
    freeTrickle: 0,// Free Mode: túlélési „csepegő" jutalom időzítő
    stats: { kills: 0, shots: 0, dmg: 0 },
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const chance = (p) => Math.random() < p;

  /* ---------- származtatott játékos-statok ---------- */
  function calcStats() {
    const u = S().upg;
    const U = {};
    C.UPGRADES.forEach((up) => { U[up.id] = up.per * (u[up.id] || 0); });
    return {
      maxHp: C.PLAYER.baseHp + U.hp,
      regen: U.regen,
      dmgMul: 1 + U.dmg,
      crit: U.crit,
      speed: C.PLAYER.speed * (1 + U.speed),
      grenades: C.GRENADE.baseCount + U.gren,
      coinMul: 1 + U.luck,
    };
  }

  function ownedWeapons() {
    return C.WEAPONS.filter((w) => S().weapons.owned.includes(w.id));
  }

  /* ---------- indítás ---------- */
  function start(level, opts = {}) {
    const stats = calcStats();
    const owned = ownedWeapons();
    let wi = owned.findIndex((w) => w.id === S().weapons.equipped);
    if (wi < 0) wi = 0;

    const isFree = level === 'free';
    /* Free Mode: nem kampánypálya — effektív nehézség a hullámból ered (1-től indul) */
    const effLevel = isFree ? 1 : level;
    const mode = isFree ? 'free' : C.modeFor(level);
    const mod = isFree ? null : C.modFor(level);
    let quota = isFree ? Infinity : C.quota(level);
    if (mode === 'elite') quota = Math.max(6, Math.round(quota * 0.45));
    if (mode === 'survive') quota = 99999; // időre megy, nem kvótára
    if (mod === 'horde') quota = Math.round(quota * 1.4);

    Object.assign(st, {
      running: true, paused: false, level: effLevel,
      quota, killed: 0,
      bossPhase: false, bossRef: null,
      spawnTimer: 0.8, time: 0, earned: 0, result: null,
      zombies: [], bullets: [], spits: [], grenades: [], coins: [], meds: [], ammoBoxes: [],
      parts: [], nums: [], shells: [], booms: [], decals: [],
      cam: 0, shake: 0, slowmo: 0, hitstop: 0, banner: null, bossBarHp: 0,
      mode, mod, gen: null, dying: 0, groanT: 3, errFlash: 0,
      isFree,
      wave: isFree ? 1 : 0,
      waveKills: 0,
      waveQuota: isFree ? C.FREE.waveQuota(1) : 0,
      freeTrickle: isFree ? C.FREE.trickleEvery : 0,
      surviveT: mode === 'survive' ? C.surviveTime(level) : 0, hudAcc: 0,
      stats: { kills: 0, shots: 0, dmg: 0 },
    });

    /* defense: generátor a világ közepén, játékos mellette */
    if (mode === 'defense') {
      const ghp = C.GENERATOR.hp0 + C.GENERATOR.hpPer * level;
      st.gen = { x: C.WORLD_W / 2 + 50, hp: ghp, maxHp: ghp, smokeT: 0 };
    }

    st.player = {
      x: C.WORLD_W / 2 - (st.gen ? 60 : 0), hp: stats.maxHp, stats,
      facing: 1, phase: 0, idleT: 0, fireCd: 0, fireAnim: 0, muzzleSeed: 0,
      reloadT: 0,
      invuln: 0, flash: 0,
      /* lőszer a perzisztens készletből (pisztoly végtelen) */
      weapons: owned.map((w) => ({
        def: w,
        ammo: w.id === 'pistol' ? -1 : (S().ammo[w.id] || 0),
        warned: false,
      })),
      wi,
      grenades: stats.grenades + (opts.extraGren || 0),
    };
    /* ha a kiválasztott fegyver üres, pisztolyra állunk */
    if (st.player.weapons[st.player.wi].ammo === 0) st.player.wi = 0;

    const M = C.MODES[mode];
    const T = ZD.i18n.t;
    const modTxt = mod ? C.MODS[mod].name : null;
    st.banner = isFree
      ? { text: T('mode.free'), t: 2, total: 2, sub: T('game.wave1') }
      : {
          text: mode === 'survival' ? T('game.stage', { n: level }) : T('mode.' + mode).toUpperCase(),
          t: 2, total: 2,
          sub: modTxt || (mode === 'survival' ? null : M.desc),
        };
    ZD.audio.play('stage');
    ZD.ui.enterGame();
  }

  /* futás végén a maradék lőszer visszaírása a készletbe */
  function syncAmmo() {
    if (!st.player) return;
    st.player.weapons.forEach((w) => {
      if (w.def.id !== 'pistol') S().ammo[w.def.id] = Math.max(0, w.ammo);
    });
  }

  function curWeapon() { return st.player.weapons[st.player.wi]; }

  /* ---------- zombi spawn ---------- */
  function pickType() {
    const table = C.spawnTable(st.level);
    let total = 0;
    table.forEach(([, w]) => { total += w; });
    let r = Math.random() * total;
    for (const [type, w] of table) {
      r -= w;
      if (r <= 0) return type;
    }
    return 'walker';
  }

  function spawnZombie(type, opts = {}) {
    const def = C.ZOMBIES[type];
    const side = chance(0.5) ? -1 : 1;
    const x = side < 0 ? -20 : C.WORLD_W + 20;
    /* boss: dedikált, fair skálázás (nem a sima hpMul/dmgMul), a többi zombi a szintből */
    let hp = type === 'boss' ? C.bossHp(st.level) : def.hp * C.hpMul(st.level);
    let dmg = type === 'boss' ? C.bossDmg(st.level) : def.dmg * C.dmgMul(st.level);
    let speed = rand(def.speed[0], def.speed[1]);
    let coinMul = 1;

    /* elit vadászat: mindenki keményebb, néhány kiemelt elit */
    if (st.mode === 'elite' && type !== 'boss') {
      hp *= opts.elite ? 4.5 : 2;
      dmg *= opts.elite ? 1.5 : 1.3;
      speed *= opts.elite ? 1.2 : 1.1;
      coinMul = opts.elite ? 6 : 2.5;
    }
    if (st.mod === 'fast') speed *= 1.25;
    if (st.mod === 'gold') coinMul *= 2;

    st.zombies.push({
      type, def,
      variant: chance(0.5) ? 0 : 1,
      elite: !!opts.elite,
      x,
      hp, maxHp: hp, dmg, speed, coinMul,
      facing: -side,
      phase: rand(0, 6.28),
      atkCd: 0,
      flash: 0,
      kb: 0,
      dead: false,
      deathT: 0,
      slamCd: 4,
      /* defense: a zombik egy része a generátorra megy */
      tgt: st.gen && type !== 'spitter' && chance(0.55) ? 'gen' : 'player',
      minion: !!opts.minion,
      /* sprite-animáció + speciális állapotok */
      anim: null, moving: false, attackingAnim: 0, warnT: 0, bursting: false,
      bossState: null, bossStateT: 0,
      /* per-egyed vizuális variáció (ne nézzenek ki ugyanolyan beillesztett képként) */
      sizeVar: type === 'boss' ? 1 : rand(0.93, 1.07),
      briVar: rand(0.9, 1.06),
      animRate: rand(0.86, 1.14),
    });
  }

  /* ---------- lövés ---------- */
  function shoot() {
    const p = st.player;
    const w = curWeapon();
    if (w.ammo === 0) { // kifogyott → pisztolyra váltás
      p.wi = 0;
      ZD.ui.updateHud();
      return;
    }
    const def = w.def;
    p.fireCd = 1 / def.rps;
    p.fireAnim = 0.07;
    p.muzzleSeed++;
    p.reloadT = 0;
    st.stats.shots++;
    if (w.ammo > 0) {
      w.ammo--;
      /* alacsony lőszer figyelmeztetés — egyszer, a küszöb átlépésekor */
      const warnAt = Math.max(8, Math.ceil((def.pack || 40) * 0.2));
      if (!w.warned && w.ammo > 0 && w.ammo <= warnAt) {
        w.warned = true;
        ZD.audio.play('lowammo');
        st.nums.push({
          x: p.x, y: C.GROUND_Y - C.PLAYER.h - 14,
          vx: 0, vy: -26, life: 1.2, max: 1.2, val: ZD.i18n.t('hud.lowAmmo'), warn: true,
        });
      }
      if (w.ammo === 0) {
        st.nums.push({
          x: p.x, y: C.GROUND_Y - C.PLAYER.h - 14,
          vx: 0, vy: -26, life: 1.3, max: 1.3, val: ZD.i18n.t('hud.outAmmo'), warn: true,
        });
      }
    }

    const gy = C.GROUND_Y - 15;
    for (let i = 0; i < (def.pellets || 1); i++) {
      const sp = (Math.random() - 0.5) * 2 * def.spread;
      const crit = chance(p.stats.crit);
      st.bullets.push({
        x: p.x + p.facing * 12,
        y: gy + sp * 60,
        vx: p.facing * def.spd * (1 + sp * 0.3),
        vy: def.kind === 'flame' ? rand(-18, -2) : sp * 40,
        dmg: def.dmg * p.stats.dmgMul * (crit ? 2 : 1),
        crit,
        kind: def.kind,
        kb: def.kb !== undefined ? def.kb : 14,
        color: def.color,
        pierce: def.pierce || 0,
        splash: def.splash || 0,
        life: def.kind === 'flame' ? (def.range / def.spd) : 1.2,
        hitSet: null,
      });
    }

    /* visszarúgás-effektek + torkolattűz-punch (szikrák, füst, fény) */
    st.shake = Math.max(st.shake, def.shake ? def.shake : 1.2);
    const mx = p.x + p.facing * 15, my = gy;
    st.muzzle = { x: mx, y: my, t: 0.07, big: (def.pellets || 1) > 1 || def.kind === 'rocket' || (def.shake || 0) > 6 };
    if (def.kind !== 'flame') {
      const nsp = (def.pellets || 1) > 1 ? 4 : 2;
      for (let i = 0; i < nsp; i++) {
        st.parts.push({
          x: mx, y: my + rand(-2, 2),
          vx: p.facing * rand(140, 260), vy: rand(-45, 45),
          life: rand(0.05, 0.14), color: chance(0.5) ? '#fff4d0' : '#ffcf6a', size: rand(1, 2.4), grav: 0,
        });
      }
      if (chance(0.5)) st.parts.push({
        x: mx + p.facing * 4, y: my - 2,
        vx: p.facing * rand(8, 34), vy: rand(-28, -6),
        life: rand(0.28, 0.55), color: '#6b6255', size: rand(1.6, 3.2), grav: 0,
      });
    }
    if (def.casing) {
      st.shells.push({
        x: p.x + p.facing * 4, y: gy - 2,
        vx: -p.facing * rand(30, 70), vy: rand(-130, -80),
        rot: rand(0, 6.28), vr: rand(-12, 12),
        life: rand(0.9, 1.4), bounced: false,
      });
    }

    const sfx = { pistol: 'shot', uzi: 'uzi', shotgun: 'shotgun', rifle: 'rifle', flamer: 'flame', minigun: 'minigun', rocket: 'rocket', laser: 'laser' };
    ZD.audio.play(sfx[def.id] || 'shot');
    ZD.ui.updateHud();
  }

  function throwGrenade() {
    const p = st.player;
    if (p.grenades <= 0) return;
    p.grenades--;
    st.grenades.push({
      x: p.x, y: C.GROUND_Y - 20,
      vx: p.facing * 150, vy: -180,
    });
    /* dobás-feedback: kis por-pukkanás a kéznél + könnyű rúgás */
    const hx = p.x + p.facing * 12, hy = C.GROUND_Y - 22;
    for (let i = 0; i < 4; i++) {
      st.parts.push({
        x: hx, y: hy, vx: p.facing * rand(20, 70), vy: rand(-40, 0),
        life: rand(0.2, 0.4), color: '#7a7264', size: rand(1.4, 2.6), grav: 0,
      });
    }
    st.shake = Math.max(st.shake, 2);
    ZD.audio.play('throw');
    ZD.ui.updateHud();
  }

  /* lebegő felirat a játékos fölött (vásárlás/figyelmeztetés) */
  function floatMsg(val, kind) {
    const p = st.player;
    st.nums.push({
      x: p.x, y: C.GROUND_Y - C.PLAYER.h - 12,
      vx: 0, vy: -30, life: 1, max: 1, val,
      warn: kind === 'warn', ammo: kind === 'ammo', crit: kind === 'good',
    });
  }

  /* ---------- meccs közbeni (emergency) lőszervásárlás ---------- */
  function buyAmmoInMatch() {
    const p = st.player;
    const w = curWeapon();
    if (w.def.id === 'pistol') {
      floatMsg(ZD.i18n.t('hud.pistolInf'), 'ammo');
      ZD.audio.play('click');
      return;
    }
    const price = Math.ceil(w.def.packPrice * C.AMMO_EMERGENCY);
    const amt = w.def.pack;
    if (S().coins >= price) {
      S().coins -= price;
      w.ammo += amt;
      w.warned = false;
      floatMsg(ZD.i18n.t('hud.ammoAdded', { n: amt }), 'ammo');
      ZD.audio.play('ammo');
    } else {
      st.errFlash = 0.45;
      floatMsg(ZD.i18n.t('hud.noCoins'), 'warn');
      ZD.audio.play('lowammo');
    }
    ZD.ui.updateHud();
  }

  /* ---------- Free Mode: hullámléptetés ---------- */
  function advanceWave() {
    st.wave++;
    st.waveKills = 0;
    st.waveQuota = C.FREE.waveQuota(st.wave);
    st.level = C.FREE.levelFor(st.wave); // effektív nehézség ramp
    const bonus = C.FREE.waveBonus(st.wave);
    st.earned += bonus; S().coins += bonus;
    const mini = st.wave % C.FREE.miniBossEvery === 0;
    st.banner = {
      text: ZD.i18n.t('hud.wave', { n: st.wave }), t: 1.5, total: 1.5,
      sub: mini ? `${ZD.i18n.t('hud.miniBoss')} · +${bonus}` : `+${bonus}`,
    };
    ZD.audio.play('stage');
    if (mini) { spawnZombie('brute'); ZD.audio.play('roar'); }
    ZD.ui.updateHud();
  }

  /* ---------- Free Mode: futam vége (halálkor) ---------- */
  function freeEnd() {
    st.result = 'free';
    const timeBonus = Math.round(st.time * C.FREE.timeBonusMul);
    st.earned += timeBonus; S().coins += timeBonus;
    syncAmmo();
    ZD.save.persist();
    ZD.audio.play('lose');
    ZD.ui.showResult('free', st.earned, timeBonus, st.stats, { wave: st.wave, time: st.time });
  }

  function explode(x, y, dmg, radius, big) {
    ZD.audio.play('boom');
    st.shake = Math.max(st.shake, big ? 14 : 9);
    st.hitstop = Math.max(st.hitstop, big ? 0.075 : 0.05);
    st.booms.push({ x, y: Math.min(y, C.GROUND_Y - 4), t: 0, scale: big ? 1.6 : 1 });
    const cy = Math.min(y, C.GROUND_Y - 4);
    /* tűz + törmelék */
    for (let i = 0; i < (big ? 46 : 30); i++) {
      st.parts.push({
        x, y: y - 4, vx: rand(-190, 190), vy: rand(-230, -20),
        life: rand(0.3, 0.85), color: chance(0.4) ? '#ffb84d' : chance(0.5) ? '#ff7433' : '#5a5148', size: rand(1.5, 4.2), grav: 1,
      });
    }
    /* fényes mag-szikrák (additív-jellegű világos) */
    for (let i = 0; i < (big ? 14 : 9); i++) {
      const ang = rand(0, 6.28), sp = rand(60, big ? 260 : 180);
      st.parts.push({
        x, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 40,
        life: rand(0.12, 0.3), color: chance(0.5) ? '#fff6d8' : '#ffe08a', size: rand(1.5, 3), grav: 0,
      });
    }
    /* földi porgyűrű */
    for (let i = 0; i < (big ? 10 : 6); i++) {
      st.parts.push({
        x: x + rand(-6, 6), y: C.GROUND_Y - 2, vx: rand(-140, 140), vy: rand(-30, -4),
        life: rand(0.35, 0.7), color: '#6b6255', size: rand(2, 3.6), grav: 0,
      });
    }
    st.zombies.forEach((z) => {
      if (z.dead) return;
      const d = Math.abs(z.x - x);
      if (d < radius) {
        hurtZombie(z, dmg * (1 - (d / radius) * 0.5), false);
        z.kb += (z.x < x ? -1 : 1) * 60;
      }
    });
  }

  function addDecal(x, big) {
    st.decals.push({ x: x + rand(-4, 4), w: big ? rand(16, 26) : rand(8, 15), life: 24, max: 24 });
    if (st.decals.length > 40) st.decals.shift();
  }

  /* BLOATER robbanás: halál + loot + területi sebzés a játékosra ÉS a közeli zombikra,
     narancs-vörös VFX. (Kód-vezérelt burst — nincs dedikált burst-frame.) */
  function bloaterBurst(z) {
    if (z.bursting) return;
    z.bursting = true;
    const R = z.def.burstR || 74, dmg = z.def.burstDmg || 26;
    const cy = C.GROUND_Y - z.def.h * 0.45;
    if (!z.dead) killZombie(z);   // dead=true → az explode kihagyja a bloatert
    explode(z.x, cy, dmg, R);     // AoE a többi zombira + boom + shake
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * 6.28, sp = rand(40, R * 2.4);
      st.parts.push({ x: z.x, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: rand(0.25, 0.6), color: chance(0.5) ? '#ff7a2a' : '#ffc24d', size: rand(2, 4), grav: 0 });
    }
    if (Math.abs(st.player.x - z.x) < R) hurtPlayer(dmg);
  }

  /* ---------- sebzés a zombinak (dir: vérfröccsenés iránya) ---------- */
  function hurtZombie(z, dmg, crit, dir = 0) {
    z.hp -= dmg;
    z.flash = 0.12;
    st.stats.dmg += dmg;
    if (crit) st.hitstop = Math.max(st.hitstop, 0.035);
    st.nums.push({
      x: z.x + rand(-4, 4), y: C.GROUND_Y - z.def.h - 8,
      vx: rand(-8, 8), vy: -38, life: crit ? 0.85 : 0.65, max: crit ? 0.85 : 0.65,
      val: Math.round(dmg), crit,
    });
    /* becsapódási szikrák — rövid, fényes "punch" a találatnál */
    const hy = C.GROUND_Y - z.def.h * 0.6;
    for (let i = 0; i < (crit ? 4 : 2); i++) {
      st.parts.push({
        x: z.x, y: hy,
        vx: (dir !== 0 ? dir : (chance(0.5) ? 1 : -1)) * rand(60, 180), vy: rand(-70, 30),
        life: rand(0.06, 0.16), color: crit ? '#fff2c8' : '#ffd98a', size: rand(1, 2.2), grav: 0,
      });
    }
    /* irányított vérfröccsenés — a lövés irányába spriccel */
    for (let i = 0; i < (crit ? 10 : 7); i++) {
      const away = dir !== 0 ? dir * rand(15, 95) : rand(-60, 60);
      st.parts.push({
        x: z.x, y: C.GROUND_Y - z.def.h * rand(0.4, 0.75),
        vx: away + rand(-25, 25), vy: rand(-100, -10),
        life: rand(0.25, 0.55), color: chance(0.6) ? '#8f2f2f' : '#6e2020', size: rand(1.5, 3), grav: 1,
      });
    }
    if (chance(0.3)) addDecal(z.x + dir * 6, false);
    ZD.audio.play('hit');
    if (z.hp <= 0 && !z.dead) {
      if (z.type === 'bloater') bloaterBurst(z);  // lelőve is robban
      else killZombie(z);
    }
  }

  function killZombie(z) {
    z.dead = true;
    z.deathT = 0;
    ZD.audio.play('zdie');
    addDecal(z.x, z.type === 'brute' || z.type === 'boss');
    st.stats.kills++;
    /* hit-stop: az ölés "üt" — nagyobb ellenfélnél hosszabb */
    st.hitstop = Math.max(st.hitstop, z.type === 'brute' ? 0.07 : z.elite ? 0.08 : 0.045);

    if (z.type === 'boss') {
      st.bossRef = null;
      /* látványos boss-halál: lassítás + robbanás + felirat */
      st.slowmo = 1.3;
      st.shake = Math.max(st.shake, 10);
      st.booms.push({ x: z.x, y: C.GROUND_Y - z.def.h * 0.5, t: -0.15, scale: 1.8 });
      for (let i = 0; i < 30; i++) {
        st.parts.push({
          x: z.x + rand(-14, 14), y: C.GROUND_Y - rand(4, z.def.h * 0.9),
          vx: rand(-140, 140), vy: rand(-220, -40),
          life: rand(0.4, 1.1), color: chance(0.5) ? '#8f2f2f' : chance(0.5) ? '#5f1f1f' : '#4a6b45', size: rand(2, 4), grav: 1,
        });
      }
      st.banner = { text: 'VEZÉR LEGYŐZVE', t: 2, total: 2, sub: null };
      ZD.audio.play('roar');
    } else {
      st.killed++;
      if (st.mode === 'free') st.waveKills++;
    }

    // vér-részecskék + húscafatok
    for (let i = 0; i < 16; i++) {
      st.parts.push({
        x: z.x, y: C.GROUND_Y - z.def.h * 0.5, vx: rand(-100, 100), vy: rand(-160, -20),
        life: rand(0.3, 0.8), color: chance(0.6) ? '#8f2f2f' : '#5f1f1f', size: rand(1.5, 3), grav: 1,
      });
    }
    const zp = ZD.C.ZOMBIES[z.type];
    for (let i = 0; i < 4; i++) {
      st.parts.push({
        x: z.x + rand(-4, 4), y: C.GROUND_Y - zp.h * rand(0.3, 0.8),
        vx: rand(-70, 70), vy: rand(-170, -60),
        life: rand(0.4, 0.9), color: chance(0.5) ? '#6f8a55' : '#5a7a44', size: rand(2.5, 4), grav: 1,
      });
    }
    // érmék (elit/módosító szorzóval)
    const val = Math.round(z.def.coin * C.coinMul(st.level) * st.player.stats.coinMul * (z.coinMul || 1));
    const n = Math.min(z.elite ? 8 : 5, 1 + Math.floor(val / 12));
    for (let i = 0; i < n; i++) {
      st.coins.push({
        x: z.x, y: C.GROUND_Y - 14, vx: rand(-70, 70), vy: rand(-170, -70),
        val: Math.max(1, Math.round(val / n)), life: 12, settled: false, spin: (Math.random() * 6) | 0,
      });
    }
    // medkit esély (elit garantáltan dob valamit)
    if (chance(0.045) || (z.elite && chance(0.5))) {
      st.meds.push({ x: z.x, y: C.GROUND_Y - 12, vy: -110, life: 12 });
    } else if (chance(0.05) || (z.elite && chance(0.6))) {
      // lőszerláda drop
      st.ammoBoxes.push({ x: z.x, y: C.GROUND_Y - 12, vy: -100, life: 12 });
    }
  }

  /* ---------- frissítés ---------- */
  function update(rdt) {
    if (!st.running || st.paused || st.result) return;
    const p = st.player;
    const inp = ZD.input.state;

    /* lassítás (boss-halál) + hit-stop — a világ lassul, a banner nem */
    let dt = rdt;
    if (st.slowmo > 0) {
      st.slowmo -= rdt;
      dt = rdt * 0.32;
    }
    if (st.hitstop > 0) {
      st.hitstop -= rdt;
      dt *= 0.1;
    }
    st.time += dt;
    if (st.banner) {
      st.banner.t -= rdt;
      if (st.banner.t <= 0) st.banner = null;
    }
    if (st.errFlash > 0) st.errFlash -= rdt;

    /* — túlélés mód: időre megy, a HUD folyamatosan frissül — */
    if (st.mode === 'survive') {
      st.hudAcc += rdt;
      if (st.hudAcc > 0.25) { st.hudAcc = 0; ZD.ui.updateHud(); }
      if (st.time >= st.surviveT && !st.result) { win(); return; }
    }

    /* — Free Mode: hullámléptetés + túlélési „csepegő" jutalom — */
    if (st.mode === 'free') {
      st.hudAcc += rdt;
      if (st.hudAcc > 0.25) { st.hudAcc = 0; ZD.ui.updateHud(); }
      st.freeTrickle -= dt;
      if (st.freeTrickle <= 0) {
        st.freeTrickle = C.FREE.trickleEvery;
        const t = C.FREE.trickle(st.wave);
        st.earned += t; S().coins += t;
      }
      if (st.waveKills >= st.waveQuota) advanceWave();
    }

    /* — játékos halál-szekvencia: a világ még pörög, de nincs irányítás — */
    if (st.dying > 0) {
      st.dying -= rdt;
      if (st.dying <= 0) { if (st.mode === 'free') freeEnd(); else lose(); return; }
    }

    /* — bemenet, él-triggerek — */
    if (inp.pause) { inp.pause = false; pause(); return; }
    if (st.dying <= 0) {
      if (inp.grenade) { inp.grenade = false; throwGrenade(); }
      if (inp.swap) {
        inp.swap = false;
        p.wi = (p.wi + 1) % p.weapons.length;
        p.reloadT = 0.5;
        ZD.audio.play('reload');
        ZD.ui.updateHud();
        if (ZD.ui.flashReload) ZD.ui.flashReload(0.5);
      }
      if (inp.buyammo) { inp.buyammo = false; buyAmmoInMatch(); }
    } else {
      inp.grenade = false; inp.swap = false; inp.buyammo = false;
    }

    /* — játékos mozgás — */
    if (st.dying > 0) {
      /* halott: nem mozog, nem lő */
    } else if (inp.axis !== 0) {
      p.facing = inp.axis > 0 ? 1 : -1;
      p.x += inp.axis * p.stats.speed * dt;
      p.x = Math.max(10, Math.min(C.WORLD_W - 10, p.x));
      p.phase += dt * 11;
      p.idleT = 0;
    } else {
      p.phase = 0;
      p.idleT += dt;
    }
    if (p.fireCd > 0) p.fireCd -= dt;
    if (p.fireAnim > 0) p.fireAnim -= dt;
    if (p.reloadT > 0) p.reloadT -= dt;
    if (st.muzzle && st.muzzle.t > 0) st.muzzle.t -= dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.flash > 0) p.flash -= dt;
    if (st.dying <= 0 && inp.fire && p.fireCd <= 0) shoot();

    // regeneráció
    if (p.stats.regen > 0 && p.hp < p.stats.maxHp) {
      p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.regen * dt);
    }

    /* — spawn — */
    const spawnedLeft = st.quota - st.killed - st.zombies.filter((z) => !z.dead && z.type !== 'boss').length;
    if (st.killed < st.quota && spawnedLeft > 0) {
      st.spawnTimer -= dt;
      if (st.spawnTimer <= 0 && st.zombies.filter((z) => !z.dead).length < C.cap(st.level)) {
        let iv = C.spawnInterval(st.level);
        if (st.mod === 'horde') iv *= 0.72;
        if (st.mode === 'elite') iv *= 1.7;
        st.spawnTimer = iv * rand(0.7, 1.3);
        spawnZombie(pickType(), { elite: st.mode === 'elite' && chance(0.22) });
      }
    } else if (st.killed >= st.quota && !st.bossPhase && C.isBossLevel(st.level)) {
      st.bossPhase = true;
      spawnZombie('boss');
      st.bossRef = st.zombies[st.zombies.length - 1];
      st.bossBarHp = 1;
      st.shake = 7;
      st.banner = { text: ZD.i18n.t('game.bossArrived'), t: 2.2, total: 2.2, sub: null };
      ZD.audio.play('roar');
    } else if (st.killed >= st.quota && st.zombies.every((z) => z.dead) && !st.result) {
      win();
    }

    /* — zombik — */
    st.zombies.forEach((z) => {
      if (z.dead) { z.deathT += dt; if (ZD.enemySprites) ZD.enemySprites.stepAnim(z, dt); return; }
      z.phase += dt * (4 + z.speed * 0.06);
      if (z.flash > 0) z.flash -= dt;
      if (z.atkCd > 0) z.atkCd -= dt;
      /* animációs jelzők (a sprite-animátornak) */
      if (z.attackingAnim > 0) z.attackingAnim -= dt;
      if (z.bossStateT > 0) { z.bossStateT -= dt; if (z.bossStateT <= 0) z.bossState = null; }
      z.moving = false;

      // visszalökés
      if (z.kb !== 0) {
        z.x += z.kb * dt * 3;
        z.kb *= Math.max(0, 1 - dt * 8);
        if (Math.abs(z.kb) < 2) z.kb = 0;
      }

      /* célpont: játékos, vagy defense-módban a generátor */
      const tx = (z.tgt === 'gen' && st.gen) ? st.gen.x : p.x;
      const dx = tx - z.x;
      z.facing = dx > 0 ? 1 : -1;
      const dist = Math.abs(dx);

      // köpködő: távolról támad
      if (z.type === 'spitter' && dist < z.def.range && dist > 40) {
        if (z.atkCd <= 0) {
          z.atkCd = z.def.atkCd;
          const t = Math.max(0.5, dist / 190);
          const sy = C.GROUND_Y - z.def.h + 6;
          st.spits.push({
            x: z.x, y: sy,
            vx: dx / t,
            vy: ((C.GROUND_Y - sy) - 0.5 * C.GRAVITY * t * t) / t, // ballisztikus ív a játékosra
            dmg: z.dmg,
          });
          ZD.audio.play('spit');
          z.attackingAnim = 0.35;
        }
      } else if (dist > z.def.reach) {
        z.x += Math.sign(dx) * z.speed * dt;
        z.moving = true;
      } else if (z.atkCd <= 0) {
        // közelharci támadás — játékosra vagy generátorra
        z.atkCd = z.def.atkCd;
        z.attackingAnim = 0.3;
        if (z.tgt === 'gen' && st.gen) hurtGen(z.dmg);
        else hurtPlayer(z.dmg);
        if (z.type === 'boss' || z.type === 'brute') st.shake = Math.max(st.shake, 3);
        if (z.type === 'boss') { z.bossState = 'attack'; z.bossStateT = 0.4; }
      }

      /* BLOATER: lassú; közel a célhoz → begyújt (warning), majd területi robbanás.
         (Robbanás halálkor is — lásd a hurtZombie/killZombie ágat.) */
      if (z.type === 'bloater' && !z.bursting) {
        if (z.warnT > 0) {
          z.warnT -= dt;
          if (z.warnT <= 0) { bloaterBurst(z); }
        } else if (dist < (z.def.reach + 22)) {
          z.warnT = 0.75;
          ZD.audio.play('groan');
        }
      }

      // boss: fázisváltások + telegrafált földcsapás (fair, kitérhető)
      if (z.type === 'boss') {
        const r = z.hp / z.maxHp;
        if (r < 0.7 && !z.ph1) {
          z.ph1 = true;
          z.speed *= 1.35;
          st.shake = Math.max(st.shake, 4);
          ZD.audio.play('roar');
        }
        if (r < 0.4 && !z.ph2) {
          z.ph2 = true;
          z.summonCd = 2;
          st.banner = { text: 'A VEZÉR SEGÍTSÉGET HÍV!', t: 1.6, total: 1.6, sub: null };
          ZD.audio.play('roar');
        }
        if (r < 0.2 && !z.ph3) {
          z.ph3 = true;
          z.enrage = true;
          z.dmg *= 1.25;
          z.speed *= 1.25;
          st.banner = { text: ZD.i18n.t('game.bossEnraged'), t: 1.6, total: 1.6, sub: null };
          st.shake = Math.max(st.shake, 6);
          ZD.audio.play('roar');
        }
        /* minion-hívás a 2. fázisban — visszafogott (max 3, egyesével) */
        if (z.ph2) {
          z.summonCd -= dt;
          const minions = st.zombies.filter((m) => m.minion && !m.dead).length;
          if (z.summonCd <= 0 && minions < 3) {
            z.summonCd = 6;
            z.bossState = 'summon'; z.bossStateT = 0.5;
            spawnZombie(chance(0.5) ? 'walker' : 'runner', { minion: true });
            st.shake = Math.max(st.shake, 3);
          }
        }
        /* földcsapás: előbb ~0,6 mp telegraf (porgyűrű + morgás), utána csapás →
           a játékosnak van ideje kitérni a hatókörből */
        z.slamCd -= dt;
        const slamR = z.enrage ? 150 : 128;
        if (z.slamCd <= 0.6 && z.slamCd > 0 && !z.slamWarned) {
          z.slamWarned = true;
          ZD.audio.play('groan');
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * 6.28;
            st.parts.push({
              x: z.x + Math.cos(a) * slamR, y: C.GROUND_Y - 2,
              vx: 0, vy: rand(-40, -14),
              life: rand(0.4, 0.7), color: '#c2662a', size: rand(2, 3.5), grav: 0,
            });
          }
        }
        if (z.slamCd <= 0) {
          z.slamCd = z.ph1 ? 4.5 : 6;
          z.slamWarned = false;
          z.bossState = 'attack'; z.bossStateT = 0.45;
          ZD.audio.play('slam');
          st.shake = Math.max(st.shake, 7);
          if (Math.abs(p.x - z.x) < slamR) hurtPlayer(z.dmg * 0.8);
          for (let i = 0; i < 14; i++) {
            st.parts.push({
              x: z.x + rand(-slamR * 0.8, slamR * 0.8), y: C.GROUND_Y, vx: rand(-20, 20), vy: rand(-160, -60),
              life: rand(0.3, 0.6), color: '#4a4436', size: rand(2, 4), grav: 1,
            });
          }
        }
      }

      /* sprite-animátor léptetése (a kiválasztott állapot + frame-idő szerint) */
      if (ZD.enemySprites) ZD.enemySprites.stepAnim(z, dt);
    });
    // holttestek eltávolítása az animáció után
    st.zombies = st.zombies.filter((z) => !z.dead || z.deathT < 1.3);

    /* — lövedékek — */
    st.bullets = st.bullets.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      // rakéta füstcsík
      if (b.kind === 'rocket' && chance(0.6)) {
        st.parts.push({
          x: b.x - Math.sign(b.vx) * 5, y: b.y + rand(-1, 1),
          vx: rand(-8, 8), vy: rand(-14, -4),
          life: rand(0.25, 0.5), color: chance(0.5) ? '#5a5148' : '#6e655a', size: 2, grav: 0,
        });
      }
      if (b.life <= 0 || b.x < -30 || b.x > C.WORLD_W + 30) {
        if (b.kind === 'rocket') explode(b.x, C.GROUND_Y - 10, b.dmg, b.splash);
        if (b.kind === 'flame') {
          // láng kihuny: parázs
          st.parts.push({ x: b.x, y: b.y, vx: rand(-10, 10), vy: rand(-24, -8), life: 0.3, color: '#ff9a3d', size: 1.5, grav: 0 });
        }
        return false;
      }
      for (const z of st.zombies) {
        if (z.dead) continue;
        const zTop = C.GROUND_Y - z.def.h;
        if (Math.abs(b.x - z.x) < z.def.w / 2 + 3 && b.y > zTop - 6 && b.y < C.GROUND_Y + 4) {
          if (b.kind === 'rocket') {
            explode(b.x, b.y, b.dmg, b.splash);
            return false;
          }
          if (b.hitSet && b.hitSet.has(z)) continue;
          hurtZombie(z, b.dmg, b.crit, Math.sign(b.vx));
          z.kb += Math.sign(b.vx) * b.kb * (z.type === 'brute' ? 0.4 : z.type === 'boss' ? 0.15 : 1);
          if (b.kind === 'laser') {
            st.parts.push({ x: b.x, y: b.y, vx: rand(-40, 40), vy: rand(-50, 10), life: 0.2, color: '#7de0ff', size: 1.5, grav: 0 });
          }
          if (b.pierce > 0) {
            b.pierce--;
            (b.hitSet = b.hitSet || new Set()).add(z);
            continue;
          }
          return false;
        }
      }
      return true;
    });

    /* — köpet lövedékek — */
    st.spits = st.spits.filter((s) => {
      s.vy += C.GRAVITY * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (chance(0.3)) {
        st.parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.18, color: '#7aab3a', size: 1.5, grav: 0 });
      }
      if (Math.abs(s.x - p.x) < 10 && s.y > C.GROUND_Y - C.PLAYER.h && s.y < C.GROUND_Y) {
        hurtPlayer(s.dmg);
        return false;
      }
      if (s.y >= C.GROUND_Y) {
        for (let i = 0; i < 5; i++) {
          st.parts.push({ x: s.x, y: C.GROUND_Y, vx: rand(-35, 35), vy: rand(-70, -20), life: 0.35, color: '#b0ff5b', size: 2, grav: 1 });
        }
        return false;
      }
      return true;
    });

    /* — gránátok — */
    st.grenades = st.grenades.filter((g) => {
      g.vy += C.GRAVITY * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.y >= C.GROUND_Y - 2) {
        explode(g.x, C.GROUND_Y - 6, C.GRENADE.dmg * p.stats.dmgMul, C.GRENADE.radius);
        return false;
      }
      return true;
    });

    /* — töltényhüvelyek — */
    st.shells = st.shells.filter((s) => {
      s.life -= dt;
      s.vy += C.GRAVITY * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
      if (s.y >= C.GROUND_Y - 1 && s.vy > 0) {
        s.y = C.GROUND_Y - 1;
        if (!s.bounced && Math.abs(s.vy) > 40) {
          s.vy *= -0.4; s.vx *= 0.5; s.vr *= 0.5; s.bounced = true;
        } else {
          s.vy = 0; s.vx = 0; s.vr = 0;
        }
      }
      return s.life > 0;
    });

    /* — robbanás-animációk — */
    st.booms = st.booms.filter((b) => {
      b.t += dt;
      return b.t < 0.55;
    });

    /* — vérfoltok halványulása — */
    st.decals = st.decals.filter((d) => {
      d.life -= dt;
      return d.life > 0;
    });

    /* — érmék, medkitek — */
    st.coins = st.coins.filter((c) => {
      c.life -= dt;
      if (!c.settled) {
        c.vy += C.GRAVITY * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.y >= C.GROUND_Y - 3) {
          c.y = C.GROUND_Y - 3;
          if (Math.abs(c.vy) > 60) { c.vy *= -0.45; c.vx *= 0.7; }
          else { c.settled = true; }
        }
      }
      // mágnes + felvétel
      const d = Math.abs(c.x - p.x);
      if (d < 55) c.x += Math.sign(p.x - c.x) * 160 * dt;
      if (d < 12) {
        st.earned += c.val;
        S().coins += c.val;
        for (let i = 0; i < 4; i++) {
          st.parts.push({
            x: c.x, y: c.y - 4, vx: rand(-30, 30), vy: rand(-70, -30),
            life: rand(0.2, 0.4), color: chance(0.5) ? '#ffc14d' : '#ffe9a8', size: 1.5, grav: 0,
          });
        }
        ZD.audio.play('coin');
        ZD.ui.updateHud();
        return false;
      }
      return c.life > 0;
    });

    /* — lőszerládák — */
    st.ammoBoxes = st.ammoBoxes.filter((a) => {
      a.life -= dt;
      a.vy += C.GRAVITY * dt;
      a.y = Math.min(C.GROUND_Y - 5, a.y + a.vy * dt);
      if (Math.abs(a.x - p.x) < 14) {
        /* lőszer a kézben lévő (nem pisztoly) fegyverhez, különben egy másik birtokolthoz */
        let w = curWeapon().def.id !== 'pistol' ? curWeapon()
          : p.weapons.find((q) => q.def.id !== 'pistol');
        if (w) {
          const amt = Math.max(4, Math.ceil((w.def.pack || 40) * 0.25));
          w.ammo += amt;
          w.warned = false;
          st.nums.push({
            x: p.x, y: C.GROUND_Y - C.PLAYER.h - 10,
            vx: 0, vy: -30, life: 0.9, max: 0.9, val: `+${amt} LŐSZER`, ammo: true,
          });
        } else {
          st.earned += 20;
          S().coins += 20;
          st.nums.push({
            x: p.x, y: C.GROUND_Y - C.PLAYER.h - 10,
            vx: 0, vy: -30, life: 0.9, max: 0.9, val: '+20', crit: true,
          });
        }
        ZD.audio.play('ammo');
        ZD.ui.updateHud();
        return false;
      }
      return a.life > 0;
    });

    st.meds = st.meds.filter((m) => {
      m.life -= dt;
      m.vy += C.GRAVITY * dt;
      m.y = Math.min(C.GROUND_Y - 5, m.y + m.vy * dt);
      if (Math.abs(m.x - p.x) < 14) {
        const heal = p.stats.maxHp * 0.25;
        p.hp = Math.min(p.stats.maxHp, p.hp + heal);
        st.nums.push({
          x: p.x, y: C.GROUND_Y - C.PLAYER.h - 10,
          vx: 0, vy: -30, life: 0.9, max: 0.9, val: `+${Math.round(heal)}`, heal: true,
        });
        for (let i = 0; i < 8; i++) {
          st.parts.push({
            x: p.x + rand(-8, 8), y: C.GROUND_Y - rand(4, 26), vx: rand(-14, 14), vy: rand(-50, -20),
            life: rand(0.3, 0.6), color: '#7ddb4f', size: 2, grav: 0,
          });
        }
        ZD.audio.play('med');
        ZD.ui.updateHud();
        return false;
      }
      return m.life > 0;
    });

    /* — részecskék, számok — */
    st.parts = st.parts.filter((q) => {
      q.life -= dt;
      if (q.grav) q.vy += C.GRAVITY * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.y > C.GROUND_Y + 10) return false;
      return q.life > 0;
    });
    st.nums = st.nums.filter((n) => {
      n.life -= dt;
      n.x += (n.vx || 0) * dt;
      n.y += n.vy * dt;
      n.vy *= Math.max(0, 1 - dt * 3);
      return n.life > 0;
    });

    /* — ambiens zombi-morgás — */
    st.groanT -= dt;
    if (st.groanT <= 0) {
      st.groanT = rand(2.5, 5.5);
      if (st.zombies.some((z) => !z.dead && Math.abs(z.x - st.cam - C.VIEW_W / 2) < C.VIEW_W)) {
        ZD.audio.play('groan');
      }
    }

    /* — sérült generátor füstöl — */
    if (st.gen && st.gen.hp / st.gen.maxHp < 0.45) {
      st.gen.smokeT -= dt;
      if (st.gen.smokeT <= 0) {
        st.gen.smokeT = 0.12;
        st.parts.push({
          x: st.gen.x + rand(-8, 8), y: C.GROUND_Y - 26, vx: rand(-6, 6), vy: rand(-40, -20),
          life: rand(0.4, 0.9), color: chance(0.5) ? '#3a3632' : '#4a443e', size: rand(2, 3), grav: 0,
        });
      }
    }

    /* — részecske-limitek (mobil-teljesítmény) — */
    if (st.parts.length > 260) st.parts.splice(0, st.parts.length - 260);
    if (st.shells.length > 50) st.shells.splice(0, st.shells.length - 50);
    if (st.nums.length > 40) st.nums.splice(0, st.nums.length - 40);

    /* — kamera (a zoomolt, keskenyebb látómezőhöz igazítva) — */
    const visW = C.VIEW_W / C.ZOOM;
    const target = Math.max(0, Math.min(C.WORLD_W - visW, p.x - visW / 2));
    st.cam += (target - st.cam) * Math.min(1, dt * 6);
    if (st.shake > 0) st.shake -= rdt * 14;

    /* — boss-HP animált követése — */
    if (st.bossRef) {
      const target2 = Math.max(0, st.bossRef.hp / st.bossRef.maxHp);
      st.bossBarHp += (target2 - st.bossBarHp) * Math.min(1, rdt * 5);
    }
  }

  function hurtPlayer(dmg) {
    const p = st.player;
    if (p.invuln > 0 || st.dying > 0) return;
    p.hp -= dmg;
    p.invuln = 0.5;
    p.flash = 0.3;
    st.shake = Math.max(st.shake, 2);
    ZD.audio.play('hurt');
    ZD.ui.updateHud();
    if (p.hp <= 0) {
      p.hp = 0;
      /* halál-szekvencia: eldőlés lassítva, aztán jön a vereség-képernyő */
      st.dying = 1.6;
      st.slowmo = Math.max(st.slowmo, 0.7);
      st.shake = Math.max(st.shake, 5);
      ZD.audio.play('pdie');
    }
  }

  function hurtGen(dmg) {
    const g = st.gen;
    if (!g) return;
    g.hp -= dmg;
    st.shake = Math.max(st.shake, 1.5);
    ZD.audio.play('genhit');
    for (let i = 0; i < 4; i++) {
      st.parts.push({
        x: g.x + rand(-14, 14), y: C.GROUND_Y - rand(4, 24), vx: rand(-50, 50), vy: rand(-80, -20),
        life: rand(0.2, 0.4), color: chance(0.5) ? '#ffd76a' : '#8a8f96', size: 1.5, grav: 1,
      });
    }
    if (g.hp <= 0) {
      g.hp = 0;
      st.booms.push({ x: g.x, y: C.GROUND_Y - 14, t: 0, scale: 1.4 });
      ZD.audio.play('boom');
      st.banner = { text: ZD.i18n.t('game.genDestroyed'), t: 1.4, total: 1.4, sub: null };
      lose();
    }
  }

  function win() {
    st.result = 'win';
    const bonus = Math.round(C.clearBonus(st.level) * C.clearMult(st.mode));
    st.earned += bonus;
    S().coins += bonus;
    if (!S().stages.cleared.includes(st.level)) S().stages.cleared.push(st.level);
    S().stages.unlocked = Math.max(S().stages.unlocked, Math.min(st.level + 1, C.STAGES));
    syncAmmo();
    ZD.save.persist();
    ZD.audio.play('win');
    ZD.ui.showResult(true, st.earned, bonus, st.stats);
  }

  function lose() {
    st.result = 'lose';
    syncAmmo();
    ZD.save.persist(); // a felszedett érme megmarad
    ZD.audio.play('lose');
    ZD.ui.showResult(false, st.earned, 0, st.stats);
  }

  function pause() {
    if (!st.running || st.result) return;
    st.paused = true;
    ZD.ui.showPause();
  }
  function resume() { st.paused = false; ZD.ui.hidePause(); }
  function quit() {
    st.running = false;
    syncAmmo();
    ZD.save.persist();
    ZD.ui.show('title');
  }

  /* ---------- renderelés ---------- */
  function render(ctx) {
    if (!st.running) return;
    const p = st.player;
    const SP = ZD.sprites;
    const Z = C.ZOOM;
    /* a talajvonal a képernyő ~86%-ára kerüljön a zoom után */
    const vy0 = C.GROUND_Y - 232 / Z;
    const shx = st.shake > 0 ? rand(-st.shake, st.shake) : 0;
    const shy = st.shake > 0 ? rand(-st.shake * 0.6, st.shake * 0.6) : 0;

    /* a teljes világ (háttér + entitások) a zoom-transzformon belül rajzolódik */
    ctx.save();
    ctx.translate(shx, shy);
    ctx.scale(Z, Z);
    ctx.translate(0, -vy0);

    SP.drawBackground(ctx, st.cam, st.level, st.time);

    ctx.translate(-Math.round(st.cam), 0);

    /* vérfoltok a talajon */
    st.decals.forEach((d) => {
      ctx.save();
      ctx.globalAlpha = 0.5 * Math.min(1, d.life / (d.max * 0.4));
      ctx.fillStyle = '#4a1414';
      ctx.fillRect(d.x - d.w / 2, C.GROUND_Y + 1, d.w, 3);
      ctx.fillRect(d.x - d.w / 3, C.GROUND_Y + 4, d.w * 0.66, 2);
      ctx.restore();
    });

    /* holttestek (elesés-animáció) hátul */
    st.zombies.forEach((z) => {
      if (!z.dead) return;
      SP.drawZombie(ctx, {
        type: z.type, variant: z.variant, x: z.x, y: C.GROUND_Y,
        facing: z.facing, phase: z.phase, dead: true, deathT: z.deathT, hpRatio: 0,
        anim: z.anim, flash: 0, elite: z.elite,
      });
    });

    /* generátor (defense mód) */
    if (st.gen) SP.drawGenerator(ctx, st.gen, st.time);

    /* medkitek, lőszerládák, érmék */
    st.meds.forEach((m) => SP.drawMed(ctx, m, st.time));
    st.ammoBoxes.forEach((a) => SP.drawAmmoBox(ctx, a, st.time));
    st.coins.forEach((c) => {
      const blink = c.life < 3 && Math.floor(c.life * 6) % 2 === 0;
      if (!blink) SP.drawCoin(ctx, c, st.time);
    });

    /* zombik */
    st.zombies.forEach((z) => {
      if (z.dead) return;
      const atkT = z.def.atkCd - z.atkCd;
      SP.drawZombie(ctx, {
        type: z.type, variant: z.variant, x: z.x, y: C.GROUND_Y,
        facing: z.facing, phase: z.phase,
        attacking: z.atkCd > 0 && atkT < 0.3, atkT,
        flash: z.flash, dead: false, deathT: 0,
        elite: z.elite, enrage: z.enrage,
        hpRatio: z.hp / z.maxHp,
        anim: z.anim, moving: z.moving, attackingAnim: z.attackingAnim,
        warnT: z.warnT, bossState: z.bossState,
      });
    });

    /* DEBUG hitbox-overlay: a tényleges ütköződoboz (def.w × def.h a talptól) */
    if (dbg.hitbox) {
      st.zombies.forEach((z) => {
        if (z.dead) return;
        ctx.save();
        ctx.strokeStyle = z.type === 'boss' ? '#ff3b3b' : z.type === 'bloater' ? '#ff8a2a' : '#38ff9a';
        ctx.lineWidth = 0.6;
        ctx.strokeRect(z.x - z.def.w / 2, C.GROUND_Y - z.def.h, z.def.w, z.def.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(z.x - 0.6, C.GROUND_Y - 0.6, 1.2, 1.2); // talp-anchor
        ctx.restore();
      });
    }

    /* játékos (sérülésnél villog; halálnál eldől) */
    if (st.dying > 0) {
      SP.drawPlayer(ctx, {
        x: p.x, y: C.GROUND_Y, facing: p.facing,
        deathT: 1.6 - st.dying, weapon: curWeapon().def,
      });
    } else if (!(p.invuln > 0 && Math.floor(st.time * 14) % 2 === 0)) {
      SP.drawPlayer(ctx, {
        x: p.x, y: C.GROUND_Y, facing: p.facing,
        moving: ZD.input.state.axis !== 0, phase: p.phase, idleT: p.idleT,
        fireAnim: p.fireAnim, muzzleSeed: p.muzzleSeed, reloadT: p.reloadT,
        flash: p.flash, weapon: curWeapon().def,
      });
    }

    /* torkolattűz-fény (additív, rövid) */
    if (st.muzzle && st.muzzle.t > 0) {
      const m = st.muzzle;
      const a = Math.min(1, m.t / 0.07);
      const r = m.big ? 11 : 6.5;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.85;
      SP.pxCircle(ctx, m.x, m.y, r, '#ffcf6a', 1);
      ctx.globalAlpha = a;
      SP.pxCircle(ctx, m.x, m.y, r * 0.5, '#fff6d8', 1);
      ctx.restore();
    }

    /* lövedékek */
    st.bullets.forEach((b) => {
      if (b.kind === 'flame') {
        const a = Math.max(0, Math.min(1, b.life * 3));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * 0.85;
        SP.pxCircle(ctx, b.x, b.y, 3.5 + (1.2 - b.life) * 2, Math.random() < 0.5 ? '#ff9a3d' : '#ffd27a', 1);
        ctx.globalAlpha = a * 0.5;
        SP.pxCircle(ctx, b.x, b.y, 1.8, '#fff2c8', 1);
        ctx.restore();
      } else if (b.kind === 'laser') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35;
        SP.px(ctx, b.x - 11 * Math.sign(b.vx), b.y - 2, 22, 4, b.color);
        ctx.globalAlpha = 1;
        SP.px(ctx, b.x - 10 * Math.sign(b.vx), b.y - 1, 20, 2, '#d8f6ff');
        ctx.restore();
      } else if (b.kind === 'rocket') {
        SP.px(ctx, b.x - 4, b.y - 2, 8, 4, '#4a4438');
        SP.px(ctx, b.x + Math.sign(b.vx) * 3, b.y - 1, 3, 2, '#8f3a3a');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        SP.px(ctx, b.x - Math.sign(b.vx) * 7, b.y - 1.5, 5, 3, '#ffb84d');
        ctx.restore();
      } else {
        /* golyó: hosszú, fényes tracer + izzó mag */
        const sg = Math.sign(b.vx);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.18;
        SP.px(ctx, b.x - sg * 24, b.y - 1.5, 24, 3, b.color);
        ctx.globalAlpha = 0.42;
        SP.px(ctx, b.x - sg * 15, b.y - 1, 15, 2, b.color);
        ctx.globalAlpha = 0.85;
        SP.px(ctx, b.x - sg * 7, b.y - 0.5, 7, 1.5, '#fff2c8');
        ctx.globalAlpha = 1;
        SP.px(ctx, b.x - 3, b.y - 1.5, 6, 3, '#ffffff');
        ctx.restore();
      }
    });

    /* köpetek */
    st.spits.forEach((s) => {
      SP.pxCircle(ctx, s.x, s.y, 2.5, '#b0ff5b', 1);
      SP.pxCircle(ctx, s.x - Math.sign(s.vx), s.y - 1, 1, '#e0ffa0', 1);
    });

    /* gránátok, hüvelyek */
    st.grenades.forEach((g) => SP.drawGrenade(ctx, g, st.time));
    st.shells.forEach((s) => SP.drawShell(ctx, s));

    /* robbanások */
    st.booms.forEach((b) => {
      if (b.t >= 0) SP.drawBoom(ctx, b.x, b.y, b.t / 0.55, b.scale);
    });

    /* részecskék */
    st.parts.forEach((q) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, q.life * 2.5));
      SP.px(ctx, q.x, q.y, q.size, q.size, q.color);
      ctx.globalAlpha = 1;
    });

    /* sebzésszámok, feliratok */
    ctx.textAlign = 'center';
    st.nums.forEach((n) => {
      const t01 = 1 - n.life / n.max;
      const pop = t01 < 0.18 ? 0.6 + t01 * 3 : 1.15 - t01 * 0.15;
      const size = (n.crit ? 10 : n.warn ? 8 : 7) * pop;
      ctx.font = `bold ${size.toFixed(1)}px "Courier New", monospace`;
      ctx.globalAlpha = Math.max(0, Math.min(1, n.life * 3));
      const str = n.crit && typeof n.val === 'number' ? `${n.val}!` : String(n.val);
      ctx.fillStyle = '#141210';
      ctx.fillText(str, n.x + 0.7, n.y + 0.7);
      ctx.fillStyle = n.heal ? '#8fe86a' : n.warn ? '#ff6a4a' : n.ammo ? '#ffd97a' : n.crit ? '#ffc14d' : '#ffffff';
      ctx.fillText(str, n.x, n.y);
      ctx.globalAlpha = 1;
    });

    /* HD előtér (sodródó eső + előtér-törmelék) — az entitások ELÉ, VIEW-térben
       (a -cam eltolást visszavonjuk, hogy a drawForeground a saját parallaxával rajzoljon) */
    ctx.translate(Math.round(st.cam), 0);
    SP.drawForeground(ctx, st.cam, st.level, st.time);

    ctx.restore();

    /* ---- képernyő-terű rétegek ---- */

    /* SÖTÉTSÉG módosító: látókör a játékos körül (képernyő-koordinátákban) */
    if (st.mod === 'dark') {
      const px_ = (p.x - st.cam) * Z, py_ = (C.GROUND_Y - 18 - vy0) * Z;
      const dg = ctx.createRadialGradient(px_, py_, 55 * Z, px_, py_, 190 * Z);
      dg.addColorStop(0, 'rgba(2,4,8,0)');
      dg.addColorStop(0.6, 'rgba(2,4,8,.55)');
      dg.addColorStop(1, 'rgba(2,4,8,.9)');
      ctx.fillStyle = dg;
      ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
    }

    /* sérülés-vignetta + alacsony HP pulzus */
    const lowHp = p.hp / p.stats.maxHp < 0.3;
    if (p.flash > 0 || lowHp) {
      const a = Math.max(
        p.flash > 0 ? Math.min(0.55, p.flash * 1.8) : 0,
        lowHp ? 0.16 + 0.1 * Math.sin(st.time * 6) : 0
      );
      const vg = ctx.createRadialGradient(C.VIEW_W / 2, C.VIEW_H / 2, C.VIEW_H * 0.32, C.VIEW_W / 2, C.VIEW_H / 2, C.VIEW_W * 0.62);
      vg.addColorStop(0, 'rgba(160,20,20,0)');
      vg.addColorStop(1, `rgba(160,20,20,${a})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
    }

    /* nincs-elég-pénz hibavillanás: piros keret */
    if (st.errFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.6, st.errFlash * 1.6);
      ctx.strokeStyle = '#e5484d';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, C.VIEW_W - 6, C.VIEW_H - 6);
      ctx.restore();
    }

    /* boss HP-sáv (prémium: keret + gloss + vörös glow + lag-csík) */
    if (st.bossRef && !st.bossRef.dead) {
      const bw = 196, bx = C.VIEW_W / 2 - bw / 2, by = 10;
      const hpr = Math.max(0, st.bossRef.hp / st.bossRef.maxHp);
      ctx.save();
      /* külső fémes keret + vörös glow */
      ctx.shadowColor = 'rgba(255,50,40,.5)'; ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(10,4,4,.9)';
      ctx.fillRect(bx - 5, by - 4, bw + 10, 14);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,120,90,.55)'; ctx.lineWidth = 1;
      ctx.strokeRect(bx - 4.5, by - 3.5, bw + 9, 13);
      /* üres sáv */
      ctx.fillStyle = '#2a0e0e';
      ctx.fillRect(bx, by, bw, 6);
      /* fehér "lag" csík mutatja a friss sebzést */
      ctx.fillStyle = '#f0d8c8';
      ctx.fillRect(bx, by, bw * Math.max(0, st.bossBarHp), 6);
      /* aktuális HP gradiens */
      const grd = ctx.createLinearGradient(0, by, 0, by + 6);
      grd.addColorStop(0, '#ff8a5a'); grd.addColorStop(0.5, '#ff4a2a'); grd.addColorStop(1, '#b81e12');
      ctx.fillStyle = grd;
      ctx.fillRect(bx, by, bw * hpr, 6);
      /* felső gloss */
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.fillRect(bx, by, bw * hpr, 2);
      ctx.restore();
      const lbl = ZD.i18n.t('game.bossLabel');
      ctx.font = 'bold 7px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#180a08';
      ctx.fillText(lbl, C.VIEW_W / 2 + 0.6, by + 15.6);
      ctx.fillStyle = '#ffd8d0';
      ctx.fillText(lbl, C.VIEW_W / 2, by + 15);
    }

    /* cinematikus banner (pályakezdés, boss) */
    if (st.banner) {
      const b = st.banner;
      const prog = 1 - b.t / b.total;
      const inA = Math.min(1, prog * 5);
      const outA = Math.min(1, (1 - prog) * 5);
      const a = Math.min(inA, outA);
      ctx.save();
      ctx.globalAlpha = a * 0.65;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, C.VIEW_H / 2 - 26, C.VIEW_W, 52);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#0d130d';
      ctx.fillRect(0, C.VIEW_H / 2 - 27, C.VIEW_W, 2);
      ctx.fillRect(0, C.VIEW_H / 2 + 25, C.VIEW_W, 2);
      ctx.font = 'bold 17px "Courier New", monospace';
      ctx.textAlign = 'center';
      const ty = C.VIEW_H / 2 + (b.sub ? 0 : 6);
      ctx.fillStyle = '#0a0f0a';
      ctx.fillText(b.text, C.VIEW_W / 2 + 1, ty + 1);
      ctx.fillStyle = b.text.includes('VEZÉR') ? '#ff6a4a' : '#a5e87e';
      ctx.fillText(b.text, C.VIEW_W / 2, ty);
      if (b.sub) {
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.fillStyle = '#ffc14d';
        ctx.fillText(b.sub, C.VIEW_W / 2, ty + 15);
      }
      ctx.restore();
    }
  }

  /* ---------- DEBUG: gyors ellenség-spawn + hitbox overlay (teszteléshez) ---------- */
  const dbg = { hitbox: false };
  function debugSpawn(type) {
    if (!st.running) { console.warn('[debug] indíts előbb egy pályát (spawn csak játékban)'); return; }
    if (!C.ZOMBIES[type]) { console.warn('[debug] ismeretlen típus:', type); return; }
    spawnZombie(type);
    const z = st.zombies[st.zombies.length - 1];
    z.x = Math.min(C.WORLD_W - 30, st.cam + C.VIEW_W - 34);  // a kamera jobb szélére → gyorsan belép
    z.facing = -1;
    console.log('[debug] spawn', type, '@x', Math.round(z.x));
    return z;
  }
  function debugToggleHitbox() { dbg.hitbox = !dbg.hitbox; console.log('[debug] hitbox overlay:', dbg.hitbox); return dbg.hitbox; }

  return { st, start, update, render, pause, resume, quit, calcStats, curWeapon, debugSpawn, debugToggleHitbox, dbg };
})();
