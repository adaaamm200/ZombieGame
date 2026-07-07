/* Játékmotor: aréna, hullámok, lövedékek, ütközések, zsákmány */
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
    cam: 0,
    shake: 0,
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
      zombies: [], bullets: [], spits: [], grenades: [], coins: [], meds: [], parts: [], nums: [],
      cam: 0, shake: 0,
    });

    st.player = {
      x: C.WORLD_W / 2, hp: stats.maxHp, stats,
      facing: 1, phase: 0, fireCd: 0, fireAnim: 0,
      invuln: 0, flash: 0,
      weapons: owned.map((w) => ({ def: w, ammo: w.ammo })),
      wi,
      grenades: stats.grenades,
    };
    ZD.ui.enterGame();
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
    p.fireAnim = 0.06;
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
    const sfx = { pistol: 'shot', uzi: 'uzi', shotgun: 'shotgun', rifle: 'shot', flamer: 'flame', minigun: 'minigun', rocket: 'rocket', laser: 'laser' };
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

  function explode(x, y, dmg, radius) {
    ZD.audio.play('boom');
    st.shake = Math.max(st.shake, 5);
    for (let i = 0; i < 22; i++) {
      st.parts.push({
        x, y: y - 4, vx: rand(-130, 130), vy: rand(-190, -20),
        life: rand(0.3, 0.7), color: chance(0.5) ? '#ffb84d' : '#ff7433', size: rand(2, 4), grav: 1,
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

  /* ---------- sebzés a zombinak ---------- */
  function hurtZombie(z, dmg, crit) {
    z.hp -= dmg;
    z.flash = 0.12;
    st.nums.push({ x: z.x + rand(-4, 4), y: C.GROUND_Y - z.def.h - 8, vy: -34, life: 0.7, val: Math.round(dmg), crit });
    for (let i = 0; i < 3; i++) {
      st.parts.push({
        x: z.x, y: C.GROUND_Y - z.def.h * 0.6, vx: rand(-50, 50), vy: rand(-80, -10),
        life: rand(0.2, 0.5), color: '#8f2f2f', size: 2, grav: 1,
      });
    }
    ZD.audio.play('hit');
    if (z.hp <= 0 && !z.dead) killZombie(z);
  }

  function killZombie(z) {
    z.dead = true;
    ZD.audio.play('zdie');
    if (z.type === 'boss') st.bossRef = null;
    else st.killed++;

    // vér-részecskék
    for (let i = 0; i < 10; i++) {
      st.parts.push({
        x: z.x, y: C.GROUND_Y - z.def.h * 0.5, vx: rand(-90, 90), vy: rand(-140, -20),
        life: rand(0.3, 0.8), color: chance(0.6) ? '#8f2f2f' : '#5f1f1f', size: rand(2, 3), grav: 1,
      });
    }
    // érmék
    const val = Math.round(z.def.coin * C.coinMul(st.level) * st.player.stats.coinMul);
    const n = Math.min(5, 1 + Math.floor(val / 12));
    for (let i = 0; i < n; i++) {
      st.coins.push({
        x: z.x, y: C.GROUND_Y - 14, vx: rand(-70, 70), vy: rand(-170, -70),
        val: Math.max(1, Math.round(val / n)), life: 12, settled: false,
      });
    }
    // medkit esély
    if (chance(0.045)) {
      st.meds.push({ x: z.x, y: C.GROUND_Y - 12, vy: -110, life: 12 });
    }
  }

  /* ---------- frissítés ---------- */
  function update(dt) {
    if (!st.running || st.paused || st.result) return;
    const p = st.player;
    const inp = ZD.input.state;
    st.time += dt;

    /* — bemenet, él-triggerek — */
    if (inp.grenade) { inp.grenade = false; throwGrenade(); }
    if (inp.swap) {
      inp.swap = false;
      p.wi = (p.wi + 1) % p.weapons.length;
      ZD.audio.play('click');
      ZD.ui.updateHud();
    }
    if (inp.pause) { inp.pause = false; pause(); return; }

    /* — játékos mozgás — */
    if (inp.axis !== 0) {
      p.facing = inp.axis > 0 ? 1 : -1;
      p.x += inp.axis * p.stats.speed * dt;
      p.x = Math.max(10, Math.min(C.WORLD_W - 10, p.x));
      p.phase += dt * 11;
    } else {
      p.phase = 0;
    }
    if (p.fireCd > 0) p.fireCd -= dt;
    if (p.fireAnim > 0) p.fireAnim -= dt;
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
      st.shake = 6;
      ZD.audio.play('slam');
    } else if (st.killed >= st.quota && st.zombies.every((z) => z.dead) && !st.result) {
      win();
    }

    /* — zombik — */
    st.zombies.forEach((z) => {
      if (z.dead) return;
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
          st.spits.push({
            x: z.x, y: C.GROUND_Y - z.def.h + 6,
            vx: dx / t, vy: -0.5 * C.GRAVITY * t + (0) , // ballisztikus ív a játékosra
            dmg: z.dmg,
          });
          // helyes ív: vy úgy, hogy t idő alatt földet érjen
          const s = st.spits[st.spits.length - 1];
          s.vy = ((C.GROUND_Y - s.y) - 0.5 * C.GRAVITY * t * t) / t * -1 * -1; // lásd lent
          s.vy = ((C.GROUND_Y - s.y) - 0.5 * C.GRAVITY * t * t) / t;
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

    /* — lövedékek — */
    st.bullets = st.bullets.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -30 || b.x > C.WORLD_W + 30) {
        if (b.kind === 'rocket') explode(b.x, C.GROUND_Y - 10, b.dmg, b.splash);
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
      if (Math.abs(s.x - p.x) < 10 && s.y > C.GROUND_Y - C.PLAYER.h && s.y < C.GROUND_Y) {
        hurtPlayer(s.dmg);
        return false;
      }
      if (s.y >= C.GROUND_Y) {
        for (let i = 0; i < 4; i++) {
          st.parts.push({ x: s.x, y: C.GROUND_Y, vx: rand(-30, 30), vy: rand(-60, -20), life: 0.3, color: '#b0ff5b', size: 2, grav: 1 });
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
        p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.25);
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
      n.y += n.vy * dt;
      return n.life > 0;
    });

    /* — kamera — */
    const target = Math.max(0, Math.min(C.WORLD_W - C.VIEW_W, p.x - C.VIEW_W / 2));
    st.cam += (target - st.cam) * Math.min(1, dt * 6);
    if (st.shake > 0) st.shake -= dt * 14;
  }

  function hurtPlayer(dmg) {
    const p = st.player;
    if (p.invuln > 0) return;
    p.hp -= dmg;
    p.invuln = 0.5;
    p.flash = 0.25;
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
    const shx = st.shake > 0 ? rand(-st.shake, st.shake) : 0;
    const shy = st.shake > 0 ? rand(-st.shake * 0.6, st.shake * 0.6) : 0;

    ZD.sprites.drawBackground(ctx, st.cam, st.level);

    ctx.save();
    ctx.translate(-Math.round(st.cam) + shx, shy);

    // medkitek
    st.meds.forEach((m) => {
      ZD.sprites.px(ctx, m.x - 5, m.y - 8, 10, 8, '#e8e8e8');
      ZD.sprites.px(ctx, m.x - 1, m.y - 7, 2, 6, '#d43d3d');
      ZD.sprites.px(ctx, m.x - 3, m.y - 5, 6, 2, '#d43d3d');
    });

    // érmék
    st.coins.forEach((c) => {
      const blink = c.life < 3 && Math.floor(c.life * 6) % 2 === 0;
      if (!blink) {
        ZD.sprites.px(ctx, c.x - 3, c.y - 6, 6, 6, '#ffc14d');
        ZD.sprites.px(ctx, c.x - 1, c.y - 5, 2, 4, '#a87820');
      }
    });

    // zombik
    st.zombies.forEach((z) => {
      if (z.dead) return;
      ZD.sprites.drawZombie(ctx, z.type, z.x, C.GROUND_Y, z.facing, z.phase, z.atkCd > z.def.atkCd - 0.25, z.flash, z.hp / z.maxHp);
    });

    // játékos (sérülésnél villog)
    if (!(p.invuln > 0 && Math.floor(st.time * 14) % 2 === 0)) {
      ZD.sprites.drawPlayer(ctx, p.x, C.GROUND_Y, p.facing, p.phase, p.fireAnim > 0, curWeapon().def, p.flash);
    }

    // lövedékek
    st.bullets.forEach((b) => {
      if (b.kind === 'flame') {
        const a = Math.max(0, b.life * 3);
        ctx.globalAlpha = Math.min(1, a);
        ZD.sprites.px(ctx, b.x - 3, b.y - 3, 6, 6, Math.random() < 0.5 ? '#ff9a3d' : '#ffd27a');
        ctx.globalAlpha = 1;
      } else if (b.kind === 'laser') {
        ZD.sprites.px(ctx, b.x - 9 * Math.sign(b.vx), b.y - 1, 18, 2, b.color);
      } else if (b.kind === 'rocket') {
        ZD.sprites.px(ctx, b.x - 4, b.y - 2, 8, 4, '#4a4438');
        ZD.sprites.px(ctx, b.x - Math.sign(b.vx) * 7, b.y - 1, 4, 2, '#ffb84d');
      } else {
        ZD.sprites.px(ctx, b.x - 2, b.y - 1, 4, 2, b.color);
      }
    });

    // köpetek
    st.spits.forEach((s) => ZD.sprites.px(ctx, s.x - 2, s.y - 2, 4, 4, '#b0ff5b'));

    // gránátok
    st.grenades.forEach((g) => ZD.sprites.px(ctx, g.x - 2, g.y - 2, 5, 5, '#3d4a33'));

    // részecskék
    st.parts.forEach((q) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, q.life * 2.5));
      ZD.sprites.px(ctx, q.x, q.y, q.size, q.size, q.color);
      ctx.globalAlpha = 1;
    });

    // sebzésszámok
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.textAlign = 'center';
    st.nums.forEach((n) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, n.life * 2));
      ctx.fillStyle = n.crit ? '#ffc14d' : '#ffffff';
      ctx.fillText(String(n.val), n.x, n.y);
      ctx.globalAlpha = 1;
    });

    ctx.restore();

    // boss HP-sáv a képernyő tetején
    if (st.bossRef && !st.bossRef.dead) {
      const b = st.bossRef;
      ctx.fillStyle = '#200c0c';
      ctx.fillRect(C.VIEW_W / 2 - 80, 8, 160, 7);
      ctx.fillStyle = '#ff5b3d';
      ctx.fillRect(C.VIEW_W / 2 - 80, 8, 160 * Math.max(0, b.hp / b.maxHp), 7);
      ctx.font = 'bold 7px "Courier New", monospace';
      ctx.fillStyle = '#ffdddd';
      ctx.textAlign = 'center';
      ctx.fillText('VEZÉR', C.VIEW_W / 2, 23);
    }
  }

  return { st, start, update, render, pause, resume, quit, calcStats, curWeapon };
})();
