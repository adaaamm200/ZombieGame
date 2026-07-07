/* DOM-alapú képernyők: főmenü, pályaválasztó, bolt, labor, beállítások, modálok */
window.ZD = window.ZD || {};

ZD.ui = (() => {
  const C = ZD.C;
  const S = () => ZD.save.data;
  const $ = (sel) => document.querySelector(sel);
  const screens = {};
  let root;

  function el(html) {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }

  function fmt(n) { return Math.round(n).toLocaleString('hu-HU'); }

  /* ---------- képernyő-kezelés ---------- */
  function show(name) {
    Object.values(screens).forEach((s) => s.classList.add('hidden'));
    $('#hud').classList.add('hidden');
    $('#controls').classList.add('hidden');
    if (name && screens[name]) {
      const re = 'refresh_' + name;
      if (api[re]) api[re]();
      screens[name].classList.remove('hidden');
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
    $('#hpbar').style.width = `${Math.max(0, (p.hp / p.stats.maxHp) * 100)}%`;
    $('#hptext').textContent = `${Math.max(0, Math.ceil(p.hp))} / ${Math.round(p.stats.maxHp)}`;
    const denom = st.quota + (C.isBossLevel(st.level) ? 1 : 0);
    const prog = Math.min(1, (st.killed + (st.bossPhase && !st.bossRef ? 1 : 0)) / denom);
    $('#wavefill').style.width = `${prog * 100}%`;
    $('#wavetext').textContent = `${st.level}. pálya`;
    $('#coincount').textContent = fmt(S().coins);
    const w = ZD.game.curWeapon();
    $('#weaponname').textContent = w.def.name;
    $('#ammocount').textContent = w.ammo < 0 ? '∞' : String(w.ammo);
    $('#grencount').textContent = String(p.grenades);
  }

  /* ---------- képernyők felépítése ---------- */
  function build() {
    root = $('#screens');

    /* Főmenü */
    screens.title = el(`
      <div class="screen" id="s-title">
        <div class="logo">ZOMBI KRÓNIKA<small>TÚLÉLŐNAPLÓ</small></div>
        <div class="menu">
          <button class="btn primary" data-go="stages">▶ JÁTÉK</button>
          <button class="btn" data-go="armory">🔫 FEGYVERBOLT</button>
          <button class="btn" data-go="lab">⚗ LABOR</button>
          <button class="btn" data-go="settings">⚙ BEÁLLÍTÁSOK</button>
        </div>
        <p style="margin-top:auto;font-size:10px;color:var(--muted)">Saját készítésű hommage — kizárólag magáncélra.</p>
      </div>`);

    /* Pályaválasztó */
    screens.stages = el(`
      <div class="screen" id="s-stages">
        <div class="topbar">
          <button class="btn backbtn" data-go="title">← VISSZA</button>
          <h2>PÁLYÁK</h2>
          <span class="coins">🪙 <span data-coins></span></span>
        </div>
        <div class="stagegrid" id="stagegrid"></div>
      </div>`);

    /* Fegyverbolt */
    screens.armory = el(`
      <div class="screen" id="s-armory">
        <div class="topbar">
          <button class="btn backbtn" data-go="title">← VISSZA</button>
          <h2>FEGYVERBOLT</h2>
          <span class="coins">🪙 <span data-coins></span></span>
        </div>
        <div class="list" id="weaponlist"></div>
      </div>`);

    /* Labor */
    screens.lab = el(`
      <div class="screen" id="s-lab">
        <div class="topbar">
          <button class="btn backbtn" data-go="title">← VISSZA</button>
          <h2>LABOR</h2>
          <span class="coins">🪙 <span data-coins></span></span>
        </div>
        <div class="list" id="upglist"></div>
      </div>`);

    /* Beállítások */
    screens.settings = el(`
      <div class="screen" id="s-settings">
        <div class="topbar">
          <button class="btn backbtn" data-go="title">← VISSZA</button>
          <h2>BEÁLLÍTÁSOK</h2><span></span>
        </div>
        <div class="settingsrow"><span>Hangok</span><button class="btn" id="btn-sound"></button></div>
        <div class="settingsrow"><span>Mentés exportálása</span><button class="btn" id="btn-export">MÁSOLÁS IDE ↓</button></div>
        <textarea class="save-io" id="save-io" placeholder="Export: ide kerül a mentéskód. Import: illeszd be a kódot, majd IMPORTÁLÁS."></textarea>
        <div class="settingsrow"><span>Mentés importálása</span><button class="btn" id="btn-import">IMPORTÁLÁS</button></div>
        <div class="settingsrow"><span>Minden törlése</span><button class="btn danger" id="btn-reset">TÖRLÉS</button></div>
      </div>`);

    /* Szünet */
    screens.pause = el(`
      <div class="screen modal hidden" id="s-pause">
        <div class="modalbox">
          <h2>SZÜNET</h2>
          <button class="btn primary" id="btn-resume">FOLYTATÁS</button>
          <button class="btn danger" id="btn-quit">FELADÁS</button>
        </div>
      </div>`);

    /* Eredmény */
    screens.result = el(`
      <div class="screen modal hidden" id="s-result">
        <div class="modalbox">
          <h2 class="big" id="result-title"></h2>
          <p class="sub" id="result-sub"></p>
          <button class="btn primary" id="btn-next"></button>
          <button class="btn" id="btn-retry">ÚJRA</button>
          <button class="btn" data-go="title">FŐMENÜ</button>
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

  const api = {
    refresh_stages() {
      refreshCoins(screens.stages);
      const grid = $('#stagegrid');
      grid.innerHTML = '';
      for (let i = 1; i <= C.STAGES; i++) {
        const locked = i > S().stages.unlocked;
        const cleared = S().stages.cleared.includes(i);
        const boss = C.isBossLevel(i);
        const b = document.createElement('button');
        b.className = `stagecell${cleared ? ' cleared' : ''}${locked ? ' locked' : ''}${boss ? ' boss' : ''}`;
        b.innerHTML = `${locked ? '🔒' : cleared ? '✔' : i}<small>${boss ? 'VEZÉR' : `${i}. pálya`}</small>`;
        if (!locked) {
          b.addEventListener('click', () => {
            ZD.audio.play('click');
            ZD.game.start(i);
          });
        }
        grid.appendChild(b);
      }
    },

    refresh_armory() {
      refreshCoins(screens.armory);
      const list = $('#weaponlist');
      list.innerHTML = '';
      C.WEAPONS.forEach((w) => {
        const owned = S().weapons.owned.includes(w.id);
        const equipped = S().weapons.equipped === w.id;
        const afford = S().coins >= w.price;
        const dps = Math.round(w.dmg * w.rps * (w.pellets || 1));
        const item = el(`
          <div class="item${equipped ? ' equipped' : ''}">
            <img class="icon" alt="" src="${ZD.sprites.weaponIcon(w)}" />
            <div class="info">
              <div class="name">${w.name}</div>
              <div class="stats">Sebzés ${w.dmg}${(w.pellets || 1) > 1 ? `×${w.pellets}` : ''} · Tűzgyorsaság ${w.rps}/mp · DPS ~${dps}<br/>Tár/bevetés: ${w.ammo < 0 ? '∞' : w.ammo}${w.splash ? ' · robbanó' : ''}${w.pierce ? ' · átütő' : ''}${w.kind === 'flame' ? ' · égető' : ''}</div>
            </div>
            <div class="act">
              ${owned
                ? `<button class="btn ${equipped ? '' : 'primary'}" data-equip="${w.id}" ${equipped ? 'disabled' : ''}>${equipped ? 'KÉZBEN' : 'KIVÁLASZT'}</button>`
                : `<span class="price">🪙 ${fmt(w.price)}</span><button class="btn primary" data-buy="${w.id}" ${afford ? '' : 'disabled'}>MEGVESZ</button>`}
            </div>
          </div>`);
        list.appendChild(item);
      });
      list.onclick = (e) => {
        const buy = e.target.closest('[data-buy]');
        const eq = e.target.closest('[data-equip]');
        if (buy) {
          const w = C.WEAPONS.find((x) => x.id === buy.dataset.buy);
          if (S().coins >= w.price) {
            S().coins -= w.price;
            S().weapons.owned.push(w.id);
            S().weapons.equipped = w.id;
            ZD.save.persist();
            ZD.audio.play('buy');
            api.refresh_armory();
          }
        } else if (eq) {
          S().weapons.equipped = eq.dataset.equip;
          ZD.save.persist();
          ZD.audio.play('click');
          api.refresh_armory();
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
          <div class="item">
            <div class="info">
              <div class="name">${u.name} <span style="color:var(--muted);font-size:11px">(${lvl}/${u.max})</span></div>
              <div class="stats">${u.desc}</div>
              <div class="pips" style="margin-top:5px">${pips}</div>
            </div>
            <div class="act">
              ${maxed
                ? '<span class="price">MAX</span>'
                : `<span class="price">🪙 ${fmt(cost)}</span><button class="btn primary" data-upg="${u.id}" ${afford ? '' : 'disabled'}>FEJLESZT</button>`}
            </div>
          </div>`);
        list.appendChild(item);
      });
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
          ZD.audio.play('buy');
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

  function showResult(won, earned, bonus) {
    $('#result-title').textContent = won ? '✔ PÁLYA TELJESÍTVE' : '✖ ELESTÉL';
    $('#result-title').style.color = won ? 'var(--green)' : 'var(--red)';
    $('#result-sub').innerHTML = won
      ? `Zsákmány: 🪙 ${fmt(earned)}<br/>(ebből teljesítési bónusz: 🪙 ${fmt(bonus)})`
      : `A zombik legyűrtek… de a felszedett 🪙 ${fmt(earned)} megmarad.<br/>Fejlessz a laborban, és próbáld újra!`;
    $('#btn-next').textContent = won ? 'KÖVETKEZŐ PÁLYA ▶' : 'ÚJRA PRÓBÁLOM';
    $('#btn-retry').style.display = won ? '' : 'none';
    screens.result.classList.remove('hidden');
  }

  return Object.assign(api, { build, show, enterGame, updateHud, showPause, hidePause, showResult });
})();
