/* Mentéskezelés — localStorage + IndexedDB tükör + fájl-export (robusztus) */
window.ZD = window.ZD || {};

ZD.save = (() => {
  const KEY = 'zombikronika_save_v1';
  const IDB_NAME = 'zombikronika';
  const IDB_STORE = 'save';
  const IDB_KEY = 'main';

  const defaults = () => ({
    coins: 0,
    character: 'farkas',   // választott játszható karakter (C.CHARACTERS id)
    weapons: { owned: ['pistol'], equipped: 'pistol' },
    ammo: {},          // fegyverenkénti perzisztens lőszerkészlet
    upg: { hp: 0, regen: 0, dmg: 0, crit: 0, speed: 0, gren: 0, luck: 0 },
    stages: { unlocked: 1, cleared: [] },
    sound: true,
    lang: 'en',          // UI nyelv: 'en' (alap) vagy 'hu'
    everBackedUp: false, // volt-e már fájl/kód biztonsági mentés
    _ts: 0,              // utolsó mentés időbélyege (a rétegek egyeztetéséhez)
  });

  /* régi mentés migrálása: ammo-mező pótlása a birtokolt fegyverekhez */
  function migrate(d) {
    /* régi mentésben nincs karakter, vagy időközben törölt id-t tárol */
    if (!d.character || !(ZD.C.CHARACTERS || []).some((c) => c.id === d.character)) d.character = 'farkas';
    if (!d.ammo || typeof d.ammo !== 'object') d.ammo = {};
    (d.weapons.owned || []).forEach((id) => {
      if (id === 'pistol') return;
      if (typeof d.ammo[id] !== 'number') {
        const def = ZD.C.WEAPONS.find((w) => w.id === id);
        d.ammo[id] = def ? def.ammo : 0;
      }
    });
    return d;
  }

  /* egy mentés „üres/alapállapot"-e (a helyreállítási döntéshez) */
  function isDefaultData(d) {
    if (!d) return true;
    const owned = (d.weapons && d.weapons.owned) || ['pistol'];
    const cleared = (d.stages && d.stages.cleared) || [];
    const unlocked = (d.stages && d.stages.unlocked) || 1;
    const upgSum = d.upg ? Object.values(d.upg).reduce((a, b) => a + (b || 0), 0) : 0;
    return (d.coins || 0) === 0 && owned.length <= 1 && cleared.length === 0 && unlocked <= 1 && upgSum === 0;
  }

  let data = defaults();

  /* ---------- IndexedDB tükör (másodlagos, robusztusabb tárréteg) ---------- */
  function idbOpen() {
    return new Promise((res, rej) => {
      try {
        if (!window.indexedDB) return rej('no-idb');
        const r = indexedDB.open(IDB_NAME, 1);
        r.onupgradeneeded = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  function idbPut(obj) {
    return idbOpen().then((db) => new Promise((res) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(JSON.parse(JSON.stringify(obj)), IDB_KEY);
        tx.oncomplete = () => res(true);
        tx.onerror = () => res(false);
      } catch (e) { res(false); }
    })).catch(() => false);
  }
  function idbGet() {
    return idbOpen().then((db) => new Promise((res) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const rq = tx.objectStore(IDB_STORE).get(IDB_KEY);
        rq.onsuccess = () => res(rq.result || null);
        rq.onerror = () => res(null);
      } catch (e) { res(null); }
    })).catch(() => null);
  }

  /* ---------- betöltés / mentés ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        data = Object.assign(defaults(), parsed);
        data.weapons = Object.assign(defaults().weapons, parsed.weapons || {});
        data.upg = Object.assign(defaults().upg, parsed.upg || {});
        data.stages = Object.assign(defaults().stages, parsed.stages || {});
        migrate(data);
      }
    } catch (e) {
      data = defaults();
    }
    if (window.ZD && ZD.i18n) ZD.i18n.setLang(data.lang || 'en');
    return data;
  }

  function persist() {
    data._ts = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* privát mód / tele tár */ }
    idbPut(data); // tűzd-és-felejtsd tükrözés a másodlagos rétegbe
  }

  /* böngésző kérése: ne törölje magától a tárhelyet (ITP/kilakoltatás elleni védelem) */
  function requestPersistent() {
    try {
      if (navigator.storage && navigator.storage.persist) return navigator.storage.persist().catch(() => false);
    } catch (e) { /* nincs API */ }
    return Promise.resolve(false);
  }

  /* boot után: ha a localStorage üres/alap, de az IndexedDB-ben van érdemi mentés,
     állítsuk vissza abból. (A localStorage-only törlést így túléli a haladás.) */
  function recover() {
    return idbGet().then((idb) => {
      if (!idb) return false;
      const idbReal = !isDefaultData(idb);
      const adopt = idbReal && (isDefaultData(data) || (idb._ts || 0) > (data._ts || 0));
      if (adopt) {
        data = migrate(Object.assign(defaults(), idb));
        data.weapons = Object.assign(defaults().weapons, idb.weapons || {});
        data.upg = Object.assign(defaults().upg, idb.upg || {});
        data.stages = Object.assign(defaults().stages, idb.stages || {});
        migrate(data);
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
        return true;
      }
      return false;
    }).catch(() => false);
  }

  function reset() {
    data = defaults();
    persist(); // mindkét réteget alapállapotba írja (nehogy a recover feltámassza)
  }

  /* ---------- export / import (szöveges kód) ---------- */
  function exportStr() {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }

  function importStr(str) {
    try {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(String(str).trim()))));
      if (typeof parsed.coins !== 'number' || !parsed.weapons) return false;
      data = migrate(Object.assign(defaults(), parsed));
      persist();
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- fájl-alapú biztonsági mentés (túléli a PWA törlését is) ---------- */
  function markBackedUp() {
    data.everBackedUp = true;
    persist();
  }

  function downloadBackup() {
    try {
      const code = exportStr();
      const stamp = new Date().toISOString().slice(0, 10);
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zombikronika-mentes-${stamp}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      markBackedUp();
      return true;
    } catch (e) { return false; }
  }

  function importFile(file) {
    return new Promise((res) => {
      try {
        const fr = new FileReader();
        fr.onload = () => res(importStr(String(fr.result || '')));
        fr.onerror = () => res(false);
        fr.readAsText(file);
      } catch (e) { res(false); }
    });
  }

  return {
    load,
    persist,
    reset,
    recover,
    requestPersistent,
    exportStr,
    importStr,
    downloadBackup,
    importFile,
    markBackedUp,
    get data() { return data; },
  };
})();
