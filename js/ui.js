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

  /* fegyverikonok cache-elve — a HD festett sprite az elsődleges (ugyanaz, ami a
     karakter kezében is van), a procedurális rajz csak fallback */
  const iconCache = {};
  function wIcon(w) {
    if (!iconCache[w.id]) iconCache[w.id] = ZD.sprites.weaponIconSrc(w) || ZD.sprites.weaponIcon(w);
    return iconCache[w.id];
  }
  const upgIconCache = {};
  function uIcon(id) {
    if (!upgIconCache[id]) upgIconCache[id] = ZD.sprites.upgIcon(id);
    return upgIconCache[id];
  }

  const T = (k, v) => ZD.i18n.t(k, v);
  const IC = (n, c) => ZD.icon(n, c);

  /* prémium asset-ikonok (ingame_icons.png-ből szeletelve) — egységes UI-ikonnyelv.
     AIMG(name) → <img> ha van asset, különben az SVG fallback (IC). */
  const A_IC = {
    play: 'm-continue', campaign: 'm-campaign', scavenge: 'm-scavenge', armory: 'm-armory',
    lab: 'm-lab', settings: 'm-settings', gear: 'm-settings', back: 'm-back', shop: 'm-shop',
    coin: 'ic-coin', done: 's-done', current: 's-current', locked: 's-locked',
    boss: 's-boss', loot: 's-loot', danger: 's-danger', grenade: 'ic-grenade', medkit: 'ic-medkit',
  };
  const AIMG = (name, cls) => {
    const f = A_IC[name];
    return f ? `<img class="aic${cls ? ' ' + cls : ''}" src="assets/ui/${f}.png" alt="" draggable="false" />` : IC(name, cls);
  };

  /* GENERÁLT GOMB-ASSETEK (assets/ui/buttons/) — a PNG MAGA a teljes gomb (3D fém,
     textúra, glow, felirat 1:1). A DOM-elem csak kattintható wrapper; a kép object-fit:
     contain, nincs crop / sheet / extra CSS-keret. */
  const BIMG = (file, label, cls) =>
    `<img class="btn-img${cls ? ' ' + cls : ''}" src="assets/ui/buttons/${file}.png" alt="${label ? String(label).replace(/"/g, '&quot;') : ''}" draggable="false" />`;

  /* ---------- képernyő-kezelés ---------- */
  function show(name) {
    if (ZD.i18n) ZD.i18n.setLang(S().lang || 'en');
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
    let waveLabel;
    if (st.mode === 'survive') {
      prog = Math.min(1, st.time / st.surviveT);
      waveLabel = `${Math.max(0, Math.ceil(st.surviveT - st.time))}s`;
    } else if (st.mode === 'free') {
      prog = st.waveQuota ? Math.min(1, st.waveKills / st.waveQuota) : 0;
      waveLabel = `${T('res.statWave')} ${st.wave}`;
    } else {
      const denom = st.quota + (C.isBossLevel(st.level) ? 1 : 0);
      prog = Math.min(1, (st.killed + (st.bossPhase && !st.bossRef ? 1 : 0)) / denom);
      waveLabel = `${T('brief.mission')} ${C.missionInDay(st.level)}`;
    }
    $('#wavefill').style.width = `${prog * 100}%`;
    $('#wavetext').textContent = `${waveLabel} · ${T('mode.' + st.mode)}${st.mod ? ' · ' + C.MODS[st.mod].name : ''}`;
    $('#coincount').textContent = fmt(S().coins);
    const w = ZD.game.curWeapon();
    $('#weaponicon').src = wIcon(w.def);
    $('#weaponname').textContent = w.def.name;
    $('#ammocount').textContent = w.ammo < 0 ? '∞' : String(w.ammo);
    const lowAmmo = w.ammo >= 0 && w.ammo <= Math.max(8, Math.ceil((w.def.pack || 40) * 0.2));
    $('#ammocount').classList.toggle('low', lowAmmo);
    $('#grencount').textContent = String(p.grenades);
    /* meccs közbeni lőszervásárló gomb ára (pisztolynál ∞) */
    const ap = $('#ammoprice');
    if (ap) ap.textContent = w.def.id === 'pistol' ? '∞' : fmt(Math.ceil(w.def.packPrice * C.AMMO_EMERGENCY));
  }

  /* ---------- képernyők felépítése ---------- */
  function build() {
    root = $('#screens');

    /* Főmenü — logó + programozott prémium menü (i18n) */
    screens.title = el(`
      <div class="screen title-screen" id="s-title">
        <div class="menu-bg"><img class="menu-bg-img" src="assets/references/main menu background.png" alt="" draggable="false" /></div>
        <div class="menu-bg-scrim"></div>
        <div class="title-topbar">
          <span class="title-coin" id="title-coin"></span>
          <button class="title-gear" id="title-gear" data-go="settings" aria-label="Settings"></button>
        </div>
        <div class="title-inner">
          <img class="brand-logo" src="assets/ui/logo.png" alt="ZombieChronicles" draggable="false" />
          <div class="menu" id="title-menu"></div>
          <button class="title-save" id="title-save" data-go="settings"></button>
        </div>
        <!-- FIX alsó lábléc (nem a görgethető menü része): „For personal use only. | build vXX" -->
        <div class="app-footer">
          <span class="af-note" id="title-note"></span>
          <span class="af-sep" aria-hidden="true">|</span>
          <span class="build-badge" id="build-badge"></span>
        </div>
      </div>`);

    /* Pályaválasztó — CLEAN board-artwork (assets/references/day1_board_target_clean.png)
       háttérként + TELJESEN programozott UI overlay (HUD, nav, hotspotok, briefing). */
    screens.stages = el(`
      <div class="screen board-screen" id="s-stages">
        <!-- 16:9 board-frame: teljes szélességet kitölt, függőlegesen középre igazít
             (a szélesebb-mint-16:9 mobil viewporton min. felül/alul crop) → full-bleed,
             a hotspotok %-poziciója pontosan a festett helyszínekre esik. -->
        <div class="board-frame">
          <img class="board-bg" src="assets/references/day1_board_target_clean.png" alt="" draggable="false" />
          <div class="board-scrim"></div>
          <div class="board-hotspots" id="board-hotspots"></div>
        </div>
        <!-- HUD / nav / briefing: a KÉPERNYŐ (safe-area) széleihez rögzítve, NEM a board-frame-hez -->
        <div class="bhud">
          <button class="bhud-back" data-go="title" aria-label="Menu"></button>
          <div class="bhud-day">
            <button class="bday-nav" id="bday-prev" aria-label="Previous day">&#8249;</button>
            <span class="bd-num" id="bd-num">DAY 1</span><span class="bd-name" id="bd-name"></span>
            <button class="bday-nav" id="bday-next" aria-label="Next day">&#8250;</button>
          </div>
          <div class="bhud-right">
            <span class="bhud-coin" id="bhud-coin"></span>
            <button class="bhud-shop" data-go="armory" id="bhud-shop" aria-label="Shop"></button>
            <button class="bhud-gear" data-go="settings" aria-label="Settings"></button>
          </div>
        </div>
        <div class="bnav">
          <button class="bnav-item active" id="bn-campaign" aria-label="Campaign"></button>
          <button class="bnav-item" id="bn-scavenge" aria-label="Scavenge"></button>
          <button class="bnav-item" data-go="settings" id="bn-settings" aria-label="Settings"></button>
        </div>
        <div class="stage-preview hidden" id="stage-preview">
          <div class="sp-card" id="sp-card">
            <button class="sp-close" id="sp-close" aria-label="Close"></button>
            <div class="sp-brief">
              <div class="sp-thumb" id="sp-thumb"></div>
              <div class="sp-info">
                <span class="sp-status" id="sp-status"></span>
                <span class="sp-day" id="sp-day"></span>
                <h3 id="sp-title"></h3>
                <span class="sp-mode" id="sp-mode"></span>
                <div class="sp-obj" id="sp-obj"></div>
                <div class="sp-meta">
                  <div class="sp-danger" id="sp-danger"></div>
                  <div class="sp-rec" id="sp-rec"></div>
                  <div class="sp-reward" id="sp-reward"></div>
                </div>
              </div>
              <button class="btn primary sp-start" id="sp-start">START</button>
            </div>
            <div class="sp-locked hidden" id="sp-locked"></div>
          </div>
        </div>
      </div>`);

    /* Fegyverbolt — fegyver + lőszer tabokkal */
    screens.armory = el(`
      <div class="screen" id="s-armory">
        <div class="topbar">
          <button class="btn backbtn" data-go="title" id="arm-back"></button>
          <h2 id="arm-title"></h2>
          <span class="coins"><img class="aic coin-ic" src="assets/ui/ic-coin.png" alt="" /> <span data-coins></span></span>
        </div>
        <div class="tabs">
          <button class="tab active" data-tab="weapons" id="arm-tab-w"></button>
          <button class="tab" data-tab="ammo" id="arm-tab-a"></button>
          <button class="tab" data-tab="chars" id="arm-tab-c"></button>
        </div>
        <div class="cardgrid" id="weaponlist"></div>
      </div>`);

    /* Labor */
    screens.lab = el(`
      <div class="screen" id="s-lab">
        <div class="topbar">
          <button class="btn backbtn" data-go="title" id="lab-back"></button>
          <h2 id="lab-title"></h2>
          <span class="coins"><img class="aic coin-ic" src="assets/ui/ic-coin.png" alt="" /> <span data-coins></span></span>
        </div>
        <div class="cardgrid" id="upglist"></div>
      </div>`);

    /* Beállítások */
    screens.settings = el(`
      <div class="screen" id="s-settings">
        <div class="topbar">
          <button class="btn backbtn" data-go="title" id="set-back"></button>
          <h2 id="set-title"></h2><span></span>
        </div>
        <div class="settings-panel">
          <div class="settingsrow"><span id="set-lang-l"></span>
            <div class="lang-switch">
              <button class="lang-opt" data-lang="en">English</button>
              <button class="lang-opt" data-lang="hu">Magyar</button>
            </div>
          </div>
          <div class="settingsrow"><span id="set-sound-l"></span><button class="btn" id="btn-sound"></button></div>
          <div class="backup-hint" id="backup-hint"></div>
          <div class="settingsrow"><span id="set-savefile-l"></span><button class="btn primary" id="btn-savefile"></button></div>
          <div class="settingsrow"><span id="set-loadfile-l"></span><button class="btn" id="btn-loadfile"></button></div>
          <input type="file" id="file-input" accept=".txt,.json,text/plain,application/json" style="display:none" />
          <div class="settings-sep" id="set-sep"></div>
          <div class="settingsrow"><span id="set-export-l"></span><button class="btn" id="btn-export"></button></div>
          <textarea class="save-io" id="save-io"></textarea>
          <div class="settingsrow"><span id="set-import-l"></span><button class="btn" id="btn-import"></button></div>
          <div class="settingsrow"><span id="set-wipe-l"></span><button class="btn danger" id="btn-reset"></button></div>
        </div>
      </div>`);

    /* Szünet */
    screens.pause = el(`
      <div class="screen modal hidden" id="s-pause">
        <div class="modalbox">
          <h2 id="pause-title"></h2>
          <button class="btn primary" id="btn-resume"></button>
          <button class="btn danger" id="btn-quit"></button>
        </div>
      </div>`);

    /* Bevetés előtti loadout */
    screens.loadout = el(`
      <div class="screen modal hidden" id="s-loadout">
        <div class="modalbox loadout">
          <h2 id="lo-title"></h2>
          <p class="sub" id="lo-desc"></p>
          <div class="lo-weapon">
            <button class="btn ghost lo-arrow" id="lo-prev" aria-label="Prev"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button>
            <div class="lo-winfo">
              <img id="lo-wicon" alt="" />
              <span id="lo-wname"></span>
              <span id="lo-wammo"></span>
            </div>
            <button class="btn ghost lo-arrow" id="lo-next" aria-label="Next"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>
          </div>
          <div class="lo-row">
            <span><b id="lo-gren-l"></b>: <b id="lo-gren"></b></span>
            <button class="btn" id="lo-buygren"></button>
          </div>
          <div class="lo-row">
            <span><b id="lo-hp-l"></b>: <b id="lo-hp"></b></span>
            <span id="lo-power"></span>
          </div>
          <button class="btn primary" id="lo-start"></button>
          <button class="btn ghost" id="lo-back"></button>
        </div>
      </div>`);

    /* Eredmény */
    screens.result = el(`
      <div class="screen modal hidden" id="s-result">
        <div class="modalbox" id="result-box">
          <div class="result-icon" id="result-icon"></div>
          <h2 class="big" id="result-title"></h2>
          <div class="loot-line"><img class="aic coin-ic" src="assets/ui/ic-coin.png" alt="" /> <b id="earn-count">0</b></div>
          <p class="sub" id="result-sub"></p>
          <button class="btn primary" id="btn-next"></button>
          <button class="btn" id="btn-retry"></button>
          <button class="btn ghost" id="result-menu" data-go="title"></button>
        </div>
      </div>`);

    Object.values(screens).forEach((s) => {
      s.classList.add('hidden');
      root.appendChild(s);
    });

    /* Atmoszféra-réteg (pernye + filmszemcse + vignetta) a teljes képernyős
       felületekre. A modálok (pause/loadout/result) kimaradnak: azok már
       elsötétített overlay-en ülnek, ott dupla lenne. */
    ['title', 'stages', 'armory', 'lab', 'settings'].forEach((k) => {
      if (!screens[k]) return;
      const fx = document.createElement('div');
      fx.className = 'scr-fx';
      fx.setAttribute('aria-hidden', 'true');
      screens[k].appendChild(fx);
    });

    /* navigációs gombok */
    root.addEventListener('click', (e) => {
      const act = e.target.closest('[data-action]');
      if (act) {
        ZD.audio.play('click');
        if (act.dataset.action === 'scavenge') showLoadout('free');
        return;
      }
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
    /* nyelvválasztás */
    screens.settings.addEventListener('click', (e) => {
      const opt = e.target.closest('.lang-opt');
      if (!opt) return;
      S().lang = opt.dataset.lang;
      ZD.i18n.setLang(S().lang);
      ZD.save.persist();
      ZD.audio.play('click');
      api.refresh_settings();
    });
    $('#btn-export').addEventListener('click', () => {
      $('#save-io').value = ZD.save.exportStr();
      ZD.audio.play('click');
    });
    $('#btn-import').addEventListener('click', () => {
      const ok = ZD.save.importStr($('#save-io').value);
      $('#save-io').value = T(ok ? 'set.importOk' : 'set.importBad');
      ZD.audio.play(ok ? 'buy' : 'click');
      if (ok) { ZD.i18n.setLang(S().lang || 'en'); api.refresh_settings(); }
    });
    /* fájl-alapú biztonsági mentés — túléli a PWA törlését is */
    $('#btn-savefile').addEventListener('click', () => {
      const ok = ZD.save.downloadBackup();
      ZD.audio.play(ok ? 'buy' : 'click');
      api.refresh_settings();
    });
    $('#btn-loadfile').addEventListener('click', () => { $('#file-input').click(); });
    $('#file-input').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      ZD.save.importFile(file).then((ok) => {
        ZD.audio.play(ok ? 'buy' : 'click');
        $('#save-io').value = T(ok ? 'set.fileOk' : 'set.fileBad');
        if (ok) ZD.i18n.setLang(S().lang || 'en');
        api.refresh_settings();
        e.target.value = '';
      });
    });
    $('#btn-reset').addEventListener('click', () => {
      if (confirm(T('set.wipeConfirm'))) {
        ZD.save.reset();
        ZD.i18n.setLang(S().lang || 'en');
        api.refresh_settings();
      }
    });

    /* szünet */
    $('#btn-resume').addEventListener('click', () => ZD.game.resume());
    $('#btn-quit').addEventListener('click', () => { hidePause(); ZD.game.quit(); });

    /* nap-navigáció: előző / következő feloldott nap böngészése */
    $('#bday-prev').addEventListener('click', () => { ZD.audio.play('click'); setBoardDay(curDay - 1); });
    $('#bday-next').addEventListener('click', () => { ZD.audio.play('click'); setBoardDay(curDay + 1); });
    /* Scavenge / Free Mode — bal nav gomb → briefing */
    $('#bn-scavenge').addEventListener('click', () => {
      ZD.audio.play('click');
      const sc = $('#board-hotspots') && $('#board-hotspots').querySelector('.hotspot.is-scavenge');
      if (sc) selectHotspot(sc);
      showBriefing('free');
    });
    /* briefing panel bezárása */
    $('#sp-close').addEventListener('click', () => {
      ZD.audio.play('click');
      $('#stage-preview').classList.add('hidden');
    });

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
      if (ZD.game.st.isFree) { ZD.game.start('free'); return; }
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
    const isFree = level === 'free';
    const mode = isFree ? 'free' : C.modeFor(level);
    const mod = isFree ? null : C.modFor(level);
    $('#lo-title').textContent = isFree
      ? T('scav.title')
      : `${T('brief.mission')} ${C.missionInDay(level)} · ${modeLabel(mode)}`;
    $('#lo-desc').innerHTML = T('obj.' + mode) + (mod ? `<br/><span class="lo-mod">${C.MODS[mod].name} — ${C.MODS[mod].desc}</span>` : '');
    const w = C.WEAPONS.find((x) => x.id === S().weapons.equipped) || C.WEAPONS[0];
    $('#lo-wicon').src = wIcon(w);
    $('#lo-wname').textContent = w.name;
    const pool = w.ammo < 0 ? '∞' : fmt(S().ammo[w.id] || 0);
    const empty = w.ammo >= 0 && !(S().ammo[w.id] > 0);
    $('#lo-wammo').innerHTML = `${T('lo.ammo')}: <b class="${empty ? 'lo-empty' : ''}">${pool}</b>${empty ? ' · ' + T('lo.empty') : ''}`;
    $('#lo-gren-l').textContent = T('lo.grenades');
    $('#lo-hp-l').textContent = T('lo.hp');
    const stats = ZD.game.calcStats();
    $('#lo-gren').textContent = String(stats.grenades + loGren);
    const canBuy = loGren < C.GRENADE.buyMax && S().coins >= C.GRENADE.buyPrice;
    const bg = $('#lo-buygren');
    bg.innerHTML = loGren >= C.GRENADE.buyMax ? T('lo.max') : `+1 · ${AIMG('coin', 'coin-ic')} ${C.GRENADE.buyPrice}`;
    bg.disabled = !canBuy;
    $('#lo-hp').textContent = String(Math.round(stats.maxHp));
    $('#lo-start').textContent = T('lo.start');
    $('#lo-back').textContent = T('lo.back');
    const bestDps = Math.max(...C.WEAPONS
      .filter((x) => S().weapons.owned.includes(x.id) && (x.ammo < 0 || (S().ammo[x.id] || 0) > 0))
      .map((x) => x.dmg * x.rps * (x.pellets || 1)));
    const power = bestDps * stats.dmgMul + stats.maxHp * 0.6;
    const need = isFree ? 80 : 90 + level * 16;
    $('#lo-power').innerHTML = power >= need
      ? `<span class="lo-ok">${T('lo.ready')}</span>`
      : `<span class="lo-risky">${T('lo.risky')}</span>`;
  }

  function showLoadout(level) {
    loLevel = level;
    loGren = 0;
    refreshLoadout();
    screens.loadout.classList.remove('hidden');
  }

  /* ---------- DAY-alapú campaign board (i18n) ---------- */
  let curDay = 1;

  function recommendedWeapon(level) {
    const tiers = [['uzi', 3], ['shotgun', 6], ['rifle', 12], ['minigun', 28], ['laser', 60], ['rocket', 100]];
    let pick = 'uzi';
    for (const [id, upTo] of tiers) { pick = id; if (level <= upTo) break; }
    const w = C.WEAPONS.find((x) => x.id === pick);
    return w ? w.name : 'Vipera SMG';
  }

  function modeLabel(mode) { return T('mode.' + mode); }
  function modeThumb(mode) { return mode === 'boss' ? AIMG('boss', 'aic-thumb') : (mode === 'free' || mode === 'scavenge') ? AIMG('loot', 'aic-thumb') : AIMG('current', 'aic-thumb'); }
  function boardDayName(day) { return day === 1 ? T('day1.name') : C.dayName(day); }
  /* a misszió neve = a HELYSZÍN neve (misszió-sorszámhoz kötve, minden nap ugyanaz) */
  function boardMissionName(level) { return C.locationName(level); }

  function currentDay() { return C.dayOf(Math.min(S().stages.unlocked, C.STAGES)); }

  function dayStateOf(day) {
    const un = S().stages.unlocked;
    const cl = S().stages.cleared;
    const first = C.levelOf(day, 1);
    const finale = C.levelOf(day, C.CAMPAIGN.MISSIONS_PER_DAY);
    return { locked: first > un, cleared: cl.includes(finale), isCurrent: day === currentDay(), first, finale };
  }

  function missionStateOf(level) {
    const un = S().stages.unlocked;
    if (S().stages.cleared.includes(level)) return 'done';
    if (level > un) return 'locked';
    if (level === un) return 'current';
    return 'open';
  }

  /* --- interaktív hotspotok a VALÓDI board-kép helyszínei fölött (Day 1) ---
     A % pozíciók a day1_board_target.png kompozíciójához igazítva (a helyszínek fölé). */
  const HOTSPOTS = [
    { slot: 1, x: 22, y: 29 },   // Karantén Utca — zöld barikád/kapu (bal-fent)
    { slot: 2, x: 48, y: 31 },   // Elhagyott Bolt — üzletépület (fent-közép)
    { slot: 3, x: 28, y: 56 },   // Lerombolt Sikátor — romos épület (bal-közép)
    { slot: 4, x: 55, y: 66 },   // Védelmi Pont — tábor őrtoronnyal/tűzzel (lent-közép)
    { slot: 5, x: 82, y: 28 },   // Gócpont — vörös boss-fészek (jobb-fent)
  ];
  const SCAV_POS = { x: 86, y: 68 };   // Zsákmány Zóna — lila supply-ládák (jobb-lent)

  function selectHotspot(el) {
    $('#board-hotspots').querySelectorAll('.hotspot.sel').forEach((n) => n.classList.remove('sel'));
    if (el) el.classList.add('sel');
  }

  /* asset-hexagon embléma (prémium s-*.png) — teljes markert ad, CSS-keret nélkül */
  function assetEmblem(name) {
    return `<span class="hs-emblem hs-asset"><img class="hs-img" src="assets/ui/s-${name}.png" alt="" draggable="false" /></span>`;
  }
  /* számozott (CSS-hexagon) embléma az elérhető/jelenlegi misszióhoz */
  function numEmblem(n) {
    return `<span class="hs-emblem"><span class="hs-glyph">${n}</span></span>`;
  }

  function makeHotspot(cfg) {
    const isFree = cfg.level === 'free';
    const el = document.createElement('button');
    el.style.left = cfg.x + '%';
    el.style.top = cfg.y + '%';
    let cls, emblem;
    if (isFree) {
      cls = 'is-scavenge'; emblem = assetEmblem('loot');
    } else {
      const ms = missionStateOf(cfg.level);
      const boss = C.modeFor(cfg.level) === 'boss';
      cls = `is-${ms}${boss ? ' is-boss' : ''}`;
      emblem = boss ? assetEmblem('boss')
        : ms === 'done' ? assetEmblem('done')
        : ms === 'locked' ? assetEmblem('locked')
        : numEmblem(cfg.slot);
    }
    el.className = 'hotspot ' + cls;
    el.dataset.level = String(cfg.level);
    const label = isFree ? T('scav.title') : boardMissionName(cfg.level);
    el.setAttribute('aria-label', label);
    el.innerHTML =
      '<span class="hs-halo"></span>' + emblem +
      '<span class="hs-label">' + label + '</span>';
    el.addEventListener('click', () => { ZD.audio.play('click'); selectHotspot(el); showBriefing(cfg.level); });
    return el;
  }

  /* a board HUD/nav ikonjai + i18n feliratai (nyelvváltásra is frissül) */
  function fillBoardChrome() {
    const scr = screens.stages;
    scr.querySelector('.bhud-back').innerHTML = BIMG('btn_back', 'Back', 'bhud-back-img');
    scr.querySelector('.bhud-gear').innerHTML = AIMG('settings', 'aic-btn');
    $('#bd-num').textContent = T('day.label') + ' ' + curDay;
    $('#bd-name').style.display = 'none';   // a napnak NINCS neve — az elnevezés a helyszíneké
    const cd = currentDay();
    const bp = $('#bday-prev'), bn = $('#bday-next');
    if (bp) bp.classList.toggle('is-off', curDay <= 1);
    if (bn) bn.classList.toggle('is-off', curDay >= cd);
    $('#bhud-coin').innerHTML = AIMG('coin', 'coin-ic') + `<b>${fmt(S().coins)}</b>`;
    /* SHOP + board nav = GENERÁLT GOMB-ASSETEK (a PNG maga a gomb) */
    $('#bhud-shop').innerHTML = BIMG('btn_shop_cta', T('board.shop'));
    $('#bn-campaign').innerHTML = BIMG('btn_campaign_board', T('nav.campaign'));
    $('#bn-scavenge').innerHTML = BIMG('btn_scavenge_board', T('nav.scavenge'));
    $('#bn-settings').innerHTML = BIMG('btn_settings_board', T('nav.settings'));
    $('#sp-close').innerHTML = BIMG('btn_close', 'Close', 'sp-close-img');
  }

  /* a megjelenített napra vált (1 .. aktuális feloldott nap), és újrarajzol */
  function setBoardDay(d) {
    curDay = Math.max(1, Math.min(d, currentDay()));
    renderBoard();
  }
  /* A board a MEGJELENÍTETT napot (curDay) rajzolja — a hotspotok az adott nap misszióira
     mutatnak, az állapotuk (done/current/locked) a valós haladásból jön. A nyilakkal
     bármelyik feloldott nap böngészhető (a háttér-artwork közös, generikus jelenet). */
  function renderBoard() {
    const cd = currentDay();
    curDay = Math.max(1, Math.min(curDay, cd));
    fillBoardChrome();
    const host = $('#board-hotspots');
    host.innerHTML = '';
    HOTSPOTS.forEach((h) => host.appendChild(makeHotspot({ level: C.levelOf(curDay, h.slot), x: h.x, y: h.y, slot: h.slot })));
    host.appendChild(makeHotspot({ level: 'free', x: SCAV_POS.x, y: SCAV_POS.y }));
    /* belépéskor: az aktuális napon a jelenlegi misszió, korábbi napon az első misszió */
    const un = S().stages.unlocked;
    const dayFirst = C.levelOf(curDay, 1), dayFinale = C.levelOf(curDay, C.CAMPAIGN.MISSIONS_PER_DAY);
    const curLevel = curDay === cd ? Math.max(dayFirst, Math.min(un, dayFinale)) : dayFirst;
    const curEl = host.querySelector(`.hotspot[data-level="${curLevel}"]`);
    if (curEl) { selectHotspot(curEl); showBriefing(curLevel); }
  }

  /* briefing-adatok egy misszióhoz (vagy 'free') */
  function previewData(level) {
    const isFree = level === 'free';
    const mode = isFree ? 'free' : C.modeFor(level);
    const theme = isFree ? 0 : C.themeFor(level);
    const mod = isFree ? null : C.modFor(level);
    const boss = mode === 'boss';
    const state = isFree ? 'free' : missionStateOf(level);
    let reward = null;
    if (!isFree) {
      const avgCoin = 8 * C.coinMul(level);
      const kills = mode === 'elite' ? C.quota(level) * 0.45
        : mode === 'survive' ? C.quota(level) * 0.8 : C.quota(level);
      const clear = C.clearBonus(level) * C.clearMult(mode);
      reward = Math.round(kills * avgCoin + clear + (boss ? C.ZOMBIES.boss.coin * C.coinMul(level) : 0));
    }
    const diff = isFree ? 0 : Math.min(5, Math.ceil(level / 20)); // 100 szintre skálázott 5 sáv
    const stats = ZD.game.calcStats();
    const owned = C.WEAPONS.filter((x) => S().weapons.owned.includes(x.id) && (x.ammo < 0 || (S().ammo[x.id] || 0) > 0));
    const bestDps = owned.length ? Math.max(...owned.map((x) => x.dmg * x.rps * (x.pellets || 1))) : 0;
    const power = bestDps * stats.dmgMul + stats.maxHp * 0.6;
    const need = isFree ? 80 : 90 + level * 16;
    return {
      isFree, mode, theme, mod, boss, reward, diff,
      locked: state === 'locked', done: state === 'done', next: state === 'current',
      ready: power >= need,
    };
  }

  /* mission briefing panel (bottom-sheet) — thumb | info | START */
  function showBriefing(level) {
    const d = previewData(level);
    const pv = $('#stage-preview');
    $('#sp-card').className = 'sp-card' + (d.boss ? ' n-boss' : d.isFree ? ' n-free' : '');

    const thumb = $('#sp-thumb');
    thumb.className = 'sp-thumb m-' + d.mode;
    thumb.innerHTML = modeThumb(d.mode);

    const stc = $('#sp-status');
    if (d.isFree) { stc.className = 'sp-status farm'; stc.textContent = T('state.farmzone'); }
    else if (d.locked) { stc.className = 'sp-status locked'; stc.textContent = T('state.locked'); }
    else if (d.done) { stc.className = 'sp-status done'; stc.textContent = T('state.completed'); }
    else if (d.next) { stc.className = 'sp-status next'; stc.textContent = T('state.next'); }
    else { stc.className = 'sp-status open'; stc.textContent = T('state.available'); }

    if (d.isFree) {
      $('#sp-day').textContent = T('brief.extMode');
      $('#sp-title').textContent = T('scav.title');
      $('#sp-mode').textContent = T('brief.farmSub');
    } else {
      const day = C.dayOf(level);
      const m = C.missionInDay(level);
      $('#sp-day').textContent = `${T('day.label')} ${day} · ${d.boss ? T('brief.finale') : `${T('brief.mission')} ${m}/${C.CAMPAIGN.MISSIONS_PER_DAY}`}`;
      $('#sp-title').textContent = boardMissionName(level);   // = a helyszín neve
      $('#sp-mode').textContent = `${modeLabel(d.mode)}${d.mod ? ` · ${C.MODS[d.mod].name}` : ''}`;
    }

    $('#sp-obj').innerHTML = `<b>${T('brief.objective')}:</b> ${T('obj.' + d.mode)}`;

    const skulls = d.isFree ? 3 : d.diff;
    $('#sp-danger').innerHTML = `<span class="lbl">${T('brief.danger')}</span>` +
      Array.from({ length: 5 }, (_, i) => `<span class="sk${i < skulls ? ' on' : ''}">${AIMG('danger')}</span>`).join('') +
      `<b>${d.isFree ? T('diff.inf') : T('diff.' + d.diff)}</b>`;
    $('#sp-reward').innerHTML = d.isFree
      ? `<span class="lbl">${T('brief.reward')}</span> <b class="cn">${AIMG('coin', 'coin-ic')}farm</b>`
      : `<span class="lbl">${T('brief.reward')}</span> <b class="cn">${AIMG('coin', 'coin-ic')}~${fmt(d.reward)}</b> <b class="xp">XP ~${Math.round(d.reward * 0.15)}</b>`;
    $('#sp-rec').innerHTML = d.isFree
      ? `<span class="lbl">${T('brief.suggested')}</span> <b>${T('brief.recFast')}</b>`
      : `<span class="lbl">${T('brief.suggested')}</span> <b>${recommendedWeapon(level)}</b>`;

    const lk = $('#sp-locked');
    const start = $('#sp-start');
    if (d.locked) {
      lk.classList.remove('hidden');
      lk.textContent = C.missionInDay(level) === 1 ? T('brief.lockedPrevDay') : T('brief.lockedPrevMission');
      start.classList.add('hidden');
    } else {
      lk.classList.add('hidden');
      start.classList.remove('hidden');
      /* mission CTA = GENERÁLT GOMB-ASSET (a PNG maga a gomb): boss→FIGHT BOSS (vörös),
         completed→REPLAY, egyébként (current / scavenge / free)→START RUN. */
      const label = d.isFree ? T('brief.startFarm') : d.boss ? T('brief.startBoss') : d.done ? T('brief.startReplay') : T('brief.start');
      const asset = d.boss ? 'btn_fight_boss' : (d.done && !d.isFree) ? 'btn_replay' : 'btn_start_run';
      start.className = 'sp-start btn-cta' + (d.boss ? ' cta-boss' : '');
      start.setAttribute('aria-label', label);
      start.innerHTML = BIMG(asset, label, 'cta-img');
      start.onclick = () => {
        ZD.audio.play('click');
        pv.classList.add('hidden');
        showLoadout(d.isFree ? 'free' : level);
      };
    }
    pv.classList.remove('hidden');
  }

  /* normalizált stat-sáv (gyökös skála, hogy a kis értékek is látsszanak) */
  function bar(label, val, max, text) {
    const pct = Math.round(Math.sqrt(Math.min(1, val / max)) * 100);
    return `<div class="srow"><label>${label}</label><div class="bar"><i style="width:${pct}%"></i></div><b>${text}</b></div>`;
  }

  const api = {
    refresh_stages() {
      refreshCoins(screens.stages);
      curDay = currentDay();   // belépéskor mindig az aktuális napra ugrik
      renderBoard();
    },

    refresh_armory() {
      refreshCoins(screens.armory);
      screens.armory.querySelector('#arm-back').innerHTML = AIMG('back', 'aic-btn');
      $('#arm-title').textContent = T('arm.title');
      $('#arm-tab-w').textContent = T('arm.weapons');
      $('#arm-tab-a').textContent = T('arm.ammo');
      $('#arm-tab-c').textContent = T('arm.chars');
      const list = $('#weaponlist');
      list.innerHTML = '';
      const COIN = AIMG('coin', 'coin-ic');

      if (armTab === 'chars') {
        /* KARAKTER-VÁLASZTÓ — a kártya-előnézet a rig TORZÓ+FEJ partjából áll össze
           (nincs külön portré-asset). Egyelőre mind elérhető, stat-eltérés nincs. */
        C.CHARACTERS.forEach((ch) => {
          const sel = S().character === ch.id;
          const base = `assets/sprites/characters/${ch.id}/parts_rig/`;
          const item = el(`
            <div class="card wcard${sel ? ' equipped' : ''} owned" data-id="${ch.id}">
              ${sel ? `<span class="badge">${T('arm.equipped')}</span>` : ''}
              <div class="wicon charpv">
                <img alt="" src="${base}torso.png" class="cp-torso" />
                <img alt="" src="${base}head.png" class="cp-head" />
              </div>
              <div class="wname">${T(ch.nameKey)}</div>
              <div class="wtags">${T(ch.descKey)}</div>
              <div class="wact">
                <button class="btn ${sel ? 'ghost' : 'primary'}" data-char="${ch.id}" ${sel ? 'disabled' : ''}>${sel ? T('arm.equipped') : T('arm.select')}</button>
              </div>
            </div>`);
          list.appendChild(item);
        });
      } else if (armTab === 'weapons') {
        C.WEAPONS.forEach((w) => {
          const owned = S().weapons.owned.includes(w.id);
          const equipped = S().weapons.equipped === w.id;
          const afford = S().coins >= w.price;
          const dps = Math.round(w.dmg * w.rps * (w.pellets || 1));
          const pool = w.ammo < 0 ? '∞' : fmt(S().ammo[w.id] || 0);
          const tags = [
            w.splash ? 'splash' : '',
            w.pierce ? 'pierce' : '',
            w.kind === 'flame' ? 'burn' : '',
            (w.pellets || 1) > 1 ? `${w.pellets}× pellet` : '',
          ].filter(Boolean).join(' · ');
          const item = el(`
            <div class="card wcard${equipped ? ' equipped' : ''}${owned ? ' owned' : ''}" data-id="${w.id}">
              ${equipped ? `<span class="badge">${T('arm.equipped')}</span>` : ''}
              <div class="wicon"><img alt="" src="${wIcon(w)}" /></div>
              <div class="wname">${w.name}</div>
              <div class="wstats">
                ${bar('DMG', w.dmg * (w.pellets || 1), 140, w.dmg + ((w.pellets || 1) > 1 ? `×${w.pellets}` : ''))}
                ${bar('RATE', w.rps, 18, w.rps + '/s')}
                ${bar('DPS', dps, 340, '~' + dps)}
              </div>
              <div class="wtags">${tags || '&nbsp;'}</div>
              <div class="wact">
                ${owned
                  ? `<button class="btn ${equipped ? 'ghost' : 'primary'}" data-equip="${w.id}" ${equipped ? 'disabled' : ''}>${equipped ? T('arm.equipped') : T('arm.select')}</button>`
                  : `<span class="price${afford ? '' : ' na'}">${COIN} ${fmt(w.price)}</span><button class="btn primary" data-buy="${w.id}" ${afford ? '' : 'disabled'}>${T('arm.buy')}</button>`}
                <span class="ammoinfo-sm">${T('lo.ammo')}: ${owned || w.id === 'pistol' ? pool : w.ammo}</span>
              </div>
            </div>`);
          list.appendChild(item);
        });
      } else {
        /* LŐSZER tab — birtokolt (nem pisztoly) fegyverek csomagjai */
        const ownedW = C.WEAPONS.filter((w) => w.id !== 'pistol' && S().weapons.owned.includes(w.id));
        if (!ownedW.length) {
          list.appendChild(el(`<p class="empty-hint">${T('arm.emptyHint')}</p>`));
        }
        ownedW.forEach((w) => {
          const pool = S().ammo[w.id] || 0;
          const low = pool <= Math.ceil((w.pack || 40) * 0.2);
          const afford = S().coins >= w.packPrice;
          const affordBig = S().coins >= w.packBigPrice;
          /* nagy csomag mennyiségi kedvezménye (%) */
          const save = Math.round((1 - (w.packBigPrice / w.packBig) / (w.packPrice / w.pack)) * 100);
          const item = el(`
            <div class="card acard" data-id="ammo-${w.id}">
              <div class="wicon"><img alt="" src="${wIcon(w)}" /></div>
              <div class="wname">${w.name}</div>
              <div class="apool${low ? ' low' : ''}">${T('lo.ammo')}: <b>${fmt(pool)}</b></div>
              <div class="ammo-buys">
                <div class="ammo-buy">
                  <span class="price${afford ? '' : ' na'}">${COIN} ${fmt(w.packPrice)}</span>
                  <button class="btn" data-ammo="${w.id}" ${afford ? '' : 'disabled'}>+${w.pack}</button>
                </div>
                <div class="ammo-buy">
                  <span class="price${affordBig ? '' : ' na'}">${COIN} ${fmt(w.packBigPrice)}${save > 0 ? ` <em>−${save}%</em>` : ''}</span>
                  <button class="btn primary" data-ammobig="${w.id}" ${affordBig ? '' : 'disabled'}>+${w.packBig}</button>
                </div>
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
        const ch = e.target.closest('[data-char]');
        const am = e.target.closest('[data-ammo]');
        const amb = e.target.closest('[data-ammobig]');
        if (ch) {
          S().character = ch.dataset.char;   // a drawPlayer ezt olvassa (part-rig)
          ZD.save.persist();
          ZD.audio.play('click');
          api.refresh_armory();
        } else if (buy) {
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
        } else if (amb) {
          const w = C.WEAPONS.find((x) => x.id === amb.dataset.ammobig);
          if (S().coins >= w.packBigPrice) {
            S().coins -= w.packBigPrice;
            S().ammo[w.id] = (S().ammo[w.id] || 0) + w.packBig;
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
      screens.lab.querySelector('#lab-back').innerHTML = AIMG('back', 'aic-btn');
      $('#lab-title').textContent = T('lab.title');
      const list = $('#upglist');
      list.innerHTML = '';
      const COIN = AIMG('coin', 'coin-ic');
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
                ? `<span class="badge">${T('lo.max')}</span>`
                : `<span class="price${afford ? '' : ' na'}">${COIN} ${fmt(cost)}</span><button class="btn primary" data-upg="${u.id}" ${afford ? '' : 'disabled'}>${T('lab.upgrade')}</button>`}
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
      const s = S();
      const setTxt = (id, k) => { const e = $(id); if (e) e.textContent = T(k); };
      $('#set-back').innerHTML = AIMG('back', 'aic-btn');
      setTxt('#set-title', 'set.title');
      setTxt('#set-lang-l', 'set.language');
      setTxt('#set-sound-l', 'set.sound');
      setTxt('#set-savefile-l', 'set.saveFile');
      setTxt('#btn-savefile', 'set.download');
      setTxt('#set-loadfile-l', 'set.loadFile');
      setTxt('#btn-loadfile', 'set.chooseFile');
      setTxt('#set-sep', 'set.orCode');
      setTxt('#set-export-l', 'set.exportCode');
      setTxt('#btn-export', 'set.copy');
      setTxt('#set-import-l', 'set.importCode');
      setTxt('#btn-import', 'set.import');
      setTxt('#set-wipe-l', 'set.wipe');
      setTxt('#btn-reset', 'set.wipeBtn');
      $('#btn-sound').textContent = s.sound ? T('set.on') : T('set.off');
      screens.settings.querySelectorAll('.lang-opt').forEach((o) => o.classList.toggle('active', o.dataset.lang === (s.lang || 'en')));
      const hint = $('#backup-hint');
      if (hint) {
        hint.className = 'backup-hint ' + (s.everBackedUp ? 'ok' : 'warn');
        hint.textContent = T(s.everBackedUp ? 'set.backupOk' : 'set.backupWarn');
      }
    },

    refresh_title() {
      const s = S();
      const hasProgress = s.stages.unlocked > 1 || s.stages.cleared.length > 0;
      const curDay = C.dayOf(Math.min(s.stages.unlocked, C.STAGES));
      const btns = [];
      if (hasProgress) btns.push({ go: 'stages', primary: true, icon: 'play', label: T('menu.continue'), sub: T('menu.continueSub', { d: curDay }), cls: 'm-continue' });
      else btns.push({ go: 'stages', primary: true, icon: 'play', label: T('menu.newGame'), sub: T('menu.newGameSub'), cls: 'm-continue' });
      btns.push({ go: 'stages', icon: 'campaign', label: T('menu.campaign'), sub: T('menu.campaignSub'), cls: 'm-campaign' });
      btns.push({ action: 'scavenge', icon: 'scavenge', label: T('menu.scavenge'), sub: T('menu.scavengeSub'), cls: 'm-scavenge' });
      btns.push({ go: 'armory', icon: 'armory', label: T('menu.armory'), sub: T('menu.armorySub'), cls: 'm-armory' });
      btns.push({ go: 'lab', icon: 'lab', label: T('menu.lab'), sub: T('menu.labSub'), cls: 'm-lab' });
      btns.push({ go: 'settings', icon: 'settings', label: T('menu.settings'), sub: T('menu.settingsSub'), cls: 'm-settings' });
      $('#title-menu').innerHTML = btns.map((b) =>
        `<button class="menu-btn${b.primary ? ' primary' : ''} ${b.cls || ''}"${b.go ? ` data-go="${b.go}"` : ''}${b.action ? ` data-action="${b.action}"` : ''}>` +
          `<span class="mb-ic">${AIMG(b.icon)}</span>` +
          `<span class="mb-tx"><b>${b.label}</b><small>${b.sub}</small></span>` +
          `<span class="mb-arrow">${IC('chevron')}</span>` +
        '</button>').join('');
      $('#title-coin').innerHTML = `${AIMG('coin', 'coin-ic')}<b>${fmt(s.coins)}</b>`;
      $('#title-gear').innerHTML = AIMG('settings', 'aic-btn');
      $('#title-note').textContent = T('menu.note');
      const bb = $('#build-badge');
      if (bb) {
        bb.textContent = 'build ' + (ZD.BUILD || '?');
        /* háttérben: az AKTÍV SW-cache verziója (a tényleges kiszolgáló); ha eltér a
           betöltött buildtől, kiírjuk → a felhasználó látja, hogy régi cache ragadt be */
        if (window.caches && caches.keys) {
          caches.keys().then((ks) => {
            const sw = (ks || []).find((k) => /^zk-v/.test(k));
            const swv = sw ? sw.replace('zk-', '') : null;
            if (swv && swv !== (ZD.BUILD || '')) bb.textContent = 'build ' + ZD.BUILD + ' · cache ' + swv;
          }).catch(() => {});
        }
      }
      $('#title-save').innerHTML =
        `<span class="ts-ic">${IC('save')}</span>` +
        `<span class="ts-tx"><b>${T('menu.saveOk')}</b><small>${T('menu.saveLast')}</small></span>`;
    },

    /* háttér-helyreállítás után az épp látható képernyő frissítése */
    refreshActive() {
      Object.keys(screens).forEach((name) => {
        if (!screens[name].classList.contains('hidden')) {
          const re = 'refresh_' + name;
          if (api[re]) api[re]();
        }
      });
    },
  };

  /* ---------- modálok ---------- */
  function showPause() {
    $('#pause-title').textContent = T('pause.title');
    $('#btn-resume').textContent = T('pause.resume');
    $('#btn-quit').textContent = T('pause.quit');
    screens.pause.classList.remove('hidden');
  }
  function hidePause() { screens.pause.classList.add('hidden'); }

  /* reload-jelző villantása a fegyver-chipen (fegyverváltás/újratöltéskor) —
     önmagát törli, nem függ a frame-enkénti updateHud-tól */
  let reloadTimer = null;
  function flashReload(dur) {
    const chip = $('#weaponchip');
    if (!chip) return;
    chip.classList.remove('reloading');
    void chip.offsetWidth;               // animáció újraindítása
    chip.classList.add('reloading');
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => { chip.classList.remove('reloading'); reloadTimer = null; }, Math.max(120, dur * 1000));
  }

  function showResult(won, earned, bonus, stats, opts = {}) {
    const isFree = won === 'free';
    const w = won === true;
    $('#result-box').classList.toggle('win', w || isFree);
    $('#result-box').classList.toggle('lose', won === false);
    $('#result-icon').innerHTML = isFree ? AIMG('loot', 'aic-thumb') : w ? AIMG('done', 'aic-thumb') : AIMG('boss', 'aic-thumb');
    $('#result-title').textContent = isFree ? T('res.farmEnd') : w ? T('res.victory') : T('res.defeat');
    const statLine = stats
      ? `<span class="statline">${fmt(stats.kills)} ${T('res.statKills')} · ${fmt(stats.shots)} ${T('res.statShots')} · ${fmt(stats.dmg)} ${T('res.statDmg')}</span><br/>`
      : '';
    if (isFree) {
      $('#result-sub').innerHTML =
        `<span class="statline">${Math.round(opts.time || 0)} ${T('res.statSurv')} · ${fmt(opts.wave || 1)}. ${T('res.statWave')}</span><br/>`
        + statLine + `${T('res.timeBonus')}: ${AIMG('coin', 'coin-ic')} ${fmt(bonus)}`;
    } else {
      $('#result-sub').innerHTML = w
        ? `${statLine}${T('res.clearBonus')}: ${AIMG('coin', 'coin-ic')} ${fmt(bonus)}`
        : `${statLine}${T('res.lootKept')}<br/>${T('res.upgradeHint')}`;
    }
    $('#btn-next').textContent = isFree ? T('res.farmAgain') : w ? T('res.next') : T('res.tryAgain');
    $('#btn-retry').textContent = T('res.retry');
    $('#result-menu').textContent = T('res.mainmenu');
    $('#btn-retry').style.display = w ? '' : 'none';

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

  return Object.assign(api, { build, show, enterGame, updateHud, showPause, hidePause, showResult, flashReload });
})();
