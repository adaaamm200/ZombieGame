/* Mentéskezelés — localStorage */
window.ZD = window.ZD || {};

ZD.save = (() => {
  const KEY = 'zombikronika_save_v1';

  const defaults = () => ({
    coins: 0,
    weapons: { owned: ['pistol'], equipped: 'pistol' },
    ammo: {},          // fegyverenkénti perzisztens lőszerkészlet
    upg: { hp: 0, regen: 0, dmg: 0, crit: 0, speed: 0, gren: 0, luck: 0 },
    stages: { unlocked: 1, cleared: [] },
    sound: true,
  });

  /* régi mentés migrálása: ammo-mező pótlása a birtokolt fegyverekhez */
  function migrate(d) {
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

  let data = defaults();

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
    return data;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* tele a tár / privát mód — a játék attól még fut */
    }
  }

  function reset() {
    data = defaults();
    persist();
  }

  function exportStr() {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }

  function importStr(str) {
    try {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
      if (typeof parsed.coins !== 'number' || !parsed.weapons) return false;
      data = migrate(Object.assign(defaults(), parsed));
      persist();
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    load,
    persist,
    reset,
    exportStr,
    importStr,
    get data() { return data; },
  };
})();
