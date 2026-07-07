/* Procedurális retro sprite-rajzolás — minden grafika saját, kódból születik */
window.ZD = window.ZD || {};

ZD.sprites = (() => {
  function px(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /* ---------- JÁTÉKOS: katona ---------- */
  function drawPlayer(ctx, x, y, facing, phase, firing, weapon, flash) {
    // x = középpont, y = talaj (láb alja)
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (facing < 0) ctx.scale(-1, 1);

    const legA = Math.sin(phase) * 3.5;
    // lábak
    px(ctx, -5 + legA, -9, 4, 9, '#3d4a33');
    px(ctx, 1 - legA, -9, 4, 9, '#333d2a');
    // bakancs
    px(ctx, -5 + legA, -2, 5, 2, '#1c1c1c');
    px(ctx, 1 - legA, -2, 5, 2, '#1c1c1c');
    // törzs (mellény)
    px(ctx, -6, -20, 12, 11, '#55684a');
    px(ctx, -6, -18, 12, 3, '#6d5a3a'); // öv/táska
    // hátsó kar
    px(ctx, -7, -19, 3, 7, '#4a5a40');
    // fej
    px(ctx, -4, -28, 8, 8, '#d9a878');
    // sisak
    px(ctx, -5, -30, 10, 5, '#44523c');
    px(ctx, -5, -26, 3, 2, '#44523c');
    // szem
    px(ctx, 2, -25, 2, 2, '#20241c');
    // fegyver (előre)
    const gunY = -17;
    const wcol = weapon.kind === 'laser' ? '#4c6a7a' : '#2a2a2a';
    px(ctx, 2, gunY, 11, 3, wcol);
    px(ctx, 4, gunY + 3, 3, 4, '#3a3a3a'); // markolat
    if (weapon.id === 'shotgun' || weapon.id === 'rifle') px(ctx, 9, gunY - 1, 4, 2, '#5c4630');
    if (weapon.id === 'minigun') { px(ctx, 2, gunY - 2, 11, 2, '#2a2a2a'); px(ctx, 2, gunY + 3, 11, 2, '#2a2a2a'); }
    if (weapon.id === 'rocket') px(ctx, 1, gunY - 2, 13, 6, '#4a4438');
    if (weapon.id === 'flamer') { px(ctx, 1, gunY - 1, 9, 5, '#7a3d20'); px(ctx, 10, gunY, 4, 3, '#3a3a3a'); }
    // elülső kar a fegyveren
    px(ctx, 3, -18, 4, 5, '#55684a');
    // torkolattűz
    if (firing) {
      px(ctx, 13, gunY - 1, 4, 5, '#fff2b0');
      px(ctx, 17, gunY, 2, 3, '#ffb84d');
    }
    if (flash > 0) {
      ctx.globalAlpha = Math.min(flash * 3, 0.7);
      px(ctx, -7, -30, 14, 30, '#ff6060');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /* ---------- ZOMBIK ---------- */
  const PAL = {
    walker:  { skin: '#7ba05b', cloth: '#5a5a66', dark: '#4a6b38', eye: '#d43d3d' },
    runner:  { skin: '#9db06b', cloth: '#6b4a4a', dark: '#6f8248', eye: '#ffd23d' },
    crawler: { skin: '#6f9455', cloth: '#4a4a52', dark: '#4a6b38', eye: '#d43d3d' },
    spitter: { skin: '#8a7bb0', cloth: '#4a5266', dark: '#665a8a', eye: '#b0ff5b' },
    brute:   { skin: '#5b8a52', cloth: '#3d3d46', dark: '#3f6b38', eye: '#ff5b3d' },
    boss:    { skin: '#4a6b45', cloth: '#2e2e36', dark: '#33502e', eye: '#ff3d3d' },
  };

  function zombieBase(ctx, p, wdt, hgt, phase, attacking) {
    const legA = Math.sin(phase) * (wdt * 0.22);
    const armLift = attacking ? -4 : Math.sin(phase * 0.7) * 1.5;
    const hw = wdt / 2;
    // lábak
    px(ctx, -hw + 1 + legA, -hgt * 0.3, wdt * 0.26, hgt * 0.3, p.cloth);
    px(ctx, 1 - legA, -hgt * 0.3, wdt * 0.26, hgt * 0.3, p.cloth);
    // törzs
    px(ctx, -hw + 1, -hgt * 0.66, wdt - 2, hgt * 0.38, p.cloth);
    px(ctx, -hw + 1, -hgt * 0.66, wdt - 2, 2, p.skin); // szakadt gallér
    // előrenyúló karok (zombi póz)
    px(ctx, hw - 2, -hgt * 0.6 + armLift, hw + 2, 3, p.skin);
    px(ctx, hw - 3, -hgt * 0.55 + armLift * 0.6, hw, 3, p.dark);
    // fej
    const headS = Math.max(6, wdt * 0.5);
    px(ctx, -headS / 2, -hgt, headS, headS, p.skin);
    px(ctx, -headS / 2, -hgt, headS, 2, p.dark); // haj/seb
    // szem
    px(ctx, headS * 0.1, -hgt + headS * 0.35, 2, 2, p.eye);
    // száj
    px(ctx, headS * 0.05, -hgt + headS * 0.7, headS * 0.35, 1.5, '#2a1414');
  }

  function drawZombie(ctx, type, x, y, facing, phase, attacking, flash, hpRatio) {
    const p = PAL[type];
    const s = ZD.C.ZOMBIES[type];
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (facing < 0) ctx.scale(-1, 1);

    if (type === 'crawler') {
      // láb nélküli, kúszó test
      const drag = Math.sin(phase) * 2;
      px(ctx, -10, -6, 16, 6, p.cloth);
      px(ctx, -12 + drag, -4, 5, 4, p.skin); // vonszolt csonk
      px(ctx, 2, -9, 8, 8, p.skin); // fej elöl
      px(ctx, 6, -7, 2, 2, p.eye);
      px(ctx, 8, -5 + (attacking ? -1 : 0), 5, 2.5, p.skin); // nyúló kar
    } else if (type === 'spitter') {
      zombieBase(ctx, p, s.w, s.h, phase, attacking);
      // püffedt has
      px(ctx, -s.w / 2, -s.h * 0.55, s.w, s.h * 0.24, p.skin);
      px(ctx, -s.w / 2 + 2, -s.h * 0.5, s.w - 4, 3, '#b0ff5b');
      if (attacking) px(ctx, 2, -s.h + 4, 4, 3, '#b0ff5b'); // nyál
    } else if (type === 'brute' || type === 'boss') {
      zombieBase(ctx, p, s.w, s.h, phase * 0.7, attacking);
      // óriás karok
      const alift = attacking ? -6 : 0;
      px(ctx, s.w * 0.28, -s.h * 0.62 + alift, s.w * 0.55, 5, p.skin);
      px(ctx, s.w * 0.6, -s.h * 0.62 + alift, 6, s.h * 0.3, p.skin); // lecsüngő ököl
      // váll-tüskék
      px(ctx, -s.w * 0.4, -s.h * 0.72, 4, 4, p.dark);
      px(ctx, s.w * 0.15, -s.h * 0.74, 4, 4, p.dark);
      if (type === 'boss') {
        px(ctx, -3, -s.h - 4, 3, 5, p.dark);
        px(ctx, 2, -s.h - 3, 3, 4, p.dark);
      }
    } else {
      zombieBase(ctx, p, s.w, s.h, phase, attacking);
    }

    if (flash > 0) {
      ctx.globalAlpha = Math.min(flash * 4, 0.8);
      px(ctx, -s.w / 2 - 1, -s.h - 1, s.w + 2, s.h + 1, '#ffffff');
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // HP csík (csak sérültnek)
    if (hpRatio < 1) {
      const bw = Math.max(s.w, 16);
      px(ctx, x - bw / 2, y - s.h - 6, bw, 2.5, '#2a0f0f');
      px(ctx, x - bw / 2, y - s.h - 6, bw * Math.max(hpRatio, 0), 2.5, type === 'boss' ? '#ff5b3d' : '#7ddb4f');
    }
  }

  /* ---------- HÁTTÉR ---------- */
  function drawBackground(ctx, cam, level) {
    const { VIEW_W, VIEW_H, GROUND_Y } = ZD.C;
    // égbolt — szintenként kicsit más árnyalat
    const hue = (level * 13) % 40;
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, `rgb(${10 + hue * 0.3}, ${14 + hue * 0.2}, ${20 + hue * 0.5})`);
    g.addColorStop(1, `rgb(${18 + hue * 0.4}, ${26 + hue * 0.2}, ${22})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

    // hold
    ctx.fillStyle = '#d8d8c8';
    ctx.beginPath();
    ctx.arc(VIEW_W - 70, 44, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8b8a8';
    ctx.fillRect(VIEW_W - 74, 38, 4, 4);
    ctx.fillRect(VIEW_W - 64, 48, 5, 3);

    // távoli romos sziluettek (parallax 0.25)
    ctx.fillStyle = '#131b13';
    const off1 = -(cam * 0.25) % 260;
    for (let bx = off1 - 260; bx < VIEW_W + 260; bx += 260) {
      ctx.fillRect(bx + 10, 120, 56, GROUND_Y - 120);
      ctx.fillRect(bx + 84, 96, 44, GROUND_Y - 96);
      ctx.fillRect(bx + 150, 138, 66, GROUND_Y - 138);
      // törött tetők
      ctx.fillRect(bx + 84, 88, 20, 8);
      // ablakok
      ctx.fillStyle = '#1e2a1a';
      for (let wy = 130; wy < GROUND_Y - 12; wy += 18) {
        ctx.fillRect(bx + 18, wy, 5, 7);
        ctx.fillRect(bx + 40, wy, 5, 7);
        ctx.fillRect(bx + 92, wy - 20, 5, 7);
        ctx.fillRect(bx + 112, wy - 20, 5, 7);
      }
      ctx.fillStyle = '#131b13';
    }

    // közeli kerítés (parallax 0.7)
    ctx.fillStyle = '#1a231a';
    const off2 = -(cam * 0.7) % 46;
    for (let fx = off2 - 46; fx < VIEW_W + 46; fx += 46) {
      ctx.fillRect(fx, GROUND_Y - 34, 5, 34);
      ctx.fillRect(fx - 20, GROUND_Y - 28, 46, 3);
      ctx.fillRect(fx - 20, GROUND_Y - 16, 46, 3);
    }

    // talaj
    ctx.fillStyle = '#242c1e';
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    ctx.fillStyle = '#2e3826';
    ctx.fillRect(0, GROUND_Y, VIEW_W, 3);
    // törmelék pöttyök (világhoz rögzítve)
    ctx.fillStyle = '#1c2416';
    const off3 = -cam % 37;
    for (let dx = off3 - 37; dx < VIEW_W; dx += 37) {
      ctx.fillRect(dx + 8, GROUND_Y + 9, 4, 2);
      ctx.fillRect(dx + 24, GROUND_Y + 20, 6, 2);
      ctx.fillRect(dx + 16, GROUND_Y + 30, 3, 2);
    }
  }

  /* ---------- fegyver-ikon a bolthoz ---------- */
  function weaponIcon(weapon) {
    const c = document.createElement('canvas');
    c.width = 56; c.height = 34;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(6, 16);
    ctx.scale(2.2, 2.2);
    const wcol = weapon.kind === 'laser' ? '#4c6a7a' : '#2a2a2a';
    px(ctx, 0, 0, 14, 3, wcol);
    px(ctx, 2, 3, 3, 4, '#3a3a3a');
    if (weapon.id === 'shotgun' || weapon.id === 'rifle') px(ctx, 8, -1, 5, 2, '#5c4630');
    if (weapon.id === 'uzi') px(ctx, 6, 3, 2, 3, '#3a3a3a');
    if (weapon.id === 'minigun') { px(ctx, 0, -2, 14, 2, '#2a2a2a'); px(ctx, 0, 3, 14, 2, '#2a2a2a'); }
    if (weapon.id === 'rocket') { px(ctx, -1, -2, 16, 6, '#4a4438'); px(ctx, 14, -1, 3, 4, '#8f3a3a'); }
    if (weapon.id === 'flamer') { px(ctx, -1, -1, 10, 5, '#7a3d20'); px(ctx, 12, 0, 4, 3, '#ff9a3d'); }
    if (weapon.id === 'laser') px(ctx, 12, 0.5, 4, 2, '#7de0ff');
    ctx.restore();
    return c.toDataURL();
  }

  return { drawPlayer, drawZombie, drawBackground, weaponIcon, px };
})();
