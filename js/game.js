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
    parts: [],   // részecskék
    nums: [],    // lebegő sebzésszámok
    shells: [],  // töltényhüvelyek
    booms: [],   // robbanás-animációk
    decals: [],  // vérfoltok a talajon
    cam: 0,
    shake: 0,
    slowmo: 0,     // lassítás hátralévő ideje (boss-halál)
    banner: null,  // {text, t, total} — cinematikus felirat
    bossBarHp: 0,  // animált boss-HP kijelzés
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
  function start(level) {
    const stats = calcStats();
    const owned = ownedWeapons();
    let wi = owned.findIndex((w) => w.id === S().weapons.equipped);
    if (wi < 0) wi = 0;

    Object.assign(st, {
      running: true, paused: false, level,
      quota: C.quota(level), killed: 0,
      bossPhase: false, bossRef: null,
      spawnTimer: 0.8, time: 0, earned: 0, result: null,
      zombies: [], bullets: [], spits: [], grenades: [], coins: [], meds: [],
      parts: [], nums: [], shells: [], booms: [], decals: [],
      cam: 0, shake: 0, slowmo: 0, banner: null, bossBarHp: 0,
    });

    st.player = {
      x: C.WORLD_W / 2, hp: stats.maxHp, stats,
      facing: 1, phase: 0, idleT: 0, fireCd: 0, fireAnim: 0, muzzleSeed: 0,
      reloadT: 0,
      invuln: 0, flash: 0,
      weapons: owned.map((w) => ({ def: w, ammo: w.ammo })),
      wi,
      grenades: stats.grenades,
    };
    st.banner = { text: `${level}. PÁLYA`, t: 1.6, total: 1.6, sub: bossLevelText(level) };
    ZD.ui.enterGame();
  }

  function bossLevelText(level) {
    return C.isBossLevel(level) ? '⚠ VEZÉR-PÁLYA' : null;
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

  function spawnZombie(type) {
    const def = C.ZOMBIES[type];
    const side = chance(0.5) ? -1 : 1;
    const x = side < 0 ? -20 : C.WORLD_W + 20;
    st.zombies.push({
      type, def,
      variant: chance(0.5) ? 0 : 1,
      x,
      hp: def.hp * C.hpMul(st.level) * (type === 'boss' ? 1 + st.level * 0.04 : 1),
      maxHp: def.hp * C.hpMul(st.level) * (type === 'boss' ? 1 + st.level * 0.04 : 1),
      dmg: def.dmg * C.dmgMul(st.level),
      speed: rand(def.speed[0], def.speed[1]),
      facing: -side,
      phase: rand(0, 6.28),
      atkCd: 0,
      flash: 0,
      kb: 0,
      dead: false,
      deathT: 0,
      slamCd: 4,
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
    if (w.ammo > 0) w.ammo--;

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
        color: def.color,
        pierce: def.pierce || 0,
        splash: def.splash || 0,
        life: def.kind === 'flame' ? (def.range / def.spd) : 1.2,
        hitSet: null,
      });
    }

    /* visszarúgás-effektek */
    if (def.shake) st.shake = Math.max(st.shake, def.shake);
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
    ZD.audio.play('click');
    ZD.ui.updateHud();
  }

  function explode(x, y, dmg, radius, big) {
    ZD.audio.play('boom');
    st.shake = Math.max(st.shake, big ? 9 : 6);
    st.booms.push({ x, y: Math.min(y, C.GROUND_Y - 4), t: 0, scale: big ? 1.6 : 1 });
    for (let i = 0; i < (big ? 34 : 22); i++) {
      st.parts.push({
        x, y: y - 4, vx: rand(-150, 150), vy: rand(-210, -20),
        life: rand(0.3, 0.8), color: chance(0.4) ? '#ffb84d' : chance(0.5) ? '#ff7433' : '#5a5148', size: rand(1.5, 4), grav: 1,
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

  /* ---------- sebzés a zombinak ---------- */
  function hurtZombie(z, dmg, crit) {
    z.hp -= dmg;
    z.flash = 0.12;
    st.nums.push({
      x: z.x + rand(-4, 4), y: C.GROUND_Y - z.def.h - 8,
      vx: rand(-8, 8), vy: -38, life: crit ? 0.85 : 0.65, max: crit ? 0.85 : 0.65,
      val: Math.round(dmg), crit,
    });
    for (let i = 0; i < (crit ? 6 : 4); i++) {
      st.parts.push({
        x: z.x, y: C.GROUND_Y - z.def.h * 0.6, vx: rand(-60, 60), vy: rand(-90, -10),
        life: rand(0.2, 0.5), color: chance(0.6) ? '#8f2f2f' : '#6e2020', size: rand(1.5, 2.5), grav: 1,
      });
    }
    ZD.audio.play('hit');
    if (z.hp <= 0 && !z.dead) killZombie(z);
  }

  function killZombie(z) {
    z.dead = true;
    z.deathT = 0;
    ZD.audio.play('zdie');
    addDecal(z.x, z.type === 'brute' || z.type === 'boss');

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
    }

    // vér-részecskék
    for (let i = 0; i < 12; i++) {
      st.parts.push({
        x: z.x, y: C.GROUND_Y - z.def.h * 0.5, vx: rand(-90, 90), vy: rand(-150, -20),
        life: rand(0.3, 0.8), color: chance(0.6) ? '#8f2f2f' : '#5f1f1f', size: rand(1.5, 3), grav: 1,
      });
    }
    // érmék
    const val = Math.round(z.def.coin * C.coinMul(st.level) * st.player.stats.coinMul);
    const n = Math.min(5, 1 + Math.floor(val / 12));
    for (let i = 0; i < n; i++) {
      st.coins.push({
        x: z.x, y: C.GROUND_Y - 14, vx: rand(-70, 70), vy: rand(-170, -70),
        val: Math.max(1, Math.round(val / n)), life: 12, settled: false, spin: (Math.random() * 6) | 0,
      });
    }
    // medkit esély
    if (chance(0.045)) {
      st.meds.push({ x: z.x, y: C.GROUND_Y - 12, vy: -110, life: 12 });
    }
  }

  /* ---------- frissítés ---------- */
  function update(rdt) {
    if (!st.running || st.paused || st.result) return;
    const p = st.player;
    const inp = ZD.input.state;

    /* lassítás (boss-halál) — a világ lassul, a banner nem */
    let dt = rdt;
    if (st.slowmo > 0) {
      st.slowmo -= rdt;
      dt = rdt * 0.32;
    }
    st.time += dt;
    if (st.banner) {
      st.banner.t -= rdt;
      if (st.banner.t <= 0) st.banner = null;
    }

    /* — bemenet, él-triggerek — */
    if (inp.grenade) { inp.grenade = false; throwGrenade(); }
    if (inp.swap) {
      inp.swap = false;
      p.wi = (p.wi + 1) % p.weapons.length;
      p.reloadT = 0.5;
      ZD.audio.play('reload');
      ZD.ui.updateHud();
    }
    if (inp.pause) { inp.pause = false; pause(); return; }

    /* — játékos mozgás — */
    if (inp.axis !== 0) {
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
    if (p.invuln > 0) p.invuln -= dt;
    if (p.flash > 0) p.flash -= dt;
    if (inp.fire && p.fireCd <= 0) shoot();

    // regeneráció
    if (p.stats.regen > 0 && p.hp < p.stats.maxHp) {
      p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.regen * dt);
    }

    /* — spawn — */
    const spawnedLeft = st.quota - st.killed - st.zombies.filter((z) => !z.dead && z.type !== 'boss').length;
    if (st.killed < st.quota && spawnedLeft > 0) {
      st.spawnTimer -= dt;
      if (st.spawnTimer <= 0 && st.zombies.filter((z) => !z.dead).length < C.cap(st.level)) {
        st.spawnTimer = C.spawnInterval(st.level) * rand(0.7, 1.3);
        spawnZombie(pickType());
      }
    } else if (st.killed >= st.quota && !st.bossPhase && C.isBossLevel(st.level)) {
      st.bossPhase = true;
      spawnZombie('boss');
      st.bossRef = st.zombies[st.zombies.length - 1];
      st.bossBarHp = 1;
      st.shake = 7;
      st.banner = { text: '⚠ A VEZÉR MEGÉRKEZETT', t: 2.2, total: 2.2, sub: null };
      ZD.audio.play('roar');
    } else if (st.killed >= st.quota && st.zombies.every((z) => z.dead) && !st.result) {
      win();
    }

    /* — zombik — */
    st.zombies.forEach((z) => {
      if (z.dead) { z.deathT += dt; return; }
      z.phase += dt * (4 + z.speed * 0.06);
      if (z.flash > 0) z.flash -= dt;
      if (z.atkCd > 0) z.atkCd -= dt;

      // visszalökés
      if (z.kb !== 0) {
        z.x += z.kb * dt * 3;
        z.kb *= Math.max(0, 1 - dt * 8);
        if (Math.abs(z.kb) < 2) z.kb = 0;
      }

      const dx = p.x - z.x;
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
        }
      } else if (dist > z.def.reach) {
        z.x += Math.sign(dx) * z.speed * dt;
      } else if (z.atkCd <= 0) {
        // közelharci támadás
        z.atkCd = z.def.atkCd;
        hurtPlayer(z.dmg);
        if (z.type === 'boss' || z.type === 'brute') st.shake = Math.max(st.shake, 3);
      }

      // boss földcsapás
      if (z.type === 'boss') {
        z.slamCd -= dt;
        if (z.slamCd <= 0) {
          z.slamCd = 6;
          ZD.audio.play('slam');
          st.shake = Math.max(st.shake, 7);
          if (Math.abs(p.x - z.x) < 130) hurtPlayer(z.dmg * 0.8);
          for (let i = 0; i < 14; i++) {
            st.parts.push({
              x: z.x + rand(-100, 100), y: C.GROUND_Y, vx: rand(-20, 20), vy: rand(-160, -60),
              life: rand(0.3, 0.6), color: '#4a4436', size: rand(2, 4), grav: 1,
            });
          }
        }
      }
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
          hurtZombie(z, b.dmg, b.crit);
          z.kb += Math.sign(b.vx) * (b.kind === 'flame' ? 4 : 14);
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

    /* — kamera — */
    const target = Math.max(0, Math.min(C.WORLD_W - C.VIEW_W, p.x - C.VIEW_W / 2));
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
    if (p.invuln > 0) return;
    p.hp -= dmg;
    p.invuln = 0.5;
    p.flash = 0.3;
    st.shake = Math.max(st.shake, 2);
    ZD.audio.play('hurt');
    ZD.ui.updateHud();
    if (p.hp <= 0) {
      p.hp = 0;
      lose();
    }
  }

  function win() {
    st.result = 'win';
    const bonus = C.clearBonus(st.level);
    st.earned += bonus;
    S().coins += bonus;
    if (!S().stages.cleared.includes(st.level)) S().stages.cleared.push(st.level);
    S().stages.unlocked = Math.max(S().stages.unlocked, Math.min(st.level + 1, C.STAGES));
    ZD.save.persist();
    ZD.audio.play('win');
    ZD.ui.showResult(true, st.earned, bonus);
  }

  function lose() {
    st.result = 'lose';
    ZD.save.persist(); // a felszedett érme megmarad
    ZD.audio.play('lose');
    ZD.ui.showResult(false, st.earned, 0);
  }

  function pause() {
    if (!st.running || st.result) return;
    st.paused = true;
    ZD.ui.showPause();
  }
  function resume() { st.paused = false; ZD.ui.hidePause(); }
  function quit() {
    st.running = false;
    ZD.save.persist();
    ZD.ui.show('title');
  }

  /* ---------- renderelés ---------- */
  function render(ctx) {
    if (!st.running) return;
    const p = st.player;
    const SP = ZD.sprites;
    const shx = st.shake > 0 ? rand(-st.shake, st.shake) : 0;
    const shy = st.shake > 0 ? rand(-st.shake * 0.6, st.shake * 0.6) : 0;

    SP.drawBackground(ctx, st.cam, st.level, st.time);

    ctx.save();
    ctx.translate(-Math.round(st.cam) + shx, shy);

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
      });
    });

    /* medkitek, érmék */
    st.meds.forEach((m) => SP.drawMed(ctx, m, st.time));
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
        hpRatio: z.hp / z.maxHp,
      });
    });

    /* játékos (sérülésnél villog) */
    if (!(p.invuln > 0 && Math.floor(st.time * 14) % 2 === 0)) {
      SP.drawPlayer(ctx, {
        x: p.x, y: C.GROUND_Y, facing: p.facing,
        moving: ZD.input.state.axis !== 0, phase: p.phase, idleT: p.idleT,
        fireAnim: p.fireAnim, muzzleSeed: p.muzzleSeed, reloadT: p.reloadT,
        flash: p.flash, weapon: curWeapon().def,
      });
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
        /* golyó: fényes tracer */
        ctx.save();
        ctx.globalAlpha = 0.4;
        SP.px(ctx, b.x - Math.sign(b.vx) * 7, b.y - 0.5, 8, 1, b.color);
        ctx.globalAlpha = 1;
        SP.px(ctx, b.x - 2, b.y - 1, 4, 2, '#fff6d8');
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

    /* sebzésszámok */
    ctx.textAlign = 'center';
    st.nums.forEach((n) => {
      const t01 = 1 - n.life / n.max;
      const pop = t01 < 0.18 ? 0.6 + t01 * 3 : 1.15 - t01 * 0.15;
      const size = (n.crit ? 10 : 7) * pop;
      ctx.font = `bold ${size.toFixed(1)}px "Courier New", monospace`;
      ctx.globalAlpha = Math.max(0, Math.min(1, n.life * 3));
      const str = n.crit ? `${n.val}!` : String(n.val);
      ctx.fillStyle = '#141210';
      ctx.fillText(str, n.x + 0.7, n.y + 0.7);
      ctx.fillStyle = n.heal ? '#8fe86a' : n.crit ? '#ffc14d' : '#ffffff';
      ctx.fillText(str, n.x, n.y);
      ctx.globalAlpha = 1;
    });

    ctx.restore();

    /* ---- képernyő-terű rétegek ---- */

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

    /* boss HP-sáv */
    if (st.bossRef && !st.bossRef.dead) {
      const bw = 190, bx = C.VIEW_W / 2 - bw / 2, by = 9;
      ctx.fillStyle = 'rgba(8,4,4,.82)';
      ctx.fillRect(bx - 4, by - 4, bw + 8, 15);
      ctx.fillStyle = '#3a1212';
      ctx.fillRect(bx, by, bw, 7);
      /* fehér "lag" csík mutatja a friss sebzést */
      ctx.fillStyle = '#e8d8c8';
      ctx.fillRect(bx, by, bw * Math.max(0, st.bossBarHp), 7);
      const hpr = Math.max(0, st.bossRef.hp / st.bossRef.maxHp);
      const grd = ctx.createLinearGradient(0, by, 0, by + 7);
      grd.addColorStop(0, '#ff6a4a');
      grd.addColorStop(1, '#c22e18');
      ctx.fillStyle = grd;
      ctx.fillRect(bx, by, bw * hpr, 7);
      ctx.font = 'bold 7px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#141210';
      ctx.fillText('☠ VEZÉR', C.VIEW_W / 2 + 0.6, by + 15.6);
      ctx.fillStyle = '#ffd8d0';
      ctx.fillText('☠ VEZÉR', C.VIEW_W / 2, by + 15);
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

  return { st, start, update, render, pause, resume, quit, calcStats, curWeapon };
})();
