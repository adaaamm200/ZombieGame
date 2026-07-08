# ZombieChronicles — Master Development Plan

> Ez a játék **hivatalos hosszú távú fejlesztési terve**. Innentől MINDEN új
> fejlesztési feladat előtt ezt kell elolvasni, és ehhez kell igazodni.
> Kapcsolódó élő dokumentum: [`docs/STATUS.md`](STATUS.md) (aktuális állapot),
> [`docs/ROADMAP.md`](ROADMAP.md) (korábbi 6-fázisos economy/roadmap terv),
> [`docs/RENDERING_RULES.md`](RENDERING_RULES.md) (canvas/viewport invariáns).

---

## 0) ALAPVÍZIÓ

A játék neve mostantól: **ZombieChronicles**

A játék egy saját, eredeti, Zombie Diary által inspirált, de **nem másolt**,
2D / HTML5 canvas alapú zombis arcade akciójáték.

Fontos irány:
- saját név;
- saját assetek;
- saját UI;
- saját grafikai stílus;
- nincs copyrighted Zombie Diary asset;
- nem 1:1 klón;
- spiritual successor / hommage jelleg.

A játék legyen:
- egyszerűen érthető;
- addiktív;
- fejlődős;
- grindolható;
- mobilon is jól használható;
- PWA kompatibilis;
- zero-dependency HTML5 canvas + vanilla JS.

**Ne** legyen:
- Battle Pass;
- gem / diamond economy;
- clan;
- ranking rendszer;
- starter pack;
- agresszív monetizációs / live-service UI;
- felesleges feature-zsúfolás.

Megengedett későbbi extra rendszerek:
- achievements;
- daily missions;
- karaktertípusok;
- fejleszthető képességek;
- fegyverfejlesztés.

---

## 1) KÖTELEZŐ TECHNIKAI INVARIÁNSOK

Ezek **minden fázisban** kötelezők:

- Ne romoljon el a viewport / canvas / stage scaling.
- Nem lehet a játék kicsi középen.
- `#stage` közös layout doboz maradjon.
- Desktop 16:9, ultrawide és mobil landscape teszt kötelező.
- Minden JS / CSS / HTML változás után `sw.js` cache bump kötelező.
- `node --check` minden JS fájlra kötelező.
- 0 konzolhiba.
- `STATUS.md` frissítés.
- Commit + push main ágra.
- Ne dolgozz repo-n kívül.
- Ne telepíts új dependency-t.
- Ne használj force push-t.
- Ne találj ki új rendszert, ha nincs kérve.

---

## 2) JELENLEGI ÁLLAPOT

A játék jelenleg **működő alapjátékkal** rendelkezik.

Kész / meglévő:
- alap zombis run-and-gun gameplay;
- több fegyver;
- zombitípusok;
- boss;
- Free Mode / Scavenge;
- ammo rendszer;
- in-match ammo buy;
- economy balance;
- boss balance javítva;
- localStorage + IndexedDB + file backup mentés;
- PWA / GitHub Pages;
- Campaign board irány elkezdve;
- új clean board background;
- main menu mockup + clean background;
- új ZombieChronicles logo;
- karakter és zombi concept sheetek style guide-ként.

**Jelenlegi aktív fázis:**
`M1 — Brand + Main Menu + Day Board UI + Localization + Emoji Cleanup`

---

## 3) FEJLESZTÉSI FÁZISOK — HIVATALOS SORREND

A továbbiakban ebben a sorrendben kell haladni.

### M1 — BRAND / MAIN MENU / DAY BOARD UI / LOCALIZATION

**Cél:** A játék első benyomása legyen végre profi.

Feladatok:
- Rebrand ZombieChronicles névre.
- Új logó beépítése.
- Angol legyen az alap UI nyelv.
- Magyar legyen választható nyelv.
- Nyelvválasztás mentődjön.
- Emojik eltávolítása UI-ból.
- Valódi UI ikonok bevezetése.
- Főmenü teljes vizuális tuningja.
- Clean main menu background + programozott UI overlay.
- Day 1 board clean background + programozott UI overlay.
- Campaign board UI polish.
- Nem live-service irány.

Főmenü elemek:
- Continue
- Campaign
- Scavenge / Free Mode
- Armory / Shop
- Lab / Upgrades
- Achievements
- Daily Missions
- Settings
- coin display
- backup / save status opcionálisan

