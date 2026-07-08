# STATUS — élő státusz-dokumentum

> Minden érdemi lépés után frissítendő. Új session elején ELŐSZÖR ezt olvasd el.

## Hol tartunk
- **Alapjáték + vizuális átépítés + GAMEPLAY 2.0 + FÁZIS 1 (economy overhaul) kész** — „Zombi Krónika".
- Zero-dependency: HTML5 canvas + vanilla JS (classic scriptek, nincs build), PWA.
- Tartalom: 8 fegyver, 6 zombitípus + fázisos boss, 7 fejlesztés, 40 pálya + **Free Mode**,
  5 pályamód (irtás/védelem/elit/vezér/túlélés) + módosítók, **olcsó perzisztens lőszerrendszer**
  (kis/nagy pack + meccs közbeni vásárlás), érme/medkit/lőszerláda drop, gránát, mentés-export/import.
- Hosszú távú terv: [`docs/ROADMAP.md`](ROADMAP.md) (6 fázis). **A FÁZIS 1 kész**, a többi csak dokumentált terv.
- Élő HTTPS elérés: https://adaaamm200.github.io/ZombieGame/ (GitHub Pages, main branch).

## FÁZIS 2.5 — Interaktív mission hub overhaul (2026-07-08) — mi került bele
- **A Campaign Map roadmap-diagramból interaktív hadműveleti térképpé alakítva**
  (`js/ui.js` + `css/style.css`). Cím: „HADMŰVELETI TÉRKÉP".
- **Világ/terület-érzet**: `.map-wrap`-ben fertőzött-város háttér (veszélyzóna-tint +
  fertőzött-zóna tint + sötét alap) + **zóna-sávok** (`#map-zones`): soronként egy
  SZEKTOR (téma szerint UTCA/LABOR/ROMVÁROS), felirattal → territóriumérzet.
- **Atmoszféra-réteg** (`.map-atmos`, finom, nem takar): taktikai grid (maszkolt),
  mozgó scan-sáv, sodródó köd, vignette + CRT-scanline overlay. „Katonai túlélő-térkép".
- **Node = mission marker** (nem pötty): `.mn-ring/.mn-core/.mn-glyph` — lekerekített
  tile-marker típusszínnel + helyszín-glyph (🏙/⚗/🏚) vagy mód-ikon (🛡/⭐/⏱).
  **Boss = fertőzött gócpont**: nagyobb (72px), kör alakú vörös mag + pulzáló
  infekció-bloom. Elit: ⚠ veszélyjelző. Módosító-badge sarokban. „Itt vagy" ▾ a
  következő misszió felett. Node-tap 54px (boss 72px) — mobilbarát.
- **Interakció/animáció**: node hover/aktív skálázás, **kijelölési fény** (`.sel`),
  is-next zöld pulzálás, boss-bloom, animált útvonal-szaggatás (mozgó dash), zöld
  „megtett" út glow-val, Scavenge-node crate-himbálás + supply-glow, sheet-up preview.
- **Kamera/fókusz**: megnyitáskor a következő misszióra görget (`focusNode`), node
  kiválasztáskor a kijelölt pontra fókuszál (smooth scroll) + kiemeli.
