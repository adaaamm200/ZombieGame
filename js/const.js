/* Zombi Krónika — játékadatok és balansz */
window.ZD = window.ZD || {};

ZD.C = {
  VIEW_W: 480,
  VIEW_H: 270,
  GROUND_Y: 234,
  WORLD_W: 1040,
  GRAVITY: 620,
  STAGES: 40,

  PLAYER: { w: 14, h: 30, speed: 110, baseHp: 100 },

  /* Fegyverek — ammo: -1 = végtelen, kind: bullet|flame|rocket|laser */
  WEAPONS: [
    { id: 'pistol',  name: 'M9 Pisztoly',       dmg: 13,  rps: 3,    spd: 520,  pellets: 1, spread: 0.012, ammo: -1,  price: 0,     kind: 'bullet', color: '#ffe9a8' },
    { id: 'uzi',     name: 'Vipera SMG',        dmg: 8,   rps: 10,   spd: 540,  pellets: 1, spread: 0.055, ammo: 260, price: 900,   kind: 'bullet', color: '#ffe9a8' },
    { id: 'shotgun', name: 'Őrszem Sörétes',    dmg: 9,   rps: 1.3,  spd: 480,  pellets: 6, spread: 0.13,  ammo: 48,  price: 2600,  kind: 'bullet', color: '#ffd27a' },
    { id: 'rifle',   name: 'AK Farkas',         dmg: 22,  rps: 6,    spd: 640,  pellets: 1, spread: 0.03,  ammo: 200, price: 7000,  kind: 'bullet', color: '#ffe9a8' },
    { id: 'flamer',  name: 'Sárkány Lángszóró', dmg: 5,   rps: 18,   spd: 230,  pellets: 1, spread: 0.10,  ammo: 420, price: 14000, kind: 'flame',  color: '#ff9a3d', range: 105 },
    { id: 'minigun', name: 'Cerberus Minigun',  dmg: 15,  rps: 15,   spd: 600,  pellets: 1, spread: 0.06,  ammo: 600, price: 30000, kind: 'bullet', color: '#ffe9a8' },
    { id: 'rocket',  name: 'RPG Vulkán',        dmg: 130, rps: 0.9,  spd: 330,  pellets: 1, spread: 0.01,  ammo: 18,  price: 52000, kind: 'rocket', color: '#ffb066', splash: 82 },
    { id: 'laser',   name: 'Ion Lézer',         dmg: 34,  rps: 4.5,  spd: 1300, pellets: 1, spread: 0.005, ammo: 140, price: 90000, kind: 'laser',  color: '#7de0ff', pierce: 99 },
  ],

  /* Zombik — speed: [min,max], coin: alap érme-érték */
  ZOMBIES: {
    walker:  { hp: 42,   dmg: 9,  speed: [24, 34], coin: 6,   w: 16, h: 30, reach: 16, atkCd: 1.0 },
    runner:  { hp: 24,   dmg: 7,  speed: [64, 84], coin: 7,   w: 14, h: 28, reach: 14, atkCd: 0.8 },
    crawler: { hp: 34,   dmg: 8,  speed: [40, 54], coin: 8,   w: 20, h: 13, reach: 15, atkCd: 0.9 },
    spitter: { hp: 48,   dmg: 11, speed: [20, 28], coin: 12,  w: 16, h: 31, reach: 16, atkCd: 2.2, range: 250 },
    brute:   { hp: 260,  dmg: 24, speed: [16, 22], coin: 35,  w: 24, h: 38, reach: 22, atkCd: 1.4 },
    boss:    { hp: 1500, dmg: 34, speed: [20, 26], coin: 300, w: 40, h: 56, reach: 34, atkCd: 1.8 },
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

  /* Szint-skálázás */
  hpMul(level) { return 1 + 0.16 * (level - 1); },
  dmgMul(level) { return 1 + 0.09 * (level - 1); },
  coinMul(level) { return 1 + 0.10 * (level - 1); },
  quota(level) { return 10 + 4 * level; },
  cap(level) { return Math.min(3 + Math.floor(level / 2), 9); },
  spawnInterval(level) { return Math.max(0.55, 1.7 - level * 0.035); },
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