Nem kerülhet be:
- Battle Pass
- több currency
- gem economy
- clan
- ranking
- event monetizáció
- starter pack

### M2 — DAY-BASED CAMPAIGN SYSTEM

**Cél:** Roadmap helyett day-alapú campaign struktúra.

Struktúra:
- 1 Day = 5 mission
- 5. mission = Day Finale / Boss
- Day csak akkor clear, ha mind az 5 mission teljesült
- következő Day csak a finale után nyílik
- Free Mode külön marad, nem old fel kampányt

Hosszú távú cél:
- rendszer legyen skálázható 100 Day-ig
- de nem kell 100 külön background
- 5–10 board theme elég később
- első technikai cél: 20 Day / 100 mission támogatás

### M3 — VALÓDI JÁTÉKMÓD-IDENTITÁS

**Cél:** A mission típusok ne csak névben különbözzenek.

Mission típusok:
1. **Clear / Exterminate**
   - klasszikus irtás
   - minden ellenség megölése
2. **Survival**
   - adott ideig túlélni
   - hullámokban érkező ellenfelek
   - más HUD / timer
3. **Defense**
   - pozíció / supply crate / barikád védése
   - objektum HP
   - fail, ha az objektum elpusztul
4. **Elite**
   - kevesebb, de erősebb ellenfél
   - nagyobb jutalom
   - veszélyesebb spawn
5. **Boss Finale**
   - day végi boss
   - külön boss HP bar
   - boss fázisok
   - nincs unfair időlimit
6. **Scavenge / Free Mode**
   - pénzfarmolás
   - hullámok
   - túlélési idő + kill jutalom
   - nem old fel kampánypályát

### M4 — ARMORY / WEAPON UPGRADE SYSTEM

**Cél:** A fegyverek ne csak vásárolhatók legyenek, hanem fejleszthetők.

Minden fegyverhez:
- damage upgrade
- fire rate upgrade
- magazine / ammo efficiency upgrade
- reload speed upgrade
- később special effect

Fegyver UI:
- weapon card
- level
- stat bar
- upgrade cost
- ammo type
- equipped state

### M5 — CHARACTER SYSTEM

**Cél:** Legyenek játszható karaktertípusok, saját előnyökkel.

Első karakterek:

1. **Soldier** — Role: balanced frontline
   - +10% weapon damage
   - stabil kezdő karakter
   - nincs nagy hátrány
2. **Scavenger** — Role: loot / farm specialist
   - +20% coin reward
   - +10% drop chance
   - Free Mode-ban különösen hasznos
3. **Medic** — Role: survival / sustain
   - +20% medkit healing
   - +10% max HP vagy lassabb HP-vesztés
   - kezdőknek barátságos
4. **Heavy** — Role: tank / brute force
   - +25% max HP
   - +10% knockback resistance
   - Drawback: -5% movement speed
5. **Hunter** — Role: precision / critical
   - +15% critical chance vagy weakpoint damage
   - elite / boss ellen jó
   - Drawback: kisebb HP vagy drágább ammo usage, ha kell balance miatt

Későbbi opció:
- **Engineer** — olcsóbb upgrade, defense módhoz bonus, turret rendszer csak
  később, nem most.

Karakterrendszer követelményei:
- karakterválasztó képernyő
- karakterkártyák
- passzív képesség leírása
- választás mentése
- karakterbónusz tényleges gameplay hatás
- nem kell első körben teljes animált sprite sheet
- concept sheet style guide, nem azonnali in-game sprite

### M6 — SKILL / ABILITY UPGRADE SYSTEM

**Cél:** A karaktereken és fegyvereken kívül legyen fejleszthető
képesség / progression rendszer. Ez a **Lab / Upgrades** képernyőhöz kapcsolódjon.

Lehetséges képességágak:
1. **Health** — max HP növelése
2. **Damage** — általános sebzésbónusz
3. **Ammo Efficiency** — több lőszer / olcsóbb ammo / kisebb fogyasztás
4. **Movement** — mozgási sebesség / dodge / knockback recovery
5. **Looting** — coin reward / drop chance
6. **Survival** — medkit hatás / revive lehetőség később
7. **Explosives** — grenade damage / radius / cooldown