- **Preview panel feljavítva**: **misszió-név** (nem pályaszám, pl. „Karantén-szektor",
  „GÓCPONT: A VEZÉR"), státusz-chip (TELJESÍTVE/KÖVETKEZŐ/ZÁRT/FARM), atmoszférikus
  leírás, **VESZÉLY-mérő** (színes sáv + címke), helyszín, várható zsákmány, **ajánlott
  fegyver**, felkészültség-jelző. Boss preview vörös vészstílusú kártya (`.sp-card.n-boss`).
- **Free Mode = „SCAVENGE ZÓNA / Supply run"** — külön animált lebegő node saját
  „farm zóna" preview-panellel (nem kampányprogress).
- **Flow + save VÁLTOZATLAN**: node→preview→`showLoadout()`→`ZD.game.start()`; a map a
  meglévő `stages.unlocked/cleared`-et olvassa.
- **TESZTELVE** (böngészőben, valós UI): 40 node + 8 zóna + 5 útvonal-réteg ✔ ·
  normál preview (misszió-név/veszély/ajánlott fegyver/státusz) ✔ · boss preview (vörös,
  GÓCPONT, zárt-indok) ✔ · Free/Scavenge preview ✔ · node→INDULÁS→loadout→game (lvl8) ✔ ·
  Free→loadout→game (isFree) ✔ · export/import roundtrip egyezik ✔ · **0 konzolhiba**.
- **Viewport-gate ÁTMENT**: 16:9=100%×100%; mobil landscape (812×375)=100% magasság,
  node-tap 54px/boss 72px; ultrawide (1600×600)=16:9 megőrizve, map-wrap kitölt. Nincs
  „kicsi középen"; `#stage` közös doboz.
- sw.js cache: **zk-v9** (JS+CSS változott). `node --check` mind a 11 JS-re OK.

## FÁZIS 2 — Campaign Map / map-alapú pályaválasztó (2026-07-08) — mi került bele
- **A sima pályarács lecserélve node-alapú kampánytérképre** (`js/ui.js` + `css/style.css`).
  A 40 pálya kígyózó (serpentine) útvonalon, SVG-vel rajzolt úttal: `#s-stages` →
  `.map-wrap > .map-scroll > (svg.map-path + .map-nodes)`. A régi `.stagegrid`/
  `.stagecell`/`.theme-legend`/`.freemode-btn` HTML+CSS eltávolítva.
- **Útvonal**: 3 SVG-réteg — road-base (útágy), road-dash (szaggatott középvonal),
  road-done (zöld „megtett" szakasz a feloldott pályáig, glow-val). `preserveAspectRatio="none"`
  + `vector-effect="non-scaling-stroke"` → a node-ok (`left:%`, `top:px`) és az út
  koordinátái tökéletesen fedik egymást, méréstől függetlenül (nincs layout-timing bug).
- **Node-típusok** (szín + méret + ikon): normal/irtás, védelem (🛡, cián), elit (⭐, arany),
  túlélés (⏱, lila), **boss** (☠, nagyobb 60px, piros, fenyegető pulzálás), + módosító-badge.
- **Állapotok**: `is-locked` (🔒, szürkített), `is-done` (✔, zöld keret), `is-next`
  (a következő elérhető pálya, zöld pulzálás), `is-open`. A pályaszám sarok-badge-en
  mindig látszik. Node-tap-méret 50px (boss 60px) — mobilbarát.
- **Stage preview bottom-sheet** (`#stage-preview`): node kattintásra felcsúszik —
  pálya száma, mód (+módosító), leírás, **téma, várható jutalom (~🪙 becslés), nehézség
  (☠×N + címke), felkészültség-jelző (✔ FELKÉSZÜLVE / ⚠ AJÁNLOTT FEJLESZTENI)**. Zárt
  pályánál a Start rejtve + „🔒 Zárt — előbb teljesítsd a(z) N. pályát" indok. Start →
  a MEGLÉVŐ `showLoadout()` → `ZD.game.start()` flow (nincs törés).
- **Free Mode**: külön lebegő akció-node (♾ SZABAD FARM, jobb-lent), saját preview-panellel
  („nem kampánypálya — nem old fel pályát", „♾ FARM INDÍTÁSA"). Nem kampányprogress.
- **Megnyitáskor a következő pályához görget** (requestAnimationFrame + scrollTop).
- **Save/unlock változatlan** — a map a meglévő `S().stages.unlocked/cleared`-et olvassa;
  teljesítés után a node `is-done`, a következő `is-next` lesz.
- **TESZTELVE** (böngészőben, valós UI): 40 node + 3 útvonal ✔ · node→preview ✔ · zárt
  node indok ✔ · boss preview (piros badge) ✔ · Free Mode preview ✔ · node→INDULÁS→
  loadout→game (level 8, survival, running) ✔ · win→cleared+unlocked→map frissül
  (8:is-done, 9:is-next) ✔ · export/import roundtrip egyezik ✔ · **0 konzolhiba**.
- **Viewport-gate ÁTMENT** (RENDERING_RULES.md): 16:9=100%×100%, mobil landscape
  (812×375)=100% magasság + 50px tap-node-ok, ultrawide (1600×600)=16:9 megőrizve,
  map-wrap 780px-re cappelve, középre. Nincs „kicsi középen"; `#stage` közös doboz.
- sw.js cache: **zk-v8** (JS+CSS változott). `node --check` mind a 11 JS-re OK.

## FÁZIS 1 teljes verifikáció + low-ammo hint (2026-07-08) — mi került bele
- **Viewport-gate (RENDERING_RULES.md) ELLENŐRIZVE, hibátlan**: 16:9 (1280×720) →
  fillW/fillH 100% (left:0, top:0), mobil landscape (812×375) → 100% magasság +
  kontrollált oldalsó letterbox, közel négyzetes → 100% szélesség. A `#stage` egy
  közös dobozban tartja a canvast/HUD-ot/touch-ot. NEM „kicsi középen". Screenshot:
  cím, pályaválasztó (mód-ikonok, Free Mode banner), loadout, in-game HUD (📦 ár-badge).
- **FÁZIS 1 minden minőségi kapu VERIFIKÁLVA** valós kódutakon (headless teszt-harness
  a böngészőben, a valódi ZD.game motort hajtva; a valós mentés export/import-tal
  védve/visszaállítva):
  - pisztoly ∞ (ammo -1 marad) ✔ · rifle lőszerfogyás ✔ · in-match vétel PÉNZZEL
    (−400🪙 = ceil(320×1.25), +120 lőszer) ✔ · in-match vétel PÉNZ NÉLKÜL (errFlash
    0.45, pénz változatlan, „NINCS ELÉG 🪙") ✔
  - Free Mode: isFree, hullámbónusz +72, csepegő +12, `freeEnd`→'free' eredményképernyő
    (túlélési idő + hullám + kill/lövés/sebzés + idő-bónusz + össz-érme) ✔
  - Boss (5. pálya): HP 2050 = bossHp(5) pontosan, boss-bar, dmg 25 (nem 1-2 shot),
    NINCS időlimit (surviveT csak `survive` módban), valós golyókkal megölve → 'win' ✔
  - Economy: jutalom 352 = clearBonus(5)×clearMult(boss) ✔ · save: ammo+coins perzisztál ✔
  - 📦 gomb (btn-ammo) pointerdown → `buyammo` flag beáll (megerősítve) ✔
- **Low/No-ammo feedback bővítve (spec B)**: az üzenetek most a TEENDŐT is mutatják —
  „KEVÉS LŐSZER — 📦/B: VÉGY" és „ELFOGYOTT — 📦/B: VÉGY (∞ pisztoly)" (game.js shoot()).
- **PWA cache-lecke**: asset-változás után a service worker cache-verziót bumpolni KELL,
  különben a cache-first SW a régi fájlt szolgálja ki. Most **zk-v7** (a game.js-hint miatt).
- Ellenőrzés: `node --check` mind a 11 JS-re OK; 0 konzolhiba; viewport 100% @ 16:9.

## Auto Mode + rendering-invariáns rögzítve (2026-07-08) — mi került bele
- **Auto Mode Safety Rules** bekerült a [`CLAUDE.md`](../CLAUDE.md)-be: csak a repón
  belül dolgozunk, nincs dependency-telepítés / build tool / framework / force-push /
  remote-módosítás / titok-hozzáférés; a normál repo-lokális edit/check/docs/commit/push
  engedélyezett. Zero-dependency (HTML5 canvas + vanilla JS + PWA) marad. Veszélyes/
  destruktív műveletnél mindig megállás + kérdés.
- **Canvas / Viewport Invariant** rögzítve új fájlban: [`docs/RENDERING_RULES.md`](RENDERING_RULES.md).
  Tiltott regresszió: kicsi kép középen, nagy fekete keret, szétesett skálázás
  (canvas vs HUD vs touch külön), camera-zoommal „javított" kis kép. A camera zoom
  (ZOOM=1.75) ≠ canvas scaling; előbb a stage/viewport méretezést kell rendbe tenni.
  A doksi a valós kódhoz igazítva dokumentálja a pipeline-t (fix 960×540 buffer +
  `fit()` stage-skálázás a main.js-ben, egy közös `#stage` doboz).
- **KÖTELEZŐ ezentúl**: minden gameplay/UI/map/ammo/boss/shop/grafikai módosítás UTÁN
  viewport-regresszió ellenőrzés a RENDERING_RULES.md „Regresszió-ellenőrzés" lépései
  szerint (node --check + preview desktop + mobil/landscape).

## Balansz-finomhangolás — fegyver-ív (2026-07-08) — mi került bele
- **Progresszió-inverzió javítva** a fegyvertáblában (const.js WEAPONS). Headless
  DPS/TTK-analízis (`scratchpad/balance.js`) mutatta ki: a két legdrágább fegyver
  gyengébb volt a jóval olcsóbb minigunnál (225 DPS). Javítás:
  - **Ion Lézer** (65 000🪙, csúcsfegyver): dmg 34→48, rps 4.5→5.0 → **153→240 DPS** +
    pierce 99 → most a legjobb egycélpont ÉS sor-clear fegyver, méltó a 65k árhoz.
  - **RPG Vulkán** (38 000🪙): dmg 130→170, rps 0.9→1.0 → **117→170 DPS** + splash 82 →
    a horda-nuke szerep megmarad, de az ár is indokolt (rifle és minigun között).
  - **Őrszem Sörétes** (2000🪙): dmg 9→10 → **70→78 DPS**, hogy ne legyen papíron
    gyengébb a 3×-olcsóbb uzinál (80 DPS); a knockback-niche (kb 30, 6 pellet) marad.
- Új ár/erő görbe MONOTON és niche-tiszta: pisztoly 39 → uzi 80 → sörétes 78 →
  rifle 132 → lángszóró 90 → minigun 225 → rakéta 170 → **lézer 240**.
- **Boss-HP érintetlen**: a mért TTK (rifle+közepes upgrade: 10. p. ~12s, 20. ~18s,
  40. ~30s) fair — nem szorult módosításra. A lézer-buff a bosst is gyorsabban öli
  (5–17s), de csak a 65k csúcsfegyverrel, ami korán úgysem elérhető → nem trivializál.
- sw.js cache: **zk-v6**. UI: a bolti DPS-sáv max 340 → nincs túlcsordulás.

## FÁZIS 1 — Economy overhaul (2026-07-07) — mi került bele
- **Lőszer-gazdaságtan újraírva, sokkal olcsóbb** (const.js WEAPONS): kezdő lőszerek nagyobbak,
  árak töredékére csökkentek (pl. uzi kis-pack 250→130🪙 / 220 lövés; rifle 750→320; shotgun 420→180).
  Minden fegyverhez **kis és nagy pack** (`pack/packPrice` + `packBig/packBigPrice`), a nagy pack
  ~13-25% mennyiségi kedvezménnyel. Fegyverárak is mérséklve (rifle 7000→5000, laser 90k→65k stb).
- **Meccs közbeni (emergency) lőszervásárlás** az aktuális fegyverhez: **B** billentyű + új mobil
  **📦 gomb** a HUD-on (ár-badge-dzsel). Ára a kis-pack ×1.25 (`AMMO_EMERGENCY`). Van pénz → levon,
  ad lőszert, hang + „+N LŐSZER" felirat. Nincs pénz → piros keret-villanás (`errFlash`) + hibahang
  + „NINCS ELÉG 🪙". Pisztolynál végtelen (∞). A flow nem akad meg.
- **Free Mode** (♾ SZABAD FARM — nem kampánypálya): a pályaválasztó tetején külön gombbal indul.
  Hullámalapú, végtelen; hullámléptetés a kvóta teljesítésekor (`C.FREE`), effektív nehézség lassan
  ramp-el, minden 4. hullám mini-boss (brute). Pénz: kill + hullámbónusz (40+16×w) + 5 mp-enkénti
  „csepegő" jutalom + futam végi idő-bónusz (mp×3). Halálkor `freeEnd()` → külön eredményképernyő
  (túlélési idő, hullám, statok, idő-bónusz). A szerzett érme mentésbe kerül.
- **Boss balansz átdolgozva, fair + megölhető**: dedikált HP/dmg formula (`bossHp`=1400+130×lvl,
  `bossDmg`=18+1.3×lvl) a régi dupla-skálázás helyett → az 5. vezér 2050 HP (előtte ~2950).
  Fázis-sebességek mérsékelve (ph1 ×1.35, enrage dmg ×1.25 / spd ×1.25), minion-limit 4→3 egyesével.
  **Telegrafált földcsapás**: ~0,6 mp előjelzés (narancs porgyűrű + morgás), utána csap → kitérhető.
  Nincs időlimit boss-pályán. Mért nyers boss-TTK (5. pálya): rifle ~16s, uzi/shotgun ~26s, pisztoly ~55s.
- **Reward balansz**: `clearBonus` 50+28×lvl → 60+32×lvl, mód-szorzó (`clearMult`): elit ×2, boss ×1.6,
  védelem/túlélés ×1.3. Gránát-vásárlás 250→200🪙.
- sw.js cache: **zk-v5**. Új fájl: [`docs/ROADMAP.md`](ROADMAP.md).

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
- Felhasználói kézi teszt (asztali + telefon: https://adaaamm200.github.io/ZombieGame/):
  meccs közbeni ammo-vétel (B / 📦), Free Mode farm, boss-harc érzet, ammo-árak.
- Telefonon a PWA cache frissül (zk-v5) — érdemes újra megnyitni Safariban.
- Visszajelzés alapján balansz-finomhangolás (boss-HP magasabb pályákon, ammo-árak, free-mode jutalom).
- Ha az alap élmény már jó: **FÁZIS 2 — Campaign Map** (map-alapú pályaválasztó). Lásd ROADMAP.md.
