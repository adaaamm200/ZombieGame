# STATUS — élő státusz-dokumentum

> Minden érdemi lépés után frissítendő. Új session elején ELŐSZÖR ezt olvasd el.

## Hol tartunk
- **Játszható alapjáték + vizuális átépítés + GAMEPLAY 2.0 OVERHAUL kész** — „Zombi Krónika".
- Zero-dependency: HTML5 canvas + vanilla JS (classic scriptek, nincs build), PWA.
- Tartalom: 8 fegyver, 6 zombitípus + fázisos boss, 7 fejlesztés, 40 pálya 4 pályamóddal
  (irtás/védelem/elit vadászat/vezér) + pálya-módosítók, perzisztens lőszerrendszer
  ammo-bolttal, érme/medkit/lőszerláda drop, gránát, mentés-export/import.
- Élő HTTPS elérés: https://adaaamm200.github.io/ZombieGame/ (GitHub Pages, main branch).

## Layout + látvány 2.1 (2026-07-07 este) — regresszió-javítás
- **#stage konténer**: a canvas, HUD, touch-gombok ÉS menük egyetlen, arányosan
  skálázott 16:9 dobozban élnek — letterboxnál sem esik szét a layout, a HUD a
  játéktérhez igazodik, nem az ablakhoz. fit() a stage-et méretezi (main.js).
- **Kamera-zoom (C.ZOOM=1.75)**: a világ 1.75× nagyítással renderelődik → a
  karakterek a képernyő ~28%-át teszik ki (előtte ~14%) = 2× nagyobb látvány.
  A játéklogika és a hitboxok változatlanok; a kamera a szűkebb (274 logikai px)
  látómezőhöz clampel. A sötétség-módosító látóköre képernyő-koordinátára váltva.
- **Combat juice +**: irányított vérfröccsenés a lövés irányába (7-10 részecske),
  húscafat-gibek ölésnél, találatnál 30% eséllyel vérfolt, hosszú additív tracer,
  1.35× torkolattűz, robbanás shake 8/11 + hit-stop, menü-jelenet is zoomolva.
- **Loadout-képernyő** pályaindítás előtt: mód+módosító leírás, fegyverváltó
  nyilakkal (lőszer-kijelzéssel, ÜRES-figyelmeztetéssel), gránátvásárlás erre a
  bevetésre (+1 · 250🪙, max 3), HP, erő-becslés (FELKÉSZÜLVE / KOCKÁZATOS).
- **5. pályamód: TÚLÉLÉS (⏱)** — időre megy (40+1,5×szint mp), végtelen horda,
  HUD visszaszámlálóval (13., 18., 23., 28., 33., 38. pálya).
- sw cache: zk-v4.

## Gameplay 2.0 overhaul (2026-07-07 du.) — mi került bele
- **Nagyobb, részletesebb karakterek**: player és zombik ~1.3× (boss 1.2×), hitboxok arányosan
  skálázva (const.js ZOMBIES/PLAYER), extra sprite-részletek (felszerelés, sebek, páncél).
  A logika marad 480×270-ben — balansz-koordináták változatlanok (A opció, biztonságos).
- **Combat feel**: hit-stop ölésnél/kritnél, fegyverenkénti knockback (kb mező) és torkolattűz-méret
  (flashScale), erősebb recoil + fegyverdőlés, játékos halál-animáció (eldőlés lassítva, majd
  vereség-képernyő), ambiens zombi-morgás, generátor-szikrák/füst, részecske-limitek (260 cap).
- **Lőszerrendszer**: perzisztens készlet (save.ammo), pisztoly végtelen (nincs softlock),
  bolt LŐSZER tabbal (fegyverenkénti csomag: pack/packPrice), lőszerláda drop (~5%, elit többet),
  „kevés lőszer" hang+felirat, üres tárnál auto-pisztoly. Mentés-migráció régi mentésekhez.
