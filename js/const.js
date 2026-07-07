/* Zombi Krónika — játékadatok és balansz */
window.ZD = window.ZD || {};

ZD.C = {
  VIEW_W: 480,
  VIEW_H: 270,
  RS: 2,             // render-skála: canvas 960×540, logika 480×270 marad
  GROUND_Y: 234,
  WORLD_W: 1040,
  GRAVITY: 620,
  STAGES: 40,

  /* pályatéma: 5 pályánként váltakozik (utca → labor → romváros) */
  themeFor(level) { return Math.floor((level - 1) / 5) % 3; },

  /* pályamódok — determinisztikus kiosztás */
  MODES: {
    survival: { name: 'IRTÁS',         icon: '',   desc: 'Öld meg az összes zombit!' },
    defense:  { name: 'VÉDELEM',       icon: '🛡', desc: 'Védd meg a generátort!' },
    elite:    { name: 'ELIT VADÁSZAT', icon: '⭐', desc: 'Kevesebb, de erős célpont — dupla zsákmány!' },
    boss:     { name: 'VEZÉR',         icon: '☠',  desc: 'Győzd le a vezért!' },
  },
  modeFor(level) {
    if (this.isBossLevel(level)) return 'boss';
    const m = level % 5;
    if (m === 2 && level > 6) return 'defense';
    if (m === 4 && level > 4) return 'elite';
    return 'survival';
  },

  /* pálya-módosítók — nem minden pályán, determinisztikusan */
  MODS: {
    fast:  { name: 'GYORS HORDA', icon: '⚡', desc: '+25% zombisebesség' },
    dark:  { name: 'SÖTÉTSÉG',    icon: '🌑', desc: 'Rossz látási viszonyok' },
    gold:  { name: 'ARANYLÁZ',    icon: '💰', desc: 'Dupla érme' },
    horde: { name: 'HORDA',       icon: '👥', desc: '+40% zombi, sűrűbb spawn' },
  },
  modFor(level) {
    if (level <= 5 || this.isBossLevel(level)) return null;
    const h = (level * 2654435761) >>> 0;
    if (h % 100 < 42) return ['fast', 'dark', 'gold', 'horde'][h % 4];
    return null;
  },

  /* védendő generátor (defense mód) */
  GENERATOR: { hp0: 320, hpPer: 26, w: 34 },

  PLAYER: { w: 18, h: 38, speed: 110, baseHp: 100 },

  /* Fegyverek — ammo: kezdő lőszer (perzisztens pool), -1 = végtelen.
     kb: találati visszalökés, flashScale: torkolattűz méret,
     pack/packPrice: lőszercsomag a boltban */
  WEAPONS: [
    { id: 'pistol',  name: 'M9 Pisztoly',       dmg: 13,  rps: 3,    spd: 520,  pellets: 1, spread: 0.012, ammo: -1,  price: 0,     kind: 'bullet', color: '#ffe9a8', shake: 0.5, casing: 1, kb: 14, flashScale: 0.9 },
    { id: 'uzi',     name: 'Vipera SMG',        dmg: 8,   rps: 10,   spd: 540,  pellets: 1, spread: 0.055, ammo: 260, price: 900,   kind: 'bullet', color: '#ffe9a8', shake: 0.6, casing: 1, kb: 9,  flashScale: 0.8, pack: 130, packPrice: 250 },
    { id: 'shotgun', name: 'Őrszem Sörétes',    dmg: 9,   rps: 1.3,  spd: 480,  pellets: 6, spread: 0.13,  ammo: 48,  price: 2600,  kind: 'bullet', color: '#ffd27a', shake: 2.6, casing: 1, kb: 30, flashScale: 1.5, pack: 30,  packPrice: 420 },
    { id: 'rifle',   name: 'AK Farkas',         dmg: 22,  rps: 6,    spd: 640,  pellets: 1, spread: 0.03,  ammo: 200, price: 7000,  kind: 'bullet', color: '#ffe9a8', shake: 1.1, casing: 1, kb: 18, flashScale: 1.1, pack: 90,  packPrice: 750 },
    { id: 'flamer',  name: 'Sárkány Lángszóró', dmg: 5,   rps: 18,   spd: 230,  pellets: 1, spread: 0.10,  ammo: 420, price: 14000, kind: 'flame',  color: '#ff9a3d', range: 105, shake: 0.25, kb: 4, flashScale: 0, pack: 210, packPrice: 900 },
    { id: 'minigun', name: 'Cerberus Minigun',  dmg: 15,  rps: 15,   spd: 600,  pellets: 1, spread: 0.06,  ammo: 600, price: 30000, kind: 'bullet', color: '#ffe9a8', shake: 1.4, casing: 1, kb: 14, flashScale: 1.3, pack: 300, packPrice: 2400 },
    { id: 'rocket',  name: 'RPG Vulkán',        dmg: 130, rps: 0.9,  spd: 330,  pellets: 1, spread: 0.01,  ammo: 18,  price: 52000, kind: 'rocket', color: '#ffb066', splash: 82, shake: 3, kb: 0, flashScale: 1.6, pack: 6, packPrice: 2600 },
    { id: 'laser',   name: 'Ion Lézer',         dmg: 34,  rps: 4.5,  spd: 1300, pellets: 1, spread: 0.005, ammo: 140, price: 90000, kind: 'laser',  color: '#7de0ff', pierce: 99, shake: 1.2, kb: 20, flashScale: 1.2, pack: 70, packPrice: 4200 },
  ],

  /* Zombik — speed: [min,max], coin: alap érme-érték (méretek ~1.3×, hitbox = látvány) */
  ZOMBIES: {
    walker:  { hp: 42,   dmg: 9,  speed: [24, 34], coin: 6,   w: 21, h: 39, reach: 20, atkCd: 1.0 },
    runner:  { hp: 24,   dmg: 7,  speed: [70, 92], coin: 7,   w: 18, h: 36, reach: 18, atkCd: 0.8 },
    crawler: { hp: 34,   dmg: 8,  speed: [42, 58], coin: 8,   w: 26, h: 17, reach: 19, atkCd: 0.9 },
    spitter: { hp: 48,   dmg: 11, speed: [20, 28], coin: 12,  w: 21, h: 40, reach: 20, atkCd: 2.2, range: 250 },
    brute:   { hp: 260,  dmg: 24, speed: [16, 22], coin: 35,  w: 31, h: 49, reach: 28, atkCd: 1.4 },
    boss:    { hp: 1500, dmg: 34, speed: [20, 26], coin: 300, w: 48, h: 67, reach: 42, atkCd: 1.8 },
  },

  /* Melyik szinttől jelenik meg az adott típus, súlyozva */
  spawnTable(level) {
    const t = [['walker', 10]];
    if (level >= 2) t.push(['runner', 4 + Math.min(level, 8)]);
    if (level >= 4) t.push(['crawler', 3 + Math.min(level, 6)]);
    if (level >= 6) t.push(['spitter', 2 + Math.min(level, 5)]);
    if (level >= 8) t.push(['brute', 1 + Math.floor(level / 6)]);
    return t;
  },

  /* Szint-skálázás — érezhető, de tanulható nehézségi ív */
  hpMul(level) { return 1 + 0.16 * (level - 1); },
  dmgMul(level) { return 1 + 0.10 * (level - 1); },
  coinMul(level) { return 1 + 0.10 * (level - 1); },
  quota(level) { return 10 + 4 * level; },
  cap(level) { return Math.min(3 + Math.floor(level / 2), 11); },
  spawnInterval(level) { return Math.max(0.45, 1.6 - level * 0.04); },
  isBossLevel(level) { return level % 5 === 0; },
  clearBonus(level) { return 50 + 28 * level; },

  /* Fejlesztések (labor) */
  UPGRADES: [
    { id: 'hp',    name: 'Életerő',     desc: '+22 max HP',              per: 22,   max: 20, cost0: 250, mul: 1.33 },
    { id: 'regen', name: 'Regeneráció', desc: '+0,5 HP/mp',              per: 0.5,  max: 12, cost0: 500, mul: 1.4 },
    { id: 'dmg',   name: 'Sebzés',      desc: '+6% fegyversebzés',       per: 0.06, max: 20, cost0: 400, mul: 1.36 },
    { id: 'crit',  name: 'Kritikus',    desc: '+2% krit. esély (2x)',    per: 0.02, max: 15, cost0: 600, mul: 1.4 },
    { id: 'speed', name: 'Sebesség',    desc: '+4% mozgás',              per: 0.04, max: 10, cost0: 450, mul: 1.48 },
    { id: 'gren',  name: 'Gránátok',    desc: '+1 gránát / bevetés',     per: 1,    max: 6,  cost0: 800, mul: 1.55 },
    { id: 'luck',  name: 'Érme bónusz', desc: '+5% érme',                per: 0.05, max: 10, cost0: 700, mul: 1.45 },
  ],
  upgCost(u, lvl) { return Math.round(u.cost0 * Math.pow(u.mul, lvl)); },

  GRENADE: { dmg: 210, radius: 88, baseCount: 2 },
};
