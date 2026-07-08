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
    } else if (st.mode === 'free') {
      prog = st.waveQuota ? Math.min(1, st.waveKills / st.waveQuota) : 0;
      waveLabel = `${st.wave}. hullám`;
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
    /* meccs közbeni lőszervásárló gomb ára (pisztolynál ∞) */
    const ap = $('#ammoprice');
    if (ap) ap.textContent = w.def.id === 'pistol' ? '∞' : fmt(Math.ceil(w.def.packPrice * C.AMMO_EMERGENCY));
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

    /* Pályaválasztó — DAY-alapú campaign board */
    screens.stages = el(`
      <div class="screen stages-screen" id="s-stages">
        <div class="topbar">
          <button class="btn backbtn" data-go="title">←</button>
          <h2>TÚLÉLŐNAPLÓ</h2>
          <span class="coins">🪙 <span data-coins></span></span>
        </div>
        <div class="day-strip-wrap">
          <button class="day-arrow" id="day-prev" aria-label="előző nap">◀</button>
          <div class="day-strip" id="day-strip"></div>
          <button class="day-arrow" id="day-next" aria-label="következő nap">▶</button>
        </div>
        <div class="day-board" id="day-board"></div>
        <button class="scavenge-btn" id="btn-freemode">
          <span class="sv-ic">📦</span>
          <span class="sv-tx">SCAVENGE ZÓNA<small>Supply run — érme-farm · nem old fel napot</small></span>
        </button>
        <div class="stage-preview hidden" id="stage-preview">
          <div class="sp-card" id="sp-card">
            <button class="sp-close" id="sp-close">✕</button>
            <div class="sp-top">
              <span class="sp-badge" id="sp-badge"></span>
              <div class="sp-head">
                <span class="sp-status" id="sp-status"></span>
                <span class="sp-day" id="sp-day"></span>
                <h3 id="sp-title"></h3>
                <span class="sp-mode" id="sp-mode"></span>
              </div>
            </div>
            <div class="sp-obj" id="sp-obj"></div>
            <p class="sp-desc" id="sp-desc"></p>
            <div class="sp-danger" id="sp-danger"></div>
            <div class="sp-grid" id="sp-grid"></div>
            <div class="sp-locked hidden" id="sp-locked"></div>
            <button class="btn primary sp-start" id="sp-start">INDULÁS ▶</button>
          </div>
        </div>
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
          <div class="backup-hint" id="backup-hint"></div>
          <div class="settingsrow"><span>💾 Mentés fájlba</span><button class="btn primary" id="btn-savefile">LETÖLTÉS ↓</button></div>
          <div class="settingsrow"><span>📂 Betöltés fájlból</span><button class="btn" id="btn-loadfile">FÁJL VÁLASZTÁSA</button></div>
          <input type="file" id="file-input" accept=".txt,.json,text/plain,application/json" style="display:none" />
          <div class="settings-sep">— vagy kód másolással —</div>
          <div class="settingsrow"><span>Mentés-kód exportálása</span><button class="btn" id="btn-export">MÁSOLÁS IDE ↓</button></div>
          <textarea class="save-io" id="save-io" placeholder="Export: ide kerül a mentéskód (jelöld ki és másold). Import: illeszd be a kódot, majd IMPORTÁLÁS."></textarea>
          <div class="settingsrow"><span>Mentés-kód importálása</span><button class="btn" id="btn-import">IMPORTÁLÁS</button></div>
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
      if (ok) api.refresh_settings();
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
        $('#save-io').value = ok ? '✔ Mentés betöltve fájlból!' : '✖ Érvénytelen mentésfájl.';
        api.refresh_settings();
        e.target.value = '';
      });
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

    /* Scavenge / Free Mode — külön briefing panel */
    $('#btn-freemode').addEventListener('click', () => {
      ZD.audio.play('click');
      showBriefing('free');
    });
    /* nap-lapozó nyilak */
    $('#day-prev').addEventListener('click', () => navDay(-1));
    $('#day-next').addEventListener('click', () => navDay(1));
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
    const M = C.MODES[mode];
    $('#lo-title').textContent = isFree ? `${M.icon} ${M.name}` : `${level}. PÁLYA ${M.icon ? '· ' + M.icon + ' ' + M.name : ''}`;
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
    const need = isFree ? 80 : 90 + level * 16;
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

  /* ---------- DAY-alapú campaign board ---------- */
  const DIFF_LABELS = ['—', 'Alacsony', 'Mérsékelt', 'Magas', 'Súlyos', 'Kritikus'];
  const THEME_NAMES = ['Elhagyott utca', 'Labor-bunker', 'Romos város'];
  const LOC_GLYPH = ['🏙', '⚗', '🏚'];
  const THEME_FLAVOR = [
    'Kihalt utcák, felborult autók, pislákoló lámpák — a horda a sötétből jön.',
    'Zárt labor-folyosók és tartályok. A fertőzés forrása valahol idelent lüktet.',
    'Beomlott házak, parázsló romok. A túlélők rég elhagyták ezt a negyedet.',
  ];
  const OBJECTIVE = {
    survival: 'tisztítsd meg a területet — irtsd ki az összes fertőzöttet.',
    defense: 'védd meg a generátort a hordától.',
    survive: 'tartsd magad a kijelölt ideig — a horda nem fogy el.',
    elite: 'vadászd le az elit célpontokat — dupla zsákmány.',
    boss: 'semmisítsd meg a fertőzés forrását — a Vezért.',
    free: 'gyűjts ellátmányt és érmét, ameddig bírod.',
  };
  let curDay = 1;

  function recommendedWeapon(level) {
    const tiers = [['uzi', 3], ['shotgun', 6], ['rifle', 12], ['minigun', 28], ['laser', 60], ['rocket', 100]];
    let pick = 'uzi';
    for (const [id, upTo] of tiers) { pick = id; if (level <= upTo) break; }
    const w = C.WEAPONS.find((x) => x.id === pick);
    return w ? w.name : 'Vipera SMG';
  }

  function modeGlyph(mode, theme) {
    return mode === 'boss' ? '☠' : mode === 'defense' ? '🛡' : mode === 'elite' ? '⭐' : mode === 'survive' ? '⏱' : LOC_GLYPH[theme];
  }
  function modeLabel(mode) {
    return mode === 'boss' ? '☠ vezér' : mode === 'defense' ? '🛡 védelem' : mode === 'elite' ? '⭐ elit' : mode === 'survive' ? '⏱ túlélés' : '🏙 irtás';
  }

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

  function markStripSel() {
    $('#day-strip').querySelectorAll('.day-tab').forEach((t) => t.classList.toggle('sel', +t.dataset.day === curDay));
  }
  function scrollStripToSel(smooth) {
    const sel = $('#day-strip').querySelector('.day-tab.sel');
    if (sel) sel.scrollIntoView({ inline: 'center', block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
  }

  /* DAY selector strip — legalább ACTIVE_DAYS nap, vízszintes lapozható */
  function buildDayStrip() {
    const strip = $('#day-strip');
    strip.innerHTML = '';
    for (let d = 1; d <= C.CAMPAIGN.ACTIVE_DAYS; d++) {
      const st = dayStateOf(d);
      const cls = st.locked ? 'is-locked' : st.cleared ? 'is-cleared' : st.isCurrent ? 'is-current' : 'is-open';
      const b = document.createElement('button');
      b.className = `day-tab ${cls}${d === curDay ? ' sel' : ''}`;
      b.dataset.day = d;
      b.innerHTML =
        `<span class="dt-num">DAY ${String(d).padStart(2, '0')}</span>` +
        `<span class="dt-name">${C.dayName(d)}</span>` +
        `<span class="dt-badge">${st.locked ? '🔒 zárt' : st.cleared ? '✔ biztosítva' : '► aktív'}</span>`;
      b.addEventListener('click', () => {
        ZD.audio.play('click');
        curDay = d;
        renderDayBoard(d);
        markStripSel();
        scrollStripToSel(true);
      });
      strip.appendChild(b);
    }
    requestAnimationFrame(() => scrollStripToSel(false));
  }

  function navDay(dir) {
    const nd = Math.max(1, Math.min(C.CAMPAIGN.ACTIVE_DAYS, curDay + dir));
    if (nd === curDay) return;
    curDay = nd;
    ZD.audio.play('click');
    renderDayBoard(curDay);
    markStripSel();
    scrollStripToSel(true);
  }

  /* DAY board — 5 mission helyszín (4 kártya + finálé), nem node-lánc */
  function renderDayBoard(day) {
    const board = $('#day-board');
    const st = dayStateOf(day);
    const theme = C.themeFor(C.levelOf(day, 1));
    board.className = `day-board tz${theme}`;

    let done5 = 0;
    for (let m = 1; m <= C.CAMPAIGN.MISSIONS_PER_DAY; m++) {
      if (S().stages.cleared.includes(C.levelOf(day, m))) done5++;
    }
    const dots = Array.from({ length: C.CAMPAIGN.MISSIONS_PER_DAY }, (_, i) => `<i class="${i < done5 ? 'on' : ''}"></i>`).join('');
    const statusTxt = st.cleared ? '✔ BIZTOSÍTVA' : st.locked ? '🔒 ZÁRT NAP' : `${done5}/5 biztosítva`;

    let html =
      '<div class="db-head">' +
        `<div class="db-title"><span class="db-day">DAY ${String(day).padStart(2, '0')}</span>` +
        `<span class="db-name">${C.dayName(day).toUpperCase()}</span>` +
        `<span class="db-theme">${THEME_NAMES[theme]}</span></div>` +
        `<div class="db-prog"><span class="db-dots">${dots}</span><span class="db-status">${statusTxt}</span></div>` +
      '</div><div class="db-missions">';

    for (let m = 1; m < C.CAMPAIGN.MISSIONS_PER_DAY; m++) {
      const lvl = C.levelOf(day, m);
      const ms = missionStateOf(lvl);
      const mode = C.modeFor(lvl);
      const mod = C.modFor(lvl);
      const glyph = ms === 'done' ? '✔' : ms === 'locked' ? '🔒' : modeGlyph(mode, C.themeFor(lvl));
      html +=
        `<button class="mission-card m-${mode} is-${ms}" data-level="${lvl}">` +
          `<div class="mc-scene"><span class="mc-glyph">${glyph}</span>${mod ? `<span class="mc-mod">${C.MODS[mod].icon}</span>` : ''}</div>` +
          `<div class="mc-info"><span class="mc-idx">Mission ${m}/${C.CAMPAIGN.MISSIONS_PER_DAY}</span>` +
          `<span class="mc-name">${C.missionTitle(lvl)}</span><span class="mc-type">${modeLabel(mode)}</span></div>` +
          `<span class="mc-badge">${ms === 'current' ? '►' : ms === 'done' ? '✔' : ms === 'locked' ? '🔒' : '·'}</span>` +
        '</button>';
    }

    const flvl = C.levelOf(day, C.CAMPAIGN.MISSIONS_PER_DAY);
    const fs = missionStateOf(flvl);
    html +=
      `<button class="finale-card is-${fs}" data-level="${flvl}">` +
        `<span class="fc-glyph">${fs === 'done' ? '✔' : fs === 'locked' ? '🔒' : '☠'}</span>` +
        `<div class="fc-info"><span class="fc-tag">DAY ${String(day).padStart(2, '0')} FINALE · BOSS</span>` +
        `<span class="fc-name">${C.missionTitle(flvl)}</span></div>` +
        `<span class="fc-go">${fs === 'locked' ? 'ZÁRT' : fs === 'done' ? 'ÚJRA' : 'BOSS ►'}</span>` +
      '</button></div>';

    board.innerHTML = html;
    board.querySelectorAll('[data-level]').forEach((el) => {
      el.addEventListener('click', () => { ZD.audio.play('click'); showBriefing(+el.dataset.level); });
    });
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

  /* mission briefing panel (bottom-sheet) */
  function showBriefing(level) {
    const d = previewData(level);
    const M = C.MODES[d.mode];
    const pv = $('#stage-preview');
    $('#sp-card').className = 'sp-card' + (d.boss ? ' n-boss' : d.isFree ? ' n-free' : '');

    const badge = $('#sp-badge');
    badge.className = 'sp-badge n-' + d.mode;
    badge.textContent = d.isFree ? '📦' : modeGlyph(d.mode, d.theme);

    const stc = $('#sp-status');
    if (d.isFree) { stc.className = 'sp-status farm'; stc.textContent = '📦 FARM ZÓNA'; }
    else if (d.locked) { stc.className = 'sp-status locked'; stc.textContent = '🔒 ZÁRT'; }
    else if (d.done) { stc.className = 'sp-status done'; stc.textContent = '✔ TELJESÍTVE'; }
    else if (d.next) { stc.className = 'sp-status next'; stc.textContent = '► KÖVETKEZŐ'; }
    else { stc.className = 'sp-status next'; stc.textContent = 'ELÉRHETŐ'; }

    const dayEl = $('#sp-day');
    if (d.isFree) {
      dayEl.textContent = 'KÜLÖN MÓD · nem kampány';
    } else {
      const day = C.dayOf(level);
      const m = C.missionInDay(level);
      dayEl.textContent = `DAY ${String(day).padStart(2, '0')} — ${C.dayName(day).toUpperCase()} · ${d.boss ? 'FINALE' : `Mission ${m}/${C.CAMPAIGN.MISSIONS_PER_DAY}`} · pálya #${level}`;
    }

    $('#sp-title').textContent = d.isFree ? 'SCAVENGE ZÓNA' : C.missionTitle(level);
    $('#sp-mode').textContent = d.isFree
      ? 'Supply run · végtelen farm'
      : `${M.name}${d.mod ? ` · ${C.MODS[d.mod].icon} ${C.MODS[d.mod].name}` : ''}`;

    $('#sp-obj').innerHTML = `<b>Objektíva:</b> ${OBJECTIVE[d.mode]}`;

    $('#sp-desc').innerHTML = d.isFree
      ? 'Gyűjts ellátmányt és érmét, ameddig bírod. Nem old fel új napot vagy kampánymissziót — a zsákmány mentésbe kerül.'
      : d.boss
        ? '⚠ A nap végső fészke. A Vezér telegrafált földcsapással támad — térj ki, majd tüzelj a fázisváltások között.'
        : THEME_FLAVOR[d.theme] + (d.mod ? `<br/><span class="lo-mod">${C.MODS[d.mod].icon} ${C.MODS[d.mod].desc}</span>` : '');

    const dangerPct = d.isFree ? 42 : (d.diff / 5) * 100;
    const dangerCol = d.isFree ? 'var(--amber)' : d.diff <= 2 ? 'var(--green)' : d.diff <= 3 ? 'var(--amber)' : 'var(--red)';
    $('#sp-danger').innerHTML =
      '<span>VESZÉLY</span>' +
      `<div class="dbar"><i class="dfill" style="width:${dangerPct}%;background:${dangerCol}"></i></div>` +
      `<b>${d.isFree ? '∞' : DIFF_LABELS[d.diff]}</b>`;

    const rows = [];
    if (d.isFree) {
      rows.push(['Zsákmány', '🪙 kill + hullám + túlélési idő']);
      rows.push(['Ajánlott', 'Gyors tempójú fegyver + tartalék lőszer']);
      rows.push(['Jelleg', 'Nem kampány — nem old fel napot']);
    } else {
      rows.push(['Helyszín', THEME_NAMES[d.theme]]);
      rows.push(['Várható zsákmány', '~🪙 ' + fmt(d.reward)]);
      rows.push(['Ajánlott fegyver', recommendedWeapon(level)]);
      if (d.mod) rows.push(['Módosító', `${C.MODS[d.mod].icon} ${C.MODS[d.mod].name}`]);
    }
    $('#sp-grid').innerHTML = rows.map(([k, v]) =>
      `<div class="sp-row"><span>${k}</span><b>${v}</b></div>`).join('')
      + (d.isFree ? '' : `<div class="sp-ready ${d.ready ? 'ok' : 'risk'}">${d.ready ? '✔ FELKÉSZÜLVE' : '⚠ AJÁNLOTT FEJLESZTENI / LŐSZERT VENNI'}</div>`);

    const lk = $('#sp-locked');
    const start = $('#sp-start');
    if (d.locked) {
      lk.classList.remove('hidden');
      lk.innerHTML = C.missionInDay(level) === 1
        ? '🔒 Zárt — előbb biztosítsd az előző nap fináléját.'
        : '🔒 Zárt — előbb teljesítsd az előző missziót ezen a napon.';
      start.classList.add('hidden');
    } else {
      lk.classList.add('hidden');
      start.classList.remove('hidden');
      start.textContent = d.isFree ? '📦 FARM INDÍTÁSA' : d.boss ? '☠ FINALE INDÍTÁSA' : d.done ? '↻ ÚJRA' : '► BEVETÉS';
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
      curDay = currentDay();
      buildDayStrip();
      renderDayBoard(curDay);
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
          const affordBig = S().coins >= w.packBigPrice;
          /* nagy csomag mennyiségi kedvezménye (%) */
          const save = Math.round((1 - (w.packBigPrice / w.packBig) / (w.packPrice / w.pack)) * 100);
          const item = el(`
            <div class="card acard" data-id="ammo-${w.id}">
              <div class="wicon"><img alt="" src="${wIcon(w)}" /></div>
              <div class="wname">${w.name}</div>
              <div class="apool${low ? ' low' : ''}">Készlet: <b>${fmt(pool)}</b> lövés${low ? ' ⚠' : ''}</div>
              <div class="ammo-buys">
                <div class="ammo-buy">
                  <span class="price${afford ? '' : ' na'}">🪙 ${fmt(w.packPrice)}</span>
                  <button class="btn" data-ammo="${w.id}" ${afford ? '' : 'disabled'}>+${w.pack}</button>
                </div>
                <div class="ammo-buy">
                  <span class="price${affordBig ? '' : ' na'}">🪙 ${fmt(w.packBigPrice)}${save > 0 ? ` <em>−${save}%</em>` : ''}</span>
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
        const am = e.target.closest('[data-ammo]');
        const amb = e.target.closest('[data-ammobig]');
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
      const hint = $('#backup-hint');
      if (hint) {
        if (S().everBackedUp) {
          hint.className = 'backup-hint ok';
          hint.innerHTML = '✔ Van fájl-mentésed. A haladás böngészőben tárolódik + IndexedDB-tükör; a <b>fájl</b> a legbiztosabb — tartsd frissen.';
        } else {
          hint.className = 'backup-hint warn';
          hint.innerHTML = '⚠ Nincs még biztonsági mentésed! A haladásod a böngészőben van — ha törlöd a PWA-t vagy a böngészőadatot, elveszhet. <b>Mentsd fájlba</b> és tedd biztos helyre (Fájlok app).';
        }
      }
    },

    refresh_title() {},

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
  function showPause() { screens.pause.classList.remove('hidden'); }
  function hidePause() { screens.pause.classList.add('hidden'); }

  function showResult(won, earned, bonus, stats, opts = {}) {
    const isFree = won === 'free';
    const w = won === true;
    $('#result-box').classList.toggle('win', w || isFree);
    $('#result-box').classList.toggle('lose', won === false);
    $('#result-icon').textContent = isFree ? '♾' : w ? '🏅' : '☠';
    $('#result-title').textContent = isFree ? 'FARM VÉGE' : w ? 'PÁLYA TELJESÍTVE' : 'ELESTÉL';
    const statLine = stats
      ? `<span class="statline">☠ ${fmt(stats.kills)} kiiktatva · 🔫 ${fmt(stats.shots)} lövés · 💥 ${fmt(stats.dmg)} sebzés</span><br/>`
      : '';
    if (isFree) {
      $('#result-sub').innerHTML =
        `<span class="statline">⏱ ${Math.round(opts.time || 0)} mp túlélés · ♾ ${fmt(opts.wave || 1)}. hullám</span><br/>`
        + statLine + `Idő-bónusz: 🪙 ${fmt(bonus)}`;
    } else {
      $('#result-sub').innerHTML = w
        ? `${statLine}Teljesítési bónusz: 🪙 ${fmt(bonus)}`
        : `${statLine}A zsákmányod megmarad.<br/>Fejlessz a laborban, és próbáld újra!`;
    }
    $('#btn-next').textContent = isFree ? '♾ ÚJRA FARM' : w ? 'KÖVETKEZŐ PÁLYA ▶' : 'ÚJRA PRÓBÁLOM';
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

  return Object.assign(api, { build, show, enterGame, updateHud, showPause, hidePause, showResult });
})();
