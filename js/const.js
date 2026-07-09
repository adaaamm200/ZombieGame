/* ZombieChronicles — játékadatok és balansz */
window.ZD = window.ZD || {};

/* Betöltött build-verzió (a főmenü sarkában látszik). BUMPOLD az sw.js VERSION-nel együtt!
   Ha a telefonon régi számot látsz → a régi cache ragadt be (töröld a webhelyadatot). */
ZD.BUILD = 'v32';

ZD.C = {
  VIEW_W: 480,
  VIEW_H: 270,
  RS: 2,             // render-skála: canvas 960×540, logika 480×270 marad
  ZOOM: 1.75,        // kamera-nagyítás: a karakterek ~2× nagyobbak a képernyőn,
                     // a játéklogika és a balansz érintetlen marad
  GROUND_Y: 234,
  WORLD_W: 1040,
  GRAVITY: 620,
  STAGES: 100,        // = CAMPAIGN.ACTIVE_DAYS × MISSIONS_PER_DAY (20 nap × 5 misszió)

  /* meccs közbeni (emergency) lőszervásárlás felára a bolti kis-pack árához képest */
  AMMO_EMERGENCY: 1.25,

  /* pályatéma: 5 pályánként váltakozik (utca → labor → romváros) */
  themeFor(level) { return Math.floor((level - 1) / 5) % 3; },

  /* pályamódok — determinisztikus kiosztás */
  MODES: {
    survival: { name: 'IRTÁS',         icon: '',   desc: 'Öld meg az összes zombit!' },
    defense:  { name: 'VÉDELEM',       icon: '🛡', desc: 'Védd meg a generátort!' },
    elite:    { name: 'ELIT VADÁSZAT', icon: '⭐', desc: 'Kevesebb, de erős célpont — dupla zsákmány!' },
    survive:  { name: 'TÚLÉLÉS',       icon: '⏱', desc: 'Éld túl az időt — a horda nem fogy el!' },
    boss:     { name: 'VEZÉR',         icon: '☠',  desc: 'Győzd le a vezért!' },
    free:     { name: 'SZABAD FARM',   icon: '♾', desc: 'Végtelen hullámok — gyűjts érmét fejlesztésekre!' },
  },
  modeFor(level) {
    if (this.isBossLevel(level)) return 'boss';
    const m = level % 5;
    if (m === 2 && level > 6) return 'defense';
    if (m === 3 && level > 8) return 'survive';
    if (m === 4 && level > 4) return 'elite';
    return 'survival';
  },
  surviveTime(level) { return Math.round(40 + level * 1.5); },

  /* ---- DAY-alapú kampány (skálázható 100 napig) ----
     1 nap = 5 misszió; az 5. misszió mindig DAY FINALE (boss). A save továbbra is
     numerikus mission ID (level) alapú — a UI day/mission formában mutatja. */
  CAMPAIGN: {
    MISSIONS_PER_DAY: 5,
    ACTIVE_DAYS: 20,     // most aktívan támogatott napok (× 5 = 100 misszió)
    MAX_DAYS: 100,       // a rendszer eddig skálázható
    /* kézzel finomított napok (1–10): név + 5 misszió-cím (az 5. a finálé) */
    DAYS: [
      { name: 'Karantén Utca',         missions: ['Karantén Utca', 'Elhagyott Bolt', 'Lerombolt Sikátor', 'Védelmi Pont', 'Gócpont — Boss Fészek'] },
      { name: 'Elhagyott Labor',       missions: ['Labor Bejárat', 'Mintatároló', 'Generátor Terem', 'Vészfolyosó', 'Mutáns Gócpont'] },
      { name: 'Romváros',              missions: ['Beomlott Negyed', 'Tűzfészek', 'Barikád-vonal', 'Utolsó Menedék', 'Romvárosi Fészek'] },
      { name: 'Metrózóna',             missions: ['Metró Lejáró', 'Peron', 'Sötét Alagút', 'Roncs Szerelvény', 'Mélységi Gócpont'] },
      { name: 'Katonai Ellenőrzőpont', missions: ['Sorompó', 'Őrbódé', 'Fegyverraktár', 'Parancsnokság', 'Karantén-áttörés'] },
      { name: 'Kórháznegyed',          missions: ['Sürgősségi', 'Fertőző Osztály', 'Vérbank', 'Műtőblokk', 'A Fertőzés Forrása'] },
      { name: 'Ipari Terület',         missions: ['Rakodó', 'Öntödecsarnok', 'Tartálymező', 'Erőmű', 'Ipari Gócpont'] },
      { name: 'Fertőzött Lakótelep',   missions: ['Belső Udvar', 'Lépcsőház', 'Tetőszint', 'Pincerendszer', 'Panel-fészek'] },
      { name: 'Kikötői Raktárak',      missions: ['Konténersor', 'Rakpart', 'Hajóhíd', 'Raktárcsarnok', 'Kikötői Gócpont'] },
      { name: 'Fő Gócpont',            missions: ['Külső Védvonal', 'Belső Zóna', 'Fertőzött Mag', 'Utolsó Barikád', 'A Végső Vezér'] },
    ],
    /* formula-napok (11+): zóna-nevek + generikus misszió-címek */
    ZONE_POOL: ['Külső Szektor', 'Karantén Övezet', 'Halott Negyed', 'Vörös Zóna', 'Kitörési Pont', 'Végveszély Övezet', 'Utolsó Bástya', 'Sötét Szektor', 'Peremvidék', 'Pokoltorok'],
    MISSION_POOL: ['Előretörés', 'Tisztogatás', 'Áttörés', 'Kitartás', 'Felderítés', 'Utóvéd', 'Roham', 'Kitörés'],
  },
  dayOf(level) { return Math.ceil(level / this.CAMPAIGN.MISSIONS_PER_DAY); },
  missionInDay(level) { return ((level - 1) % this.CAMPAIGN.MISSIONS_PER_DAY) + 1; },
  levelOf(day, m) { return (day - 1) * this.CAMPAIGN.MISSIONS_PER_DAY + m; },
  dayName(day) {
    const D = this.CAMPAIGN.DAYS[day - 1];
    if (D) return D.name;
    const pool = this.CAMPAIGN.ZONE_POOL;
    return `${pool[(day - 1) % pool.length]} ${day}`;
  },
  missionTitle(level) {
    const day = this.dayOf(level);
    const m = this.missionInDay(level);
    const D = this.CAMPAIGN.DAYS[day - 1];
    if (D && D.missions[m - 1]) return D.missions[m - 1];
    if (m === this.CAMPAIGN.MISSIONS_PER_DAY) return `${this.dayName(day)} — Gócpont`;
    return this.CAMPAIGN.MISSION_POOL[(level * 3) % this.CAMPAIGN.MISSION_POOL.length];
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
     kb: találati visszalökés, flashScale: torkolattűz méret.
     Lőszer-gazdaságtan (jelentősen olcsóbb, játékosbarát):
       pack/packPrice   — kis csomag,
       packBig/packBigPrice — nagy csomag (mennyiségi kedvezménnyel). */
  WEAPONS: [
    { id: 'pistol',  name: 'M9 Pisztoly',       dmg: 13,  rps: 3,    spd: 520,  pellets: 1, spread: 0.012, ammo: -1,  price: 0,     kind: 'bullet', color: '#ffe9a8', shake: 0.5, casing: 1, kb: 14, flashScale: 0.9 },
    { id: 'uzi',     name: 'Vipera SMG',        dmg: 8,   rps: 10,   spd: 540,  pellets: 1, spread: 0.055, ammo: 300, price: 700,   kind: 'bullet', color: '#ffe9a8', shake: 0.6, casing: 1, kb: 9,  flashScale: 0.8, pack: 220, packPrice: 130,  packBig: 700,  packBigPrice: 360 },
    { id: 'shotgun', name: 'Őrszem Sörétes',    dmg: 10,  rps: 1.3,  spd: 480,  pellets: 6, spread: 0.13,  ammo: 60,  price: 2000,  kind: 'bullet', color: '#ffd27a', shake: 2.6, casing: 1, kb: 30, flashScale: 1.5, pack: 40,  packPrice: 180,  packBig: 130,  packBigPrice: 500 },
    { id: 'rifle',   name: 'AK Farkas',         dmg: 22,  rps: 6,    spd: 640,  pellets: 1, spread: 0.03,  ammo: 220, price: 5000,  kind: 'bullet', color: '#ffe9a8', shake: 1.1, casing: 1, kb: 18, flashScale: 1.1, pack: 120, packPrice: 320,  packBig: 380,  packBigPrice: 850 },
    { id: 'flamer',  name: 'Sárkány Lángszóró', dmg: 5,   rps: 18,   spd: 230,  pellets: 1, spread: 0.10,  ammo: 500, price: 10000, kind: 'flame',  color: '#ff9a3d', range: 105, shake: 0.25, kb: 4, flashScale: 0, pack: 320, packPrice: 220,  packBig: 1000, packBigPrice: 600 },
    { id: 'minigun', name: 'Cerberus Minigun',  dmg: 15,  rps: 15,   spd: 600,  pellets: 1, spread: 0.06,  ammo: 640, price: 22000, kind: 'bullet', color: '#ffe9a8', shake: 1.4, casing: 1, kb: 14, flashScale: 1.3, pack: 420, packPrice: 420,  packBig: 1300, packBigPrice: 1150 },
    { id: 'rocket',  name: 'RPG Vulkán',        dmg: 170, rps: 1.0,  spd: 330,  pellets: 1, spread: 0.01,  ammo: 20,  price: 38000, kind: 'rocket', color: '#ffb066', splash: 82, shake: 3, kb: 0, flashScale: 1.6, pack: 10, packPrice: 700,  packBig: 32,   packBigPrice: 1900 },
    { id: 'laser',   name: 'Ion Lézer',         dmg: 48,  rps: 5.0,  spd: 1300, pellets: 1, spread: 0.005, ammo: 160, price: 65000, kind: 'laser',  color: '#7de0ff', pierce: 99, shake: 1.2, kb: 20, flashScale: 1.2, pack: 100, packPrice: 1100, packBig: 320,  packBigPrice: 2900 },
  ],

  /* Zombik — speed: [min,max], coin: alap érme-érték (méretek ~1.3×, hitbox = látvány) */
  ZOMBIES: {
    walker:  { hp: 42,   dmg: 9,  speed: [24, 34], coin: 6,   w: 21, h: 39, reach: 20, atkCd: 1.0 },
    runner:  { hp: 24,   dmg: 7,  speed: [70, 92], coin: 7,   w: 18, h: 36, reach: 18, atkCd: 0.8 },
    crawler: { hp: 34,   dmg: 8,  speed: [42, 58], coin: 8,   w: 26, h: 17, reach: 19, atkCd: 0.9 },
    spitter: { hp: 48,   dmg: 11, speed: [20, 28], coin: 12,  w: 21, h: 40, reach: 20, atkCd: 2.2, range: 250 },
    brute:   { hp: 260,  dmg: 24, speed: [16, 22], coin: 35,  w: 31, h: 49, reach: 28, atkCd: 1.4 },
    /* boss hp/dmg futásidőben a bossHp()/bossDmg() szerint (fair, tanulható); az itteni
       hp/dmg csak fallback-referencia. coin/méret/atkCd innen jön. */
    boss:    { hp: 2050, dmg: 26, speed: [20, 26], coin: 300, w: 48, h: 67, reach: 42, atkCd: 2.0 },
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
  /* dmg/quota/bossDmg: az 1–40 tartomány VÁLTOZATLAN (verifikált balansz);
     40 fölött lágyabb (soft-cap), hogy a magas napok kemények, de ne lehetetlenek legyenek */
  dmgMul(level) {
    const base = 1 + 0.10 * (Math.min(level, 40) - 1);
    return level <= 40 ? base : base + 0.045 * (level - 40);
  },
  coinMul(level) { return 1 + 0.10 * (level - 1); },
  quota(level) { return level <= 40 ? 10 + 4 * level : Math.round(170 + 1.6 * (level - 40)); },
  cap(level) { return Math.min(3 + Math.floor(level / 2), 11); },
  spawnInterval(level) { return Math.max(0.45, 1.6 - level * 0.04); },
  isBossLevel(level) { return level % 5 === 0; },
  clearBonus(level) { return 60 + 32 * level; },
  /* pálya-teljesítési bónusz szorzó mód szerint (nagyobb kockázat → több jutalom) */
  clearMult(mode) {
    return mode === 'elite' ? 2 : mode === 'boss' ? 1.6
      : (mode === 'defense' || mode === 'survive') ? 1.3 : 1;
  },

  /* Boss balansz — fair, tanulható: az első vezér (5. pálya) átlagos játékossal is
     legyőzhető ~45-90 mp alatt; a sebzés nem öl 1-2 ütésből normál HP mellett. */
  bossHp(level) { return Math.round(1400 + level * 130); },
  bossDmg(level) {
    const base = 18 + 1.3 * Math.min(level, 40);
    return Math.round(level <= 40 ? base : base + 0.6 * (level - 40));
  },

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

  GRENADE: { dmg: 210, radius: 88, baseCount: 2, buyPrice: 200, buyMax: 3 },

  /* ---- Free Mode (végtelen pénzfarm, hullámalapú) ---- */
  FREE: {
    /* hány zombit kell kiiktatni a hullám továbblépéséhez */
    waveQuota(w) { return 5 + Math.round(w * 2.2); },
    /* hullám-teljesítési bónusz */
    waveBonus(w) { return 40 + w * 16; },
    /* túlélési „csepegő" jutalom 5 mp-enként */
    trickleEvery: 5,
    trickle(w) { return 8 + w * 2; },
    /* effektív nehézségi szint a hullámból (a kampánynál lassabb ív) */
    levelFor(w) { return Math.min(40, 1 + Math.floor((w - 1) * 0.8)); },
    /* minden ennyiedik hullámon elit mini-boss (brute) esemény */
    miniBossEvery: 4,
    /* futam végi túlélési idő-bónusz szorzó (mp × ennyi) */
    timeBonusMul: 3,
  },
};