- **Pályamódok** (determinisztikus, modeFor): survival; defense (7,12,17…: generátor-védelem,
  zombik 55%-a azt támadja, HP-sávval, pusztulás=vereség); elite (9,14,19…: 45% kvóta,
  2-6× erősebb zombik, arany aurás szuper-elitek, dupla bónusz); boss (minden 5.).
- **Pálya-módosítók** (modFor, ~40% a 6+. pályákon, boss-pályán soha): ⚡ gyors horda,
  🌑 sötétség (látókör), 💰 aranyláz (2× érme), 👥 horda (+40% kvóta, sűrűbb spawn).
  Jelzés: pályaválasztó-cella sarkában + HUD-ban + kezdő bannerben.
- **Boss-fázisok**: 70% alatt +50% sebesség; 40% alatt minion-hívás (8 mp-enként 2, max 4);
  20% alatt enrage (+40% sebzés, vörös derengés, nagyobb slam). Roar + banner fázisváltáskor.
- **Nehézség**: cap 9→11, spawn-intervallum min 0,45s, dmgMul 0,09→0,10, runner gyorsabb.
  Kite-bot teszt: 3. pálya full HP győzelem; 10. pálya reális felszereléssel kvóta megvan,
  boss szoros — kézi finomhangolás igény szerint.
- **UI**: bolt tabokkal (FEGYVEREK/LŐSZER), pályaválasztó mód-ikonokkal és módosító-badge-ekkel,
  eredmény-képernyő statisztikákkal (kill/lövés/sebzés), HUD: mód+módosító ikon, villogó piros
  lőszerszám alacsony készletnél.
- **Audio** (+7): groan, lowammo, ammo (vásárlás/felvétel), pdie, genhit, stage, javított rifle.
- sw.js cache: zk-v3.

## Vizuális átépítés (2026-07-07) — mi került bele
- **Render**: belső felbontás 960×540 (RS=2), a játéklogika változatlanul 480×270-es koordinátákban fut → balansz nem változott.
- **Sprite-rendszer** (`js/sprites.js` teljes újraírás): betöltéskor előrenderelt sprite-sheetek offscreen canvasokra; futásidőben csak blit.
  - Player: idle(4)/walk(6)/reload(4) animáció, részletes katona (sisak, mellény, táskák), 8 külön fegyver-sprite a kézben, torkolattűz-sheet.
  - Zombik: 6 típus × 2 szín-variáns, walk(4) + attack(3) keretek, eltérő testalkatok (nyakkendős walker, kapucnis runner, lábatlan crawler, világító hasú spitter, óriás brute, páncélos boss). Halál: dőléses animáció + elhalványulás.
  - 3 pályatéma 5 pályánként váltakozva: elhagyott utca (hold, csillagok, drótkerítés, lámpák pislákoló fénykúppal) / labor-bunker (tartályok buborékkal, függőlámpák, veszélycsík) / romos város (vérvörös ég, tűzfény-pulzus, parazsak, homokzsák-barikád). Réteges parallax (0.2/0.5/0.8/1) + seedelt dekorok (roncsautó, hordó, törmelék…).
- **Game feel** (`js/game.js`): töltényhüvelyek pattogással, fegyverenkénti screen shake, robbanás-animáció (tűzgolyó+gyűrű+füst), vérfoltok a talajon, rakéta-füstcsík, lézer-szikra, sebzésszám pop-animációval, gyógyulás-szám, pickup-részecskék, damage vignette + alacsony-HP pulzus, cinematikus banner (pályakezdés/boss), boss-halál lassítással, animált boss-HP-sáv lag-csíkkal, kozmetikai reload fegyverváltásnál.
- **UI** (`js/ui.js` + `css/style.css` újraírva): animált címképernyő élő háttérjelenettel (vonuló zombi-sziluettek), kártyás fegyverbolt stat-sávokkal, ikonos labor (kódból rajzolt pixel-ikonok), témaszínezett pályaválasztó pulzáló aktuális cellával, modálok animációval, érme-számláló az eredményképernyőn, szebb HUD (fegyver-chip ikonnal, szegmentált HP-sáv), áttetsző-animált touch-vezérlők.
- **Hang** (`js/audio.js`): +roar (boss), +upgrade, +reload, +rifle (külön karakter).
- `sw.js` cache-verzió: zk-v2. `tools/server.js`: PORT env támogatás (preview-hoz).

