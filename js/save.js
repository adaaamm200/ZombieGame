/* Mentéskezelés — localStorage */
window.ZD = window.ZD || {};

ZD.save = (() => {
  const KEY = 'zombikronika_save_v1';

  const defaults = () => ({
    coins: 0,
    weapons: { owned: ['pistol'], equipped: 'pistol' },
    upg: { hp: 0, regen: 0, dmg: 0, crit: 0, speed: 0, gren: 0, luck: 0 },
    stages: { unlocked: 1, cleared: [] },
    sound: true,
  });

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
      data = Object.assign(defaults(), parsed);
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