Fontos:
- ne legyen túl bonyolult
- ne legyen RPG-s túlburjánzás
- minden upgrade érezhető legyen
- economyval balanszolni kell
- max level legyen átlátható

### M7 — ACHIEVEMENTS

**Cél:** Legyenek achievementek, de egyszerű, nem live-service irányban.

Achievement példák:
- First Blood: öld meg az első zombit
- Survivor: élj túl 3 percet Free Mode-ban
- Day Cleared: teljesíts egy teljes Day-t
- Boss Slayer: győzd le az első boss-t
- Scavenger: gyűjts 5000 érmét
- Arsenal: vegyél meg 5 fegyvert
- Medic: használj 10 medkitet
- Untouchable: teljesíts egy missiont sebződés nélkül
- Horde Breaker: ölj meg 1000 zombit
- Collector: teljesíts X achievementet

Követelmények:
- achievement screen
- progress tracking
- unlock popup
- jutalom lehet coin, de ne legyen túl nagy
- mentés kompatibilis
- ne kelljen backend

### M8 — DAILY MISSIONS

**Cél:** Legyen napi visszatérési motiváció, de egyszerűen, backend nélkül.

Daily mission példák:
- Kill 100 zombies
- Complete 2 campaign missions
- Survive 3 minutes in Scavenge
- Buy ammo once
- Defeat 1 elite enemy
- Earn 500 coins
- Use a medkit
- Complete a defense mission

Követelmények:
- napi 3 mission
- local date alapján generálható
- jutalom: coin
- ne legyen battle pass
- ne legyen gem
- ne legyen online event
- ne legyen túl komplikált
- legyen Daily Missions screen
- főmenüből elérhető
- nyelvkezelt szövegek

Fontos: Ez megengedett feature, de csak M1 / M2 / M3 után érdemes implementálni.

### M9 — ZOMBIE VISUAL / TYPE UPGRADE

**Cél:** A zombitípusok legyenek jobban megkülönböztethetőek.

Típusok:
- Walker
- Runner
- Brute
- Spitter / Toxic
- Screamer / Special
- Boss

Első körben reális:
- nagyobb / eltérő sziluett
- eltérő szín / fény
- eltérő mozgás
- hit flash
- death particle
- toxic effect
- boss aura

Nem első körös cél:
- teljes concept-art minőségű animált sprite sheet minden típushoz

### M10 — STAGE BACKGROUND / GAMEPLAY VISUAL POLISH

**Cél:** A játék közbeni pályák látványosabbak legyenek.

Day 1 pályahátterek:
- Quarantine Street
- Abandoned Shop
- Ruined Alley
- Defense Point
- Infected Nest / Boss Fight

Követelmények:
- játékos és zombik jól látszódjanak
- ne legyen túl sötét
- parallax később
- ne rontsa a performance-t

### M11 — COMBAT JUICE / EFFECTS

**Cél:** A harc sokkal élvezetesebb legyen.

Effektek:
- muzzle flash
- bullet tracer
- hit flash
- knockback
- blood / particle
- explosion
- screen shake
- floating damage
- boss warning
- boss death effect
- low ammo warning

---

## 4) AKTUÁLIS FÓKUSZ

Jelenleg **NEM** a teljes roadmap implementálása a cél.

Aktuális fázis:
**M1 — Brand + Main Menu + Day Board UI + Localization + Emoji Cleanup**

Ezt kell először befejezni és tesztelni. Minden más csak rögzített hosszú távú terv.

A következő implementációs feladat továbbra is:
- ZombieChronicles rebrand
- új logó
- main menu overhaul
- day board clean background + programmed UI
- English default / Hungarian optional
- emoji cleanup
- UI polish

---

## 5) FEJLESZTÉSI SZABÁLY INNENTŐL

Minden új feladat előtt:
1. olvasd el `docs/MASTER_PLAN.md`-t
2. olvasd el `docs/STATUS.md`-t
3. csak az aktuálisan megjelölt fázist implementáld
4. ne kezdj bele későbbi fázisokba külön kérés nélkül
5. ne találj ki új feature-t a terven kívül

A user minden fázis után tesztel.
Ha egy fázis nem jó, akkor **fix kör** jön, nem új feature.