## Jelenlegi állapot — TESZTELVE ✅
- `node --check` minden JS fájlra hibátlan; konzol futás közben tiszta (0 hiba) az összes teszt után.
- Automata böngészőteszt (2.0): régi mentés migrációja (ammo pótlás) ✔, mód-kiosztás ✔,
  ammo-vásárlás tabon (+130 lövés, −250 érme) ✔, lőszerfogyás + futás végi sync ✔,
  defense-mód (generátor-célzás, pusztulás→vereség) ✔, elite-mód (erősebb zombik, kisebb kvóta) ✔,
  boss mindhárom fázisa (gyorsulás/minion/enrage) ✔, játékos halál-szekvencia→vereség ✔,
  90 mp intenzív játék hiba és particle-leak nélkül ✔, teljes pálya-győzelem statokkal ✔.
- Screenshot-ellenőrzés: nagyobb sprite-ok, ammo-tab, mód-ikonos pályaválasztó, sötétség-módosító,
  eredmény-képernyő statisztikákkal.
- Mentés tisztára állítva (localStorage törölve a tesztek után).
- Futtatás: `node tools/server.js` → http://localhost:8080 (vagy preview: `.claude/launch.json` → zombie-dev).

## Fájlok
- `index.html` (960×540 canvas, fegyver-chip HUD), `css/style.css` — teljes UI-restyle
- `js/const.js` — balansz + RS render-skála + themeFor + fegyver shake/casing mezők
- `js/game.js` — motor + game-feel réteg; `js/sprites.js` — előrenderelt sprite-sheet rendszer
- `js/audio.js` — szintetizált SFX (+4 új); `js/ui.js` — képernyők; `js/input.js` — változatlan
- `js/save.js` — változatlan; `sw.js` (zk-v2), `manifest.webmanifest`, `icons/`
- `tools/server.js` (dev szerver, PORT env), `tools/make-icons.js`, `.claude/launch.json` (preview)

## Döntések
- Felbontás-emelés úgy, hogy a logika koordinátarendszere változatlan → semmilyen balansz/fizika nem módosult (G-követelmény).
- Sprite-ok előrenderelve betöltéskor (perf: futásidőben csak drawImage) — régi iPhone Safari-n is bírja.
- Zombi-halál futásidejű forgatásos eleséssel (nem külön keretek) — kevesebb kód, jó hatás.
- Reload csak kozmetikai (fegyverváltásnál), NEM blokkolja a tüzelést — játékmenet változatlan.
- Saját art direction, semmi másolt asset/UI a Zombie Diary-ból.

## Nyitott kérdések
1. Balansz-finomhangolás kézi játék után: boss-HP a 10+. pályákon szoros lehet; ammo-árak;
   elit-jutalmak. (A hosting már megoldva: GitHub Pages, publikus repo.)
2. Kézi vizuális finomhangolás igény szerint (sprite-részletek, színek, effekt-erősségek).
3. Extra tartalom később: NIGHTMARE/limited-ammo/horde/escort mód, több pályatéma,
   második karakter, teljesítmények, perzisztens statisztika.

## Következő lépések
- Felhasználói kézi teszt (asztali + telefon: https://adaaamm200.github.io/ZombieGame/).
- Telefonon: régi PWA-nál a cache frissül (zk-v3), de érdemes újra megnyitni Safariban.
- Visszajelzés alapján balansz- és látvány-finomhangolás.
