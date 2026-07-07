/* DOM-alapú képernyők: főmenü, pályaválasztó, bolt, labor, beállítások, modálok */
window.ZD = window.ZD || {};

ZD.ui = (() => {
  const C = ZD.C;
  const S = () => ZD.save.data;
  const $ = (sel) => document.querySelector(sel);
  const screens = {};
  let root;
  let flashId = null;      // vásárlás/fejlesztés utáni kiemelendő kártya
  let countTimer = null;   // eredmény-képernyő érme-számláló
  let armTab = 'weapons';  // aktív bolt-tab
  let loLevel = 1;         // loadout: kiválasztott pálya
  let loGren = 0;          // loadout: erre a bevetésre vett extra gránát

  function el(html) {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }

  function fmt(n) { return Math.round(n).toLocaleString('hu-HU'); }

  /* fegyverikonok cache-elve */
  const iconCache = {};
  function wIcon(w) {
    if (!iconCache[w.id]) iconCache[w.id] = ZD.sprites.weaponIcon(w);
    return iconCache[w.id];
  }
  const upgIconCache = {};
  function uIcon(id) {
    if (!upgIconCache[id]) upgIconCache[id] = ZD.sprites.upgIcon(id);
    return upgIconCache[id];
  }

  /* ---------- képernyő-kezelés ---------- */
  function show(name) {
    Object.values(screens).forEach((s) => s.classList.add('hidden'));
    $('#hud').classList.add('hidden');
    $('#controls').classList.add('hidden');
    if (name && screens[name]) {
      const re = 'refresh_' + name;
      if (api[re]) api[re]();
      screens[name].classList.remove('hidden');
      /* belépő animáció újraindítása */
      screens[name].classList.remove('anim');
      void screens[name].offsetWidth;
      screens[name].classList.add('anim');
    }
  }

  function enterGame() {
    Object.values(screens).forEach((s) => s.classList.add('hidden'));
    $('#hud').classList.remove('hidden');
    $('#controls').classList.remove('hidden');
    updateHud();
  }

  /* ---------- HUD ---------- */
  function updateHud() {
    const st = ZD.game.st;
    if (!st.player) return;
    const p = st.player;
    const hpr = Math.max(0, p.hp / p.stats.maxHp);
    $('#hpbar').style.width = `${hpr * 100}%`;
    $('#hpbar').classList.toggle('low', hpr < 0.3);
    $('#hptext').textContent = `${Math.max(0, Math.ceil(p.hp))} / ${Math.round(p.stats.maxHp)}`;
    let prog;
    let waveLabel = `${st.level}. pálya`;
    if (st.mode === 'survive') {
      prog = Math.min(1, st.time / st.surviveT);
      waveLabel = `${Math.max(0, Math.ceil(st.surviveT - st.time))} mp`;
    } else {
      const denom = st.quota + (C.isBossLevel(st.level) ? 1 : 0);
      prog = Math.min(1, (st.killed + (st.bossPhase && !st.bossRef ? 1 : 0)) / denom);
    }
    $('#wavefill').style.width = `${prog * 100}%`;
    const M = C.MODES[st.mode];
    const modIcon = st.mod ? ' ' + C.MODS[st.mod].icon : '';
    $('#wavetext').textContent = `${waveLabel}${M.icon ? ' · ' + M.icon : ''}${modIcon}`;
    $('#coincount').textContent = fmt(S().coins);
    const w = ZD.game.curWeapon();
    $('#weaponicon').src = wIcon(w.def);
    $('#weaponname').textContent = w.def.name;
    $('#ammocount').textContent = w.ammo < 0 ? '∞' : String(w.ammo);
    const lowAmmo = w.ammo >= 0 && w.ammo <= Math.max(8, Math.ceil((w.def.pack || 40) * 0.2));
    $('#ammocount').classList.toggle('low', lowAmmo);
    $('#grencount').textContent = String(p.grenades);
  }

  /* ---------- képernyők felépítése ---------- */
  function build() {
    root = $('#screens');

    /* Főmenü */
    screens.title = el(`
      <div class="screen title-screen" id="s-title">
        <div class="title-inner">
          <div class="logo">
            <span class="logo-top">ZOMBI</span>
            <span class="logo-main">KRÓNIKA</span>
            <span class="logo-sub">— TÚLÉLŐNAPLÓ —</span>
          </div>
          <div class="menu">
            <button class="btn primary big-menu" data-go="stages"><i>▶</i><span>JÁTÉK<small>40 pálya vár rád</small></span></button>
            <button class="btn big-menu" data-go="armory"><i>🔫</i><span>FEGYVERBOLT<small>8 fegyver</small></span></button>
            <button class="btn big-menu" data-go="lab"><i>⚗</i><span>LABOR<small>7 fejlesztés</small></span></button>
            <button class="btn big-menu" data-go="settings"><i>⚙</i><span>BEÁLLÍTÁSOK<small>hang · mentés</small></span></button>
          </div>
          <p class="title-note">Saját készítésű hommage — kizárólag magáncélra.</p>
        </div>
      </div>`);

    /* Pályaválasztó */
    screens.stages = el(`
      <div class="screen" id="s-stages">
        <div class="topbar">
          <button class="btn backbtn" data-go="title">←</button>
          <h2>HADJÁRAT</h2>
          <span class="coins">🪙 <span data-coins></span></span>
        </div>
        <div class="theme-legend">
          <span class="tl t0">■ Utca</span>
          <span class="tl t1">■ Labor</span>
          <span class="tl t2">■ Romváros</span>
          <span class="tl">🛡 védelem</span>
          <span class="tl">⭐ elit</span>
          <span class="tl">☠ vezér</span>
          <span class="tl">⚡🌑💰👥 módosító</span>
        </div>
        <div class="stagegrid" id="stagegrid"></div>
      </div>`);

    /* Fegyverbolt — fegyver + lőszer tabokkal */
    screens.armory = el(`
      <div class="screen" id="s-armory">
        <div class="topbar">
          <button class="btn backbtn" data-go="title">←</button>
          <h2>FEGYVERBOLT</h2>
          <span class="coins">🪙 <span data-coins></span></span>
        </div>
        <div class="tabs">
          <button class="tab active" data-tab="weapons">🔫 FEGYVEREK</button>
          <button class="tab" data-tab="ammo">📦 LŐSZER</button>
        </div>
        <div class="cardgrid" id="weaponlist"></div>
      </div>`);

    /* Labor */
    screens.lab = el(`
      <div class="screen" id="s-lab">
        <div class="topbar">
          <button class="btn backbtn" data-go="title">←</button>
          <h2>LABOR</h2>
          <span class="coins">🪙 <span data-coins></span></span>
        </div>
        <div class="cardgrid" id="upglist"></div>
      </div>`);

    /* Beállítások */
    screens.settings = el(`
      <div class="screen" id="s-settings">
        <div class="topbar">
          <button class="btn backbtn" data-go="title">←</button>
          <h2>BEÁLLÍTÁSOK</h2><span></span>
        </div>
        <div class="settings-panel">
          <div class="settingsrow"><span>Hangok</span><button class="btn" id="btn-sound"></button></div>
          <div class="settingsrow"><span>Mentés exportálása</span><button class="btn" id="btn-export">MÁSOLÁS IDE ↓</button></div>
          <textarea class="save-io" id="save-io" placeholder="Export: ide kerül a mentéskód. Import: illeszd be a kódot, majd IMPORTÁLÁS."></textarea>
          <div class="settingsrow"><span>Mentés importálása</span><button class="btn" id="btn-import">IMPORTÁLÁS</button></div>
          <div class="settingsrow"><span>Minden törlése</span><button class="btn danger" id="btn-reset">TÖRLÉS</button></div>
        </div>
      </div>`);

    /* Szünet */
    screens.pause = el(`
      <div class="screen modal hidden" id="s-pause">
        <div class="modalbox">
          <h2>⏸ SZÜNET</h2>
          <button class="btn primary" id="btn-resume">FOLYTATÁS</button>
          <button class="btn danger" id="btn-quit">FELADÁS</button>
        </div>
      </div>`);

    /* Bevetés előtti loadout */
    screens.loadout = el(`
      <div class="screen modal hidden" id="s-loadout">
        <div class="modalbox loadout">
          <h2 id="lo-title"></h2>
          <p class="sub" id="lo-desc"></p>
          <div class="lo-weapon">
            <button class="btn ghost lo-arrow" id="lo-prev">◀</button>
            <div class="lo-winfo">
              <img id="lo-wicon" alt="" />
              <span id="lo-wname"></span>
              <span id="lo-wammo"></span>
            </div>
            <button class="btn ghost lo-arrow" id="lo-next">▶</button>
          </div>
          <div class="lo-row">
            <span>💣 Gránát: <b id="lo-gren"></b></span>
            <button class="btn" id="lo-buygren"></button>
          </div>
          <div class="lo-row">
            <span>❤ HP: <b id="lo-hp"></b></span>
            <span id="lo-power"></span>
          </div>
          <button class="btn primary" id="lo-start">INDULÁS ▶</button>
          <button class="btn ghost" id="lo-back">VISSZA</button>
        </div>
      </div>`);

    /* Eredmény */
    screens.result = el(`
      <div class="screen modal hidden" id="s-result">
        <div class="modalbox" id="result-box">
          <div class="result-icon" id="result-icon"></div>
          <h2 class="big" id="result-title"></h2>
          <div class="loot-line">🪙 <b id="earn-count">0</b></div>
          <p class="sub" id="result-sub"></p>
          <button class="btn primary" id="btn-next"></button>
          <button class="btn" id="btn-retry">ÚJRA</button>
          <button class="btn ghost" data-go="title">FŐMENÜ</button>
        </div>
      </div>`);

    Object.values(screens).forEach((s) => {
      s.classList.add('hidden');
      root.appendChild(s);
    });

    /* navigációs gombok */
    root.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]');
      if (go) {
        ZD.audio.play('click');
        show(go.dataset.go);
        return;
      }
      const tab = e.target.closest('.tab');
      if (tab) {
        ZD.audio.play('click');
        armTab = tab.dataset.tab;
        screens.armory.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
        api.refresh_armory();
      }
    });

    /* beállítások gombjai */
    $('#btn-sound').addEventListener('click', () => {
      S().sound = !S().sound;
      ZD.save.persist();
      api.refresh_settings();
      ZD.audio.play('click');
    });
    $('#btn-export').addEventListener('click', () => {
      $('#save-io').value = ZD.save.exportStr();
      ZD.audio.play('click');
    });
    $('#btn-import').addEventListener('click', () => {
      const ok = ZD.save.importStr($('#save-io').value);
      $('#save-io').value = ok ? '✔ Sikeres import!' : '✖ Érvénytelen mentéskód.';
      ZD.audio.play(ok ? 'buy' : 'click');
    });
    $('#btn-reset').addEventListener('click', () => {
      if (confirm('Biztosan törlöd az összes haladást?')) {
        ZD.save.reset();
        api.refresh_settings();
      }
    });

    /* szünet */
    $('#btn-resume').addEventListener('click', () => ZD.game.resume());
    $('#btn-quit').addEventListener('click', () => { hidePause(); ZD.game.quit(); });

    /* loadout */
    $('#lo-prev').addEventListener('click', () => { cycleWeapon(-1); });
    $('#lo-next').addEventListener('click', () => { cycleWeapon(1); });
    $('#lo-buygren').addEventListener('click', () => {
      if (loGren < C.GRENADE.buyMax && S().coins >= C.GRENADE.buyPrice) {
        S().coins -= C.GRENADE.buyPrice;
        loGren++;
        ZD.save.persist();
        ZD.audio.play('buy');
        refreshLoadout();
      }
    });
    $('#lo-start').addEventListener('click', () => {
      screens.loadout.classList.add('hidden');
      ZD.audio.play('click');
      ZD.game.start(loLevel, { extraGren: loGren });
    });
    $('#lo-back').addEventListener('click', () => {
      screens.loadout.classList.add('hidden');
      ZD.audio.play('click');
    });

    /* eredmény */
    $('#btn-retry').addEventListener('click', () => {
      screens.result.classList.add('hidden');
      ZD.game.start(ZD.game.st.level);
    });
    $('#btn-next').addEventListener('click', () => {
      screens.result.classList.add('hidden');
      const next = ZD.game.st.result === 'win' ? Math.min(ZD.game.st.level + 1, C.STAGES) : ZD.game.st.level;
      ZD.game.start(next);
    });
  }

  /* ---------- frissítők ---------- */
  function refreshCoins(scr) {
    scr.querySelectorAll('[data-coins]').forEach((n) => { n.textContent = fmt(S().coins); });
  }

  /* ---------- loadout (bevetés előtti képernyő) ---------- */
  function cycleWeapon(dir) {
    const owned = C.WEAPONS.filter((w) => S().weapons.owned.includes(w.id));
    let i = owned.findIndex((w) => w.id === S().weapons.equipped);
    if (i < 0) i = 0;
    i = (i + dir + owned.length) % owned.length;
    S().weapons.equipped = owned[i].id;
    ZD.save.persist();
    ZD.audio.play('click');
    refreshLoadout();
  }

  function refreshLoadout() {
    const level = loLevel;
    const mode = C.modeFor(level);
    const mod = C.modFor(level);
    const M = C.MODES[mode];
    $('#lo-title').textContent = `${level}. PÁLYA ${M.icon ? '· ' + M.icon + ' ' + M.name : ''}`;
    $('#lo-desc').innerHTML = M.desc + (mod ? `<br/><span class="lo-mod">${C.MODS[mod].icon} ${C.MODS[mod].name} — ${C.MODS[mod].desc}</span>` : '');
    const w = C.WEAPONS.find((x) => x.id === S().weapons.equipped) || C.WEAPONS[0];
    $('#lo-wicon').src = wIcon(w);
    $('#lo-wname').textContent = w.name;
    const pool = w.ammo < 0 ? '∞' : fmt(S().ammo[w.id] || 0);
    const empty = w.ammo >= 0 && !(S().ammo[w.id] > 0);
    $('#lo-wammo').innerHTML = `Lőszer: <b class="${empty ? 'lo-empty' : ''}">${pool}</b>${empty ? ' ⚠ ÜRES!' : ''}`;
    const stats = ZD.game.calcStats();
    $('#lo-gren').textContent = String(stats.grenades + loGren);
    const canBuy = loGren < C.GRENADE.buyMax && S().coins >= C.GRENADE.buyPrice;
    const bg = $('#lo-buygren');
    bg.textContent = loGren >= C.GRENADE.buyMax ? 'MAX' : `+1 · 🪙 ${C.GRENADE.buyPrice}`;
    bg.disabled = !canBuy;
    $('#lo-hp').textContent = String(Math.round(stats.maxHp));
    /* egyszerű erő-becslés a pálya nehézségéhez képest */
    const bestDps = Math.max(...C.WEAPONS
      .filter((x) => S().weapons.owned.includes(x.id) && (x.ammo < 0 || (S().ammo[x.id] || 0) > 0))
      .map((x) => x.dmg * x.rps * (x.pellets || 1)));
    const power = bestDps * stats.dmgMul + stats.maxHp * 0.6;
    const need = 90 + level * 16;
    $('#lo-power').innerHTML = power >= need
      ? '<span class="lo-ok">✔ FELKÉSZÜLVE</span>'
      : '<span class="lo-risky">⚠ KOCKÁZATOS — fejlessz vagy vegyél lőszert!</span>';
  }

  function showLoadout(level) {
    loLevel = level;
    loGren = 0;
    refreshLoadout();
    screens.loadout.classList.remove('hidden');
  }

  /* normalizált stat-sáv (gyökös skála, hogy a kis értékek is látsszanak) */
  function bar(label, val, max, text) {
    const pct = Math.round(Math.sqrt(Math.min(1, val / max)) * 100);
    return `<div class="srow"><label>${label}</label><div class="bar"><i style="width:${pct}%"></i></div><b>${text}</b></div>`;
  }

  const api = {
    refresh_stages() {
      refreshCoins(screens.stages);
      const grid = $('#stagegrid');
      grid.innerHTML = '';
      const current = S().stages.unlocked;
      for (let i = 1; i <= C.STAGES; i++) {
        const locked = i > S().stages.unlocked;
        const cleared = S().stages.cleared.includes(i);
        const mode = C.modeFor(i);
        const mod = C.modFor(i);
        const boss = mode === 'boss';
        const theme = C.themeFor(i);
        const b = document.createElement('button');
        b.className = `stagecell t${theme} m-${mode}${cleared ? ' cleared' : ''}${locked ? ' locked' : ''}${boss ? ' boss' : ''}${i === current && !locked ? ' current' : ''}`;
        const modeIcon = C.MODES[mode].icon;
        const sub = boss ? 'VEZÉR'
          : mode === 'defense' ? 'védelem'
          : mode === 'elite' ? 'elit'
          : mode === 'survive' ? 'túlélés'
          : cleared ? '✔ kész' : `${i}. pálya`;
        b.innerHTML = `
          ${modeIcon && !boss ? `<span class="sc-mode">${modeIcon}</span>` : ''}
          ${mod ? `<span class="sc-mod" title="${C.MODS[mod].name}">${C.MODS[mod].icon}</span>` : ''}
          <span class="sc-num">${locked ? '🔒' : boss ? '☠' : i}</span><small>${sub}</small>`;
        if (!locked) {
          b.addEventListener('click', () => {
            ZD.audio.play('click');
            showLoadout(i);
          });
        }
        grid.appendChild(b);
      }
    },

    refresh_armory() {
      refreshCoins(screens.armory);
      const list = $('#weaponlist');
      list.innerHTML = '';

      if (armTab === 'weapons') {
        C.WEAPONS.forEach((w) => {
          const owned = S().weapons.owned.includes(w.id);
          const equipped = S().weapons.equipped === w.id;
          const afford = S().coins >= w.price;
          const dps = Math.round(w.dmg * w.rps * (w.pellets || 1));
          const pool = w.ammo < 0 ? '∞' : fmt(S().ammo[w.id] || 0);
          const tags = [
            w.splash ? '💥 robbanó' : '',
            w.pierce ? '➤ átütő' : '',
            w.kind === 'flame' ? '🔥 égető' : '',
            (w.pellets || 1) > 1 ? `⁂ ${w.pellets} lövedék` : '',
          ].filter(Boolean).join(' · ');
          const item = el(`
            <div class="card wcard${equipped ? ' equipped' : ''}${owned ? ' owned' : ''}" data-id="${w.id}">
              ${equipped ? '<span class="badge">KÉZBEN</span>' : owned ? '<span class="badge dim">MEGVAN</span>' : ''}
              <div class="wicon"><img alt="" src="${wIcon(w)}" /></div>
              <div class="wname">${w.name}</div>
              <div class="wstats">
                ${bar('SEBZÉS', w.dmg * (w.pellets || 1), 140, w.dmg + ((w.pellets || 1) > 1 ? `×${w.pellets}` : ''))}
                ${bar('TEMPÓ', w.rps, 18, w.rps + '/mp')}
                ${bar('DPS', dps, 340, '~' + dps)}
              </div>
              <div class="wtags">${tags || '&nbsp;'}</div>
              <div class="wact">
                ${owned
                  ? `<button class="btn ${equipped ? 'ghost' : 'primary'}" data-equip="${w.id}" ${equipped ? 'disabled' : ''}>${equipped ? '✔ KÉZBEN' : 'KIVÁLASZT'}</button>`
                  : `<span class="price${afford ? '' : ' na'}">🪙 ${fmt(w.price)}</span><button class="btn primary" data-buy="${w.id}" ${afford ? '' : 'disabled'}>MEGVESZ</button>`}
                <span class="ammoinfo-sm">Lőszerkészlet: ${owned || w.id === 'pistol' ? pool : (w.ammo + ' induló')}</span>
              </div>
            </div>`);
          list.appendChild(item);
        });
      } else {
        /* LŐSZER tab — birtokolt (nem pisztoly) fegyverek csomagjai */
        const ownedW = C.WEAPONS.filter((w) => w.id !== 'pistol' && S().weapons.owned.includes(w.id));
        if (!ownedW.length) {
          list.appendChild(el('<p class="empty-hint">Előbb vegyél egy fegyvert — a pisztolyhoz nem kell lőszer. 🔫</p>'));
        }
        ownedW.forEach((w) => {
          const pool = S().ammo[w.id] || 0;
          const low = pool <= Math.ceil((w.pack || 40) * 0.2);
          const afford = S().coins >= w.packPrice;
          const item = el(`
            <div class="card acard" data-id="ammo-${w.id}">
              <div class="wicon"><img alt="" src="${wIcon(w)}" /></div>
              <div class="wname">${w.name}</div>
              <div class="apool${low ? ' low' : ''}">Készlet: <b>${fmt(pool)}</b> lövés${low ? ' ⚠' : ''}</div>
              <div class="wact">
                <span class="price${afford ? '' : ' na'}">🪙 ${fmt(w.packPrice)}</span>
                <button class="btn primary" data-ammo="${w.id}" ${afford ? '' : 'disabled'}>+${w.pack} LÖVÉS</button>
              </div>
            </div>`);
          list.appendChild(item);
        });
      }

      if (flashId) {
        const card = list.querySelector(`[data-id="${flashId}"]`);
        if (card) {
          card.classList.add('flash');
          setTimeout(() => card.classList.remove('flash'), 700);
        }
        flashId = null;
      }
      list.onclick = (e) => {
        const buy = e.target.closest('[data-buy]');
        const eq = e.target.closest('[data-equip]');
        const am = e.target.closest('[data-ammo]');
        if (buy) {
          const w = C.WEAPONS.find((x) => x.id === buy.dataset.buy);
          if (S().coins >= w.price) {
            S().coins -= w.price;
            S().weapons.owned.push(w.id);
            S().weapons.equipped = w.id;
            S().ammo[w.id] = w.ammo;   // induló lőszerkészlet
            ZD.save.persist();
            ZD.audio.play('buy');
            flashId = w.id;
            api.refresh_armory();
          }
        } else if (eq) {
          S().weapons.equipped = eq.dataset.equip;
          ZD.save.persist();
          ZD.audio.play('click');
          api.refresh_armory();
        } else if (am) {
          const w = C.WEAPONS.find((x) => x.id === am.dataset.ammo);
          if (S().coins >= w.packPrice) {
            S().coins -= w.packPrice;
            S().ammo[w.id] = (S().ammo[w.id] || 0) + w.pack;
            ZD.save.persist();
            ZD.audio.play('ammo');
            flashId = 'ammo-' + w.id;
            api.refresh_armory();
          }
        }
      };
    },

    refresh_lab() {
      refreshCoins(screens.lab);
      const list = $('#upglist');
      list.innerHTML = '';
      C.UPGRADES.forEach((u) => {
        const lvl = S().upg[u.id] || 0;
        const maxed = lvl >= u.max;
        const cost = C.upgCost(u, lvl);
        const afford = S().coins >= cost;
        const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
        const item = el(`
          <div class="card ucard${maxed ? ' maxed' : ''}" data-id="${u.id}">
            <div class="uicon"><img alt="" src="${uIcon(u.id)}" /></div>
            <div class="uinfo">
              <div class="wname">${u.name} <span class="ulvl">${lvl}/${u.max}</span></div>
              <div class="udesc">${u.desc}</div>
              <div class="pips">${pips}</div>
            </div>
            <div class="wact">
              ${maxed
                ? '<span class="badge">MAX</span>'
                : `<span class="price${afford ? '' : ' na'}">🪙 ${fmt(cost)}</span><button class="btn primary" data-upg="${u.id}" ${afford ? '' : 'disabled'}>FEJLESZT</button>`}
            </div>
          </div>`);
        list.appendChild(item);
      });
      if (flashId) {
        const card = list.querySelector(`[data-id="${flashId}"]`);
        if (card) {
          card.classList.add('flash');
          setTimeout(() => card.classList.remove('flash'), 700);
        }
        flashId = null;
      }
      list.onclick = (e) => {
        const b = e.target.closest('[data-upg]');
        if (!b) return;
        const u = C.UPGRADES.find((x) => x.id === b.dataset.upg);
        const lvl = S().upg[u.id] || 0;
        const cost = C.upgCost(u, lvl);
        if (lvl < u.max && S().coins >= cost) {
          S().coins -= cost;
          S().upg[u.id] = lvl + 1;
          ZD.save.persist();
          ZD.audio.play('upgrade');
          flashId = u.id;
          api.refresh_lab();
        }
      };
    },

    refresh_settings() {
      $('#btn-sound').textContent = S().sound ? '🔊 BE' : '🔇 KI';
    },

    refresh_title() {},
  };

  /* ---------- modálok ---------- */
  function showPause() { screens.pause.classList.remove('hidden'); }
  function hidePause() { screens.pause.classList.add('hidden'); }

  function showResult(won, earned, bonus, stats) {
    $('#result-box').classList.toggle('win', won);
    $('#result-box').classList.toggle('lose', !won);
    $('#result-icon').textContent = won ? '🏅' : '☠';
    $('#result-title').textContent = won ? 'PÁLYA TELJESÍTVE' : 'ELESTÉL';
    const statLine = stats
      ? `<span class="statline">☠ ${fmt(stats.kills)} kiiktatva · 🔫 ${fmt(stats.shots)} lövés · 💥 ${fmt(stats.dmg)} sebzés</span><br/>`
      : '';
    $('#result-sub').innerHTML = won
      ? `${statLine}Teljesítési bónusz: 🪙 ${fmt(bonus)}`
      : `${statLine}A zsákmányod megmarad.<br/>Fejlessz a laborban, és próbáld újra!`;
    $('#btn-next').textContent = won ? 'KÖVETKEZŐ PÁLYA ▶' : 'ÚJRA PRÓBÁLOM';
    $('#btn-retry').style.display = won ? '' : 'none';

    /* érme-számláló animáció */
    if (countTimer) clearInterval(countTimer);
    const target = Math.round(earned);
    const t0 = performance.now();
    const dur = 750;
    const cnt = $('#earn-count');
    cnt.textContent = '0';
    countTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      const ease = 1 - (1 - k) * (1 - k);
      cnt.textContent = fmt(target * ease);
      if (k >= 1) { clearInterval(countTimer); countTimer = null; }
    }, 33);

    screens.result.classList.remove('hidden');
  }

  return Object.assign(api, { build, show, enterGame, updateHud, showPause, hidePause, showResult });
})();
