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

## HELYSZÍN-ALAPÚ PÁLYAKÖTÉS — a map a misszió-sorszámhoz, nem a naphoz (2026-07-13)
- **Owner-döntés**: a napnak NINCS neve (csak „DAY 1/2…"); az elnevezés a HELYSZÍNÉ. A map a
  NAPON BELÜLI misszió-sorszámhoz (1..5) kötve, minden nap ugyanaz az 5 helyszín, növekvő
  nehézséggel. Így a Quick Mart már a **Day 1 / 2. misszió** = azonnal tesztelhető.
- **`const.js`**: új `LOCATIONS[5]` (nameKey + map-kulcs + procedurális ptheme); `locationFor`
  (=missionInDay-1), `mapKeyFor` (HD map kulcs vagy -1), `locationName` (i18n). A `themeFor`
  mostantól a helyszín procedurális THEMES-fallback indexét adja (0..2), NEM a map-kulcsot.
- **`sprites.js`**: `drawBackground`/`drawForeground` a HD mapot `MAPS[C.mapKeyFor(level)]`-lel
  tölti (helyszínhez kötve); a procedurális fallback a `THEMES[themeFor]`.
- **`ui.js`**: a board plakett „DAY N" NÉV NÉLKÜL (`bd-name` elrejtve); a hotspotok + a briefing
  a HELYSZÍN nevét mutatják (`locationName`); a briefing alcím „DAY x · Mission m/5".
- **`i18n.js`**: `loc.0..4` EN+HU (Quarantine Street / Quick Mart / Zombie Alley /
  Fortified Checkpoint / Infection Nest).
- **Helyszín→map**: 1=Quarantine Street (HD level_01), 2=Quick Mart (HD level_02),
  3=Zombie Alley, 4=Fortified Checkpoint, 5=Infection Nest (3–5 procedurális, míg elkészül).
- **TESZTELVE** (valós böngésző): Day 1 misszió 1→Quarantine (mapKey0), 2→**Quick Mart (mapKey1,
  renderel, világító homlokzat)**, 3→Zombie Alley (procedurális); board „DAY 1" név nélkül,
  hotspot-feliratok = helyszínnevek; briefing helyszín-cím + „DAY 1 · Mission 1/5". **0 konzolhiba.**
  node --check OK.
- Gameplay/balansz/asset ÉRINTETLEN; csak a téma/map-kiválasztás + nevezéktan. sw.js: **zk-v44**;
  `ZD.BUILD='v44'`.

## DAY BOARD JAVÍTÁS — valós haladás + nap-navigáció (a Quick Mart elérhető) (2026-07-13)
- **Panasz**: a board mindig ugyanaz (Day 1), a nap-haladás nem frissül, az új Quick Mart pálya
  a menüből nem elérhető. **Gyökér-ok**: a `renderBoard()` fixen `curDay = 1`-re volt drótozva,
  a HUD is „DAY 1"-et írt → a board SOHA nem lépett tovább, csak az 1–5. pályát (Day 1) kínálta.
- **Fix (a user választása: nap-alapú board marad)** (`js/ui.js` + `css/style.css`):
  - `renderBoard()` a MEGJELENÍTETT `curDay`-t rajzolja (nem fix 1); a `refresh_stages()`
    belépéskor `curDay = currentDay()` (a valós aktuális napra ugrik a mentésből).
  - Új **nap-navigáció**: `‹`/`›` fém-gombok a DAY plakett két oldalán → bármelyik FELOLDOTT
    nap böngészhető (1 .. aktuális nap); a nyilak letiltódnak a széleken (`is-off`).
  - A hotspotok az adott nap 5 misszióját mutatják (`C.levelOf(curDay, slot)`), állapotuk
    (done/current/locked/boss) a valós haladásból (`missionStateOf`). A háttér-artwork közös
    generikus jelenet (nincs per-nap board-kép — a nevek/állapotok változnak).
- **TESZTELVE** (valós böngésző, unlocked=6 szimulálva): a board **DAY 2 — ELHAGYOTT LABOR**-ral
  nyílik (level 6 current, 7–10 locked), `‹` → **DAY 1 — QUARANTINE STREET** (mind done);
  a Day 2 level 6 indítása → theme 1 → **Quick Mart renderel** (99% non-black, világító
  homlokzat). **0 konzolhiba.** node --check OK.
- **Ismert (a nap-alapú modell következménye, NEM javítva — az „option C" restrukturálás volna)**:
  a téma naponta ciklikus (0,1,2,0…), így a nap NEVE nem mindig egyezik a megjelenített
  helyszínnel (Day 2 neve „Elhagyott Labor", de Quick Mart art). Külön jóváhagyással rendezhető.
- Csak `js/ui.js` (board-logika) + `css/style.css` (nyíl-gombok) + build/cache bump. Map/asset/
  gameplay/atmoszféra ÉRINTETLEN. sw.js cache: **zk-v43**; `ZD.BUILD='v43'`.

## LEVEL 02 — QUICK MART build (theme 1, kampány 6–10. nap) (2026-07-13)
- **CSAK Level 02** (a jóváhagyott sorrend szerint; Level 03 NEM indult). A Level 01 tiszta
  pipeline 1:1 alkalmazva: sziluett-cleanup, tiszta rétegmodell, procedurális atmoszféra.
- **Assetek** (`assets/maps/level_02/`): KEEP `far` (skyline) + `ground` (nedves aszfalt,
  átlátszatlan leméretezés); SZILUETT-tiszta `facade` (Quick Mart bolt-homlokzat, hero) +
  `power_pole` (midground akcent) + propok `van/gas_pump/dumpster/gas_sign`. ELUTASÍTVA
  (`_rejected_assets/level_02/REJECTED_MANIFEST.md`): `06_effects/*` PNG köd/eső overlayek,
  `05_foreground/*` zajos törmelék-stripek, koncept-boardok, redundáns homlokzat-részek/sheetek,
  extra propok. Nincs dark-bg removal, nincs tilelt cutout strip, nincs PNG fog/rain.
- **Integráció**: `tools/prepare-map-layers.js` → `doLevel02()` + `emitOpaque()` + CLI
  (`node tools/prepare-map-layers.js 2`, a Level 01 érintetlen); `js/sprites.js` `loadMaps()`
  → `loadMap(1, 'assets/maps/level_02/', {...})`. A drawBackground/struktúra/atmoszféra
  GENERIKUS per-téma path — nem kellett módosítani.
- **TESZTELVE** (valós böngésző, level 6 = theme 1): a HD Quick Mart jelenet renderel
  (skyline + világító homlokzat + talaj + propok; determinisztikus frame-render + pixel-minta,
  mert a screenshot-tool az animált canvason time-outol). Viewport: 1280×720 VIEW_W 480,
  1760×820 VIEW_W 580 (oldalsáv 0), 812×375 VIEW_W 584 (oldalsáv 0) — mind 100% kitöltés,
  talaj 85.9%, dinamikus VIEW_W AKTÍV. 8/8 asset 200. **0 konzolhiba.** node --check OK.
- Fegyver/bolt/karakter/zombi/HUD/gameplay ÉRINTETLEN; Level 01 asset nem tért vissza;
  projekten kívül semmi. **Level 02 után STOP — jóváhagyásra vár a Level 03 előtt.**
- sw.js cache: **zk-v42**; `ZD.BUILD='v42'`.

## PROJEKT-ÁLLAPOT KONSZOLIDÁCIÓ + v41 ELLENŐRZÉS (2026-07-13)
- **Checkpoint**: nincs új feature/asset — a jelenlegi állapot dokumentálása + a v41
  teljes-képernyős viselkedés ellenőrzése, mielőtt a Level 02 jönne.
- **Új dokumentumok** (repo gyökér): `PROJECT_STATUS.md`, `CURRENT_ROADMAP.md`,
  `ART_PIPELINE.md`, `DO_NOT_DO.md`, `ACCEPTANCE_TESTS.md`; +
  `_asset_audit_reports/level_01_final_status.md`. Rögzítik: irány, kötő-megkötések
  (1 valuta, nincs perk/ground-loot/COD), a silhouette map-pipeline, a procedurális
  atmoszféra, a v41 dinamikus VIEW_W szabály, a DO-NOT lista, az acceptance-checklist.
- **v41 ELLENŐRIZVE** (valós böngésző, Level 01, mérve): build `v41`/`zk-v41`; `VIEW_H`
  fix 270; `VIEW_W` DINAMIKUS: 1280×720→480, 1760×820→580, 812×375→584, 2400×800→702
  (clamp 2.6). Oldalsáv **0** a normál tartományban, 100% kitöltés, talaj 85.9%, player a
  talajvonalon, HUD képernyő-fix. **0 konzolhiba.** node --check OK.
- **Következő**: Level 02 CSAK (jóváhagyás után), a Level 01 pipeline + szabályok szerint.
- Csak dokumentáció változott — kód/asset/build ÉRINTETLEN (nincs cache-bump).

## GAMEPLAY TELJES-KÉPERNYŐS KITÖLTÉS — dinamikus látótér-szélesség (2026-07-09)
- **Valós ok a „gameplay nem tölti ki, oldalt fekete sávok"-ra**: a menü (`#screens`) a
  `#stage`-en KÍVÜL, teljes viewportot tölt; a gameplay (`#cv`+`#hud`+`#controls`) a `#stage`
  FIX 16:9 dobozában volt → 16:9-nél szélesebb képernyőn oldalsó pillarbox. A menü full-screen,
  a játék nem → a felhasználó által jelzett eltérés.
- **Fix (a user választása: „szélesebb látótér")** — `js/main.js` `fit()`: a logikai MAGASSÁG
  fix (VIEW_H=270), a SZÉLESSÉG (`C.VIEW_W`) mostantól a képernyő-arányhoz igazodik
  (clamp **1.6–2.6×**), a canvas-buffer szélessége ehhez frissül (`cv.width=VIEW_W*RS`). Így a
  gameplay KITÖLTI a viewportot (mint a menü), side-scrollerként széles képernyőn **több pálya
  látszik oldalt** — nincs vágás, nincs torzítás, a HUD/gombok a képernyő széléhez igazodnak.
  A függőleges keretezés (GROUND_Y ~86%) és a balansz VÁLTOZATLAN. Minden modul futásidőben
  olvassa `C.VIEW_W`-t (kamera-clamp, spawn, HUD-közép, bannerek) → automatikusan igazodik.
- **Extrém arány** (>2.6:1 vagy <1.6:1) esetén a clamp miatt minimális, kontrollált letterbox
  marad (az in-canvas HUD SOSEM vágódik le, perf/balansz védve).
- **TESZTELVE** (valós böngésző, Level 01, mérve): 16:9 1280×720 → VIEW_W 480, 100% kitöltés;
  **1760×820 (2.15:1) → VIEW_W 580, oldalsáv 0, 100% kitöltés** (ez volt a panasz esete);
  mobil landscape 812×375 → VIEW_W 584, oldalsáv 0, 100% (korábban 73px/oldal sáv volt);
  ultrawide 2400×800 (3:1) → clamp 2.6, kontrollált 160px/oldal (kirívó eset). Player a
  talajvonalon, HUD/gombok a széleken, atmoszféra OK. **0 konzolhiba.** node --check OK.
- Csak `js/main.js` (`fit()`) + `js/const.js` (VIEW_W komment) + build/cache bump. Map-art,
  pipeline, atmoszféra ÉRINTETLEN; elutasított asset NEM tért vissza; projekten kívül semmi.
- sw.js cache: **zk-v41**; `ZD.BUILD='v41'`.

## LEVEL 01 IGAZÍTÁS-ELLENŐRZÉS + ALIGN-DEBUG overlay (2026-07-09)
- **Kérés**: a stage/háttér „megint elcsúszott" — javítás a maps 02–05 előtt. **Vizsgálat**:
  a fit()/stage-centrálás/kamera-transzform ÉRINTETLEN a map-munkák óta; méréssel a stage
  MINDEN viewporton pixel-pontosan illeszkedik:
  - desktop 1280×720 → stage 0,0 1280×720 = 100% 16:9;
  - mobil landscape 812×375 → stage 667×375, KÖZÉPRE igazítva (73px pillarbox/oldal —
    16:9 egy 2.16:1 nézetben elkerülhetetlen), talp 100%;
  - ultrawide 1600×600 → stage 1067×600, középen, 100% magasság (267px pillarbox/oldal).
  A talajvonal mindenhol **86%**-on; a canvas (objectFit:fill, inset:0) TÖKÉLETESEN kitölti a
  stage-et. **Nem találtam valós eltolás-bugot** — a háttér/talaj/karakter EGY koordináta-
  rendszerben van, a játékos talpa a talajvonalon.
- **Új: IGAZÍTÁS-DEBUG overlay** (`js/game.js` `drawAlignDebug`, `dbg.align`, **alapból KI**;
  **'G' gomb** vagy `ZD.game.dbg.align=true`): stage-keret + közép-kereszt + **talajvonal
  (magenta)** + **játékos-talp marker (sárga)** + kamera/render-buffer/stage/viewport méretek.
  Így a felhasználó a SAJÁT eszközén ellenőrizheti, hol csúszik (ha csúszik).
- **Valószínű ok a felhasználónál**: beragadt régi cache (régi build), vagy a preview
  screenshot-tool ismert k(kis régióba tömörítő) capture-artefaktja — NEM valós layout-hiba.
  A cache-bump (v40/zk-v40) + a beépített auto-reload ezt orvosolja.
- **TESZTELVE** (valós böngésző, Level 01, overlay-jel): a talp a talajvonalon, a struktúrák
  a talajon, a HUD/gombok képernyő-fixek (safe-area insettel), parallax csak vízszintes.
  **0 konzolhiba.** node --check OK. Az atmoszféra változatlanul működik.
- Csak `js/game.js` (align-debug) + `js/main.js` ('G' gomb) + build/cache bump. Map-art,
  silhouette-pipeline, atmoszféra, assetek ÉRINTETLENEK; elutasított asset NEM tért vissza.
- sw.js cache: **zk-v40**; `ZD.BUILD='v40'`.

## ATMOSZFÉRA-FINOMHANGOLÁS — procedurális, mélység-sávos köd + vékony eső (2026-07-09)
- **Panasz**: a köd/eső overlay olcsó, teljes-képernyős szűrőként washol, elmossa a képet,
  rontja az olvashatóságot (karakter/zombi/prop/talaj). **CSAK az atmoszféra változott** —
  a tiszta réteg-pipeline és a kompozíció ÉRINTETLEN, elutasított asset NEM tért vissza.
- **Kiváltva a PNG-overlayek** (`fog.png`, `rain.png` additív, teljes-szélességű tilelt
  rétegek + a 0.34-es horizont-gradient) → **procedurális, mélység-sávos** rendszer
  (`js/sprites.js`): `drawFogBand()` finom, sodródó köd-pamacsok 3 mélység-sávban
  (far erősebb → mid halvány → előtér szinte láthatatlan), soha nem full-screen; `drawAtmoRain()`
  vékony, ritka, determinisztikus, mozgó eső-csíkok (rövid, féláttetsző, enyhén átlós, nincs
  PNG-felhő). Az utcalámpa-fény (`lightpool.png`, lokális, meleg) megmarad, halványabban.
- **Render-sorrend**: far → FAR mist → struktúrák → MID mist → talaj → fénypool → propok →
  (entitások) → előtér-köd + eső (drawForeground, az entitások UTÁN, halványan).
- **Config + gyors toggle** (`js/const.js` `C.atmosphere`): `enabled` (atmosphereEnabled) +
  `intensity` (atmosphereIntensity: 'off' | 'subtle' | 'strong' | szám-szorzó) + per-mélység
  köd-alfák (0.10/0.05/0.02) + rain (alpha 0.12 / density 0.35 / speed 1.0) + lightPools.
  **Alap: SUBTLE** (nem cinematic-heavy). Runtime: `ZD.C.atmosphere.intensity='strong'` stb.
- **TESZTELVE** (valós böngésző, Level 01, 3 mód): OFF = teljesen tiszta; SUBTLE (alap) =
  finom hangulat, éles/olvasható artwork (katona/torony/QUICK MART/talaj crisp, nincs wash);
  STRONG = láthatóbb eső-csíkok + több horizont-mist, de MÉG mindig olvasható. **0 konzolhiba.**
  node --check OK. Viewport-invariáns ép (desktop 1280×720 = 100% 16:9).
- A most már használaton kívüli `fog.png`/`rain.png` → `_rejected_assets/level_01/fx/`
  (karantén, gitignore); a `fx/lightpool.png` marad.
- sw.js cache: **zk-v39**; `ZD.BUILD='v39'`.

## MAP AUDIT + REPAIR — kollázs/„svájcisajt" háttér tisztítása, tiszta rétegmodell (2026-07-09)
- **Panasz**: a pálya-háttér töredezett/kollázs-szerű, foltos a propok körül, fekete-halo/
  koszos vágásélek, „odadobott kivágások" hatás. **Gyökér-ok a PIPELINE volt, nem a forrás**
  (a forrás-stripek tiszták, prémiumok):
  1) `removeDarkBg()` flood-fill hard fekete-küszöbön → az üreges romokon/sötét-sötéten
     ÁTfolyt → svájcisajt-lyukak, rojtos él, kerék-halo.
  2) A `mid.png` (3 épület-kivágás) és `near.png` (különálló oszlop/torony-sor) **teljes-
     szélességű tilelt parallax-rétegként** rajzolva → ismétlődő, lebegő kivágás-kollázs.
- **Fix — új maszkolás** (`tools/prepare-map-layers.js` újraírva): **per-oszlop sziluett-
  kitöltés** (oszloponként a magabiztos tárgy-pixelek közti teljes sávot szilárdra tölti,
  a belső sötétséget IGNORÁLVA) → tiszta, tömör, halo-mentes sziluettek; 3×3 alfa-feather +
  bbox-trim. **Kompozíció**: nincs több tilelt kivágás-strip — a midground néhány DISZKRÉT,
  tisztán maszkolt struktúra (2 épület + víztorony, par 0.5); az előtér-törmelék-strip
  eltávolítva; a propok 11→**3**.
- **Tiszta réteg-modell** (`js/sprites.js`): far skyline → horizont-köd → diszkrét
  struktúrák → talaj → fénypoolok → ritka jármű-propok → finom köd → scene-grade; előtér =
  csak finom eső. Új `drawStructures()`; `loadMap/loadMaps` új assetkészlet; `drawForeground`
  már csak eső (nincs `fg` strip).
- **Assetek**: KEEP `far/ground/props/police + fx/*`; ÚJRAGENERÁLVA (tiszta) `bld_a` (bal
  épület), `bld_b` (QUICK MART), `watertower`, `props/bus`, `props/car`; ELUTASÍTVA →
  `_rejected_assets/level_01/` (MOZGATVA, nem törölve) `mid/near/fg` + a zajos/törött propok.
  A középső **üreges rom** szándékosan kihagyva (átlátszik rajta az ég → nem maszkolható).
- **Audit-riportok** (a felhasználó kérése szerint, projekt-lokálisan):
  `_asset_audit_reports/map_asset_audit_report.md` + `.json`, `final_map_repair_summary.md`,
  `_deleted_asset_logs/cleanup_log.md`. A karantén (`_rejected_assets/`) gitignore-olt
  (lokális rollback, nem deploy); a szöveges riportok verzionálva.
- **TESZTELVE** (saját dev-szerver, valós böngésző, Level 01): tiszta, kohézív jelenet —
  diszkrét épületek + víztorony a far skyline előtt, bus/car/police tömör sziluettként a
  nedves úton, finom eső/köd. **0 konzolhiba.** node --check mind a JS-re OK. Viewport-
  invariáns ép: desktop 1280×720 stage=100% 16:9; mobil landscape 812×375 → 667×375, 100%
  magasság, 16:9 (nincs kicsi-középen). **Projekten kívüli fájlt semmi nem érintett.**
- sw.js cache: **zk-v38**; `ZD.BUILD='v38'`.

## UI HANDOFF PACK VÉGLEGESÍTÉS — footer-fix, prémium kártyák, clamp-robusztusság (2026-07-09)
- **Forrás**: `assets/references/zombi_kronika_ui_handoff_pack/` (owner által adott
  implementációs csomag: `01_GLOBAL_UI_RULES.md`, `screen_specs/*`, `data/*.json`,
  `styles/*`, `implementation/*`, `visual_references/*`). A v29 UI-t a spec szerint
  véglegesítettem. **FONTOS**: a pack data-JSON-jait (weapons/upgrades/shop) NEM építettem
  be — a játék saját `const.js` adata marad (8. cél: meglévő működés ne törjön).
- **FOOTER-BUG VÉGLEGES FIX (spec 2. pont)**: a „For personal use only. | build vXX" eddig
  `position:absolute` volt a görgethető `.title-screen`-en belül → görgetéskor elmozdult.
  Mostantól **`position:fixed; bottom:0; z-index:45`** (a `#screens` nem transzformált →
  valódi viewport-relatív), plain-mono, `|` szeparátorral. **DOM-igazolt**: a footer alja a
  viewport aljához rögzül (390=390), és scrollTop 0↔max között KONSTANS (nincs drift).
  Szöveg i18n: `menu.note` EN „For personal use only." / HU „Kizárólag magáncélra.".
- **PRÉMIUM MENÜKÁRTYÁK (spec 3. pont)**: `.menu-btn` `min-height: clamp(84px,12.5vh,116px)`
  + clamp-alapú padding/ikon(52–66px)/cím(18–23px)/subtitle/arrow. **DOM-igazolt**: a kártya
  ~106px magas (≥100px spec-cél), tap-target nagy.
- **EGYSÉGES KOMPONENSEK + PAUSE (spec 6. pont)**: a `.screen.modal` erős dim+blur (blur 3→6px,
  rgba .8) + függőleges közép; a modal fő CTA-k (`.modalbox .btn`) `min-height: clamp(58px,
  9vh,66px)` (a lista-inline gombok/nyilak kivételével). **DOM-igazolt**: pause RESUME(gold)+
  QUIT(red) 58px, középen; loadout START(gold) 55px + BACK(ghost); a `.btn` rendszer
  (primary/danger/ok/ghost, disabled .4) végig egységes.
- **ROBUSZTUSSÁG (spec 7. pont)**: `clamp()/min()/max()` a footeren, menükártyákon, board nav
  (`width: clamp(96px,11vw,122px)`), SHOP (`h: clamp(42px,7.5vh,54px)`), mission CTA
  (`h: clamp(54px,9vh,70px)`) — nincs fix-pixelre széteső layout.
- **Bal kampány-nav (spec 4. pont)**: már a v29-ben generált PNG-plaque (Campaign/Scavenge/
  Settings) a KÉPERNYŐ bal szélén — nincs kör/halo alátét. SHOP + FIGHT BOSS prémium CTA (v29).
- **TESZTELVE** (böngésző, valós motor): 844×390 landscape — footer fixen alul + görgetés-
  független, kártya 106px, pause 58px, board nav/shop/CTA rendben; gameplay regresszió:
  menu→scavenge→loadout(START 55px)→game **running**, fire elérhető; armory 8 fegyverkártya
  +2 tab +coin +back 48px, lab 7 upgrade-kártya — **meglévő működés ép**. **0 konzolhiba.**
  `node --check` OK. (A preview screenshot-tool továbbra is kis régióba tömöríti a kimenetet —
  ismert környezeti hiba; verifikáció DOM-metrika alapján, mérvadó.)
- Csak CSS + i18n(2 string) + ui.js(footer HTML) változott — gameplay/economy/save/adat ÉRINTETLEN.
- sw.js cache: **zk-v30**; `ZD.BUILD='v30'`.

## FULLSCREEN UI LOCKDOWN + GENERÁLT GOMB-ASSETEK 1:1 (2026-07-09)
- **Cél**: UI-felület végleges lezárása — a ChatGPT-vel generált PNG gombok TÉNYLEGES
  beépítése (a PNG MAGA a gomb, nincs több CSS-turbózás), teljes képernyős mobile
  layout (safe-area / Dynamic Island), bal nav a képernyő szélére + nagyobbra, build
  felirat fixen alulra.
- **9 generált gomb-asset feldolgozva** (`tools/prepare-button-assets-v1.js`, zero-dep:
  él-flood-fill háttér-eltávolítás + trim + ARÁNY-TARTÓ resize + safe padding → RGBA):
  `assets/references/ChatGPT Image … .png` → `assets/ui/buttons/`:
  - `…11_01_25 (1)` → **btn_campaign_board** (vertikális, arany keret + vörös térkép)
  - `…11_01_26 (2)` → **btn_scavenge_board** (vertikális, lila + hátizsák)
  - `…11_01_26 (3)` → **btn_settings_board** (vertikális, fogaskerék)
  - `…11_01_26 (4)` → **btn_shop_cta** (vízszintes arany SHOP)
  - `…11_01_26 (5)` → **btn_back** (fém plate, chevron)
  - `…11_01_27 (8)` → **btn_fight_boss** (vörös vízszintes CTA)
  - `…11_01_27 (9)` → **btn_close** (fém plate, X)
  - `…11_04_32` → **btn_replay** · `…11_04_36` → **btn_start_run** (sötét fémes CTA-k)
  A 3D fém/textúra/glow/felirat 1:1 megmarad; a széles gomb széles, a nav-kártya vertical.
- **Integráció** (`js/ui.js` `BIMG()` helper): a board bal nav (Campaign/Scavenge/Settings),
  a SHOP, a board-back és a briefing-close, valamint a mission CTA a GENERÁLT PNG — a DOM
  csak kattintható wrapper (`object-fit: contain`, nincs crop/keret/dupla glow). Mission CTA
  állapot→asset: current/scavenge→**START RUN**, completed→**REPLAY**, boss→**FIGHT BOSS**
  (vörös, `.cta-boss`). **DOM-igazolt**: mind a 4 állapot a helyes assetet tölti (ctaH 66px).
- **FULLSCREEN / SAFE-AREA**: a `#screens` konténer a `#stage` 16:9 dobozán KÍVÜLre került
  (index.html) → a menü/board/bolt TELJES viewportot tölt (`position:fixed; inset:0;
  pointer-events:none`, a `.screen` `pointer-events:auto`). A gameplay (canvas+HUD+touch)
  marad a `#stage`-ben, **16:9** (RENDERING_RULES invariáns megőrizve). A board háttér egy
  **16:9 board-frame** (teljes szélesség, függőlegesen `margin:auto` középre — NEM transform,
  mert a `.screen.anim` felülírná): szélesebb-mint-16:9 mobil viewporton felül/alul crop →
  **full-bleed, nincs oldalsó fekete sáv**, és a hotspot %-ok a festett helyszínekre esnek.
  Új `--sat` (safe-area-inset-top); a bhud/bnav a safe-edge-hez igazít. Viewport-meta már
  `viewport-fit=cover` volt.
- **BAL NAV**: a KÉPERNYŐ bal széléhez (`left: max(12px, var(--sal))`), nagyobb generált
  kártyák (desktop **118px** széles → ~162px magas; mobil 60px). Az aktív (Campaign) finom
  arany glow. **DOM-igazolt**: desktop nav x12/118×162, shop x1106/110×50, back 46×46,
  CTA 175×66; mobil 812×375 full-bleed (frame 812×457, oldalsó sáv 0), nav a bal szélen.
  Mobil-korlát: alacsony landscape-en a legalsó (SETTINGS) kártya a briefing-panel MÖGÉ
  bújhat (panel z8 > nav z7 → a panel teljesen látszik) — a SETTINGS a felső fogaskerékkel is elérhető.
- **BUILD FOOTER**: a build felirat + „egyéni felhasználásra" mostantól FIX alsó lábléc
  (`.app-footer`, `position:absolute; bottom:0`, safe-area, `pointer-events:none`) — NEM a
  görgethető menü része. **DOM-igazolt**: footer alul (y+h=viewportH), „…personal use only"
  + „build v29" együtt, középen.
- **TESZTELVE** (böngésző, valós motor): 0 konzolhiba; board full 1280×720 / mobil 812×375
  full-bleed / ultrawide 1600×600 full-bleed; nav/shop/back/CTA/close assetek betöltenek
  (0 törött kép); mission CTA-állapotok (start_run/replay/fight_boss) helyesek; gameplay
  regresszió: **16:9 stage megőrizve** (667×375 @ 812), a touch-gombok elérhetők
  (`#screens` pointer-events:none átereszt). A preview screenshot-tool ebben a sessionben
  továbbra is egy kis régióba tömöríti a kimenetet (ismert környezeti hiba) — a verifikáció
  DOM-metrika + asset-fájl Read + object-fit garancia alapján (mérvadó).
- Csak asset + CSS/HTML/JS-UI + tool változott — gameplay/economy/save/campaign-logika
  ÉRINTETLEN. `node --check` mind a JS-re OK.
- sw.js cache: **zk-v29** (9 gomb-asset precache-elve); `ZD.BUILD='v29'`.

## VERZIÓ-JELZŐ a főmenü sarkában (2026-07-09)
- **Ok**: a felhasználó nehezen látja, tényleg a friss build töltött-e be (cache-beragadás).
- **`ZD.BUILD` konstans** (`js/const.js`) = a betöltött kód verziója; a főmenü jobb-alsó
  sarkában megjelenik („build v28"). Ha a telefonon régi számot lát → régi cache ragadt be.
  Ha az AKTÍV SW-cache verziója eltér, a badge kiírja: „build v28 · cache vXX" (diagnosztika).
- **FONTOS munkafolyamat-szabály**: `ZD.BUILD`-et az `sw.js` VERSION-nel EGYÜTT kell bumpolni
  (most mindkettő **v28** / **zk-v28**).
- Csak UI (const.js + ui.js badge + CSS) — gameplay ÉRINTETLEN. 0 konzolhiba. node --check OK.
- sw.js cache: **zk-v28**.

## BOARD BAL NAV NAGYOBB + MISSION ACTION GOMBOK 3D-METALLIC (2026-07-09)
- **Fókuszált UI-polish (csak CSS)**: a board bal nav gombok + a mission action gombok.
- **Bal nav kártyák nagyobb + prémiumabb** (`css/style.css`): kártya 96→**110px**,
  ikon 80→**92px** (desktop); a felirat KÜLÖN **fémes caption-plate**-en ül (metál
  gradiens + felső bevel-fény + alsó belső árnyék + keret), 10→**11px**, olvasható,
  központi. Aktív = arany caption + finom arany ikon-glow (nem teljes fill). Mobil:
  ikon 44→**50px**, kártya 60→66px (a hotspotokat nem takarja: nav jobb szél 76 < 119).
- **Mission action gombok 3D-metallic** (`.sp-start` + n-boss/n-free, `.btn.primary`,
  `.btn.danger`): embossed felső gloss (`::before`), gazdagabb 4-stop gradiens, **3D
  alsó él** (`0 6px 0`), mélység-árnyék + külső glow + belső felső fény + alsó belső
  árnyék; press = translateY + lecsökkentett él. **Arany** a normál akcióknál
  (START/INDULÁS/REPLAY/START RUN), **vörös** a bossnál (FIGHT BOSS).
- **TESZTELVE (DOM-metrika + computed style)**: nav-kártya 110×123/ikon 92/plate 26px,
  caption fémes gradiens+bevel; START-gomb 4+ rétegű 3D box-shadow + gradiens + ::before.
  Panel-állapotok: current→START (arany), **boss→FIGHT BOSS (vörös, feloldva)**,
  scavenge→START RUN, completed→REPLAY — mind a prémium 3D kezeléssel. Nav a hotspotokat
  NEM takarja desktop/mobil/ultrawide-on; 16:9 megőrizve minden viewporton. **0 konzolhiba.**
  (A preview screenshot-tool ebben a sessionben tartósan beragadt — környezeti hiba;
  a stílus tisztán CSS, a verifikáció DOM computed-style + méret-metrika alapján.)
- Csak CSS változott — gameplay/map/mission-flow/asset/save ÉRINTETLEN. node --check OK.
- sw.js cache: **zk-v27**.

## SW CACHE FRISSÍTÉS-JAVÍTÁS — „nem frissül a játék" (2026-07-09)
- **Panasz**: a user 100× újratöltött, de az ikonok ugyanúgy néztek ki. Ok: a cache-first
  service worker a régi cache-elt asseteket szolgálta ki, és a verzió-bump ellenére sem
  frissült megbízhatóan.
- **2 valós gyökér-ok + javítás**:
  1) Az `install` `addAll`-ja a böngésző HTTP-cache-éből is fetch-elhetett → az új SW-cache
     a RÉGI, azonos nevű képeket kaphatta (GitHub Pages ~10 perc max-age). **Fix (`sw.js`)**:
     `fetch(new Request(u, { cache: 'reload' }))` per asset → a HÁLÓZATRÓL, HTTP-cache
     megkerülésével tölt → tényleg friss assetek. Per-asset hibatűrés (egy hiányzó fájl
     nem bukatja el az install-t). **Igazolva**: a v26 cache bájtjai pontosan egyeznek a
     lemez-fájlokkal (logo 447676, m-continue 77663).
  2) Nem volt auto-reload új SW aktiválásakor → a betöltött oldal a régi assetekkel maradt.
     **Fix (`main.js`)**: regisztráció `updateViaCache: 'none'`-nal (az sw.js SOHA nem a
     HTTP-cache-ből jön → a bump azonnal észlelhető) + `reg.update()` + `controllerchange`
     figyelő: ha MÁR volt aktív SW és egy ÚJ átveszi az irányítást, EGYSZER automatikusan
     újratölt (nincs reload-loop: `hadController` + `reloaded` guard; első látogatáskor nem
     tölt újra).
- **Felhasználói teendő a jelenlegi beragadt állapothoz**: töltsd be az oldalt, várj ~3 mp-et
  (az új SW települ+aktiválódik), majd tölts újra EGYSZER → friss assetek. Innentől a
  frissítések automatikusan érvényesülnek (a beépített auto-reload miatt).
- **TESZTELVE**: friss regisztráció → `zk-v26` cache 40 bejegyzéssel, controller aktív, a
  cache-elt assetek bájtra egyeznek a friss fájlokkal. 0 konzolhiba. node --check OK.
- sw.js cache: **zk-v26**.

## BOARD NAV + SHOP CTA PRÉMIUM KOMPOZÍCIÓ (2026-07-09)
- **Ok**: a board bal nav (Campaign/Scavenge/Settings) és a jobb-felső SHOP gomb még
  „régi gomb + kis ikon + sárga paca" hatású volt — a 3D asset jó, a komponálás rossz.
- **Bal nav → prémium VERTIKÁLIS 3D kártyák** (`css/style.css`): a nagy 3D octagon-asset
  a fő látvány (ikon 80px desktop / 44px mobil, `object-fit: contain`, semmi clip), alatta
  KÜLÖN **dark-metal label plaque** (CAMPAIGN/SCAVENGE/SETTINGS, olvasható). A „sárga
  paca" (teljes arany fill az aktívnál) eltávolítva → aktív = arany label + finom arany
  ikon-glow (NEM teljes fill). Nincs dupla keret/glow (az asset saját kerete a látvány).
- **SHOP → prémium horizontal CTA**: dark-metal + gold border plaque, **nagy 3D kosár-
  asset (46px)** bal oldalt + gold „SHOP" felirat jobbra (nem arany paca kis ikonnal).
  Az `m-shop` asset saját arany 3D glow-ja dominál. (JS: a shop-ikon `aic-inline`→sima
  asset, hogy 46px-re méreteződjön.)
- **TESZTELVE** (screenshot + DOM): desktop board — a bal nav prémium vertikális kártyák
  (nagy 3D ikon + dark label plaque), SHOP nagy kosárral — **screenshot-igazolt**. DOM:
  nav-kártya 96px/ikon 80px, shop-ikon 46px, a nav NEM takarja a hotspotokat (jobb szél
  104 < hotspot 248). Mobil 812×375: nav-ikon 44px, hotspotokat nem takar (74 < 119) —
  a briefing bottom-sheet a legalsó (SETTINGS) kártya alját fedheti (mobil UX-korlát,
  a SETTINGS a topbar fogaskerékkel is elérhető). Ultrawide 16:9 megőrizve.
  Regresszió: főmenü ikonok + armory back (64×48) OK. **0 konzolhiba.**
- Csak board nav/shop CSS + 1 sor JS változott — gameplay/map-bg/hotspot-poz/save ÉRINTETLEN.
- sw.js cache: **zk-v25**. `node --check` mind a JS-re OK.

## PREMIUM UI KIT v1 INTEGRÁCIÓ — 3D ikonok + logó 1:1 beépítve (2026-07-09)
- **Forrás**: `assets/references/ui_kit_v1/` (owner által generált, KÜLÖN komponált
  production ikonok/logó — nem sheet, nincs slicing). Runtime nevekre beépítve.
- **Feldolgozás (`tools/prepare-ui-kit-v1.js`, zero-dep)**: a forrás 1254² RGB, FLAT
  VILÁGOS háttérrel. **Él-flood-fill háttér-eltávolítás**: csak a kép SZÉLÉRŐL induló
  világos háttér lesz átlátszó → a belső highlightok / betűk / glow / fémkeret MEGMARAD
  (a logó fehér „ZOMBIE" felirata ép, nincs lyuk/halo); lágy szél-feather a fehér perem
  ellen. Majd trim + 256×256 átlátszó vászon, tartalom ~70% (semmi nem ér a szélhez).
  A logó arány-tartó, transparent, 760×387. **A 3D hatás/keret/glow/textúra 1:1 megmarad
  (nincs redraw, nincs flat UI, nincs slicing).**
- **Beépített outputok** (`assets/ui/`): menü `m-continue/campaign/scavenge/armory/lab/
  shop/settings/back.png` (mind 256²), marker `s-done/current/locked/boss/loot/danger.png`,
  `ic-coin.png`, és `logo.png` (új vízszintes átlátszó lockup). Az `m-shop` most először
  valódi kosár-asset; az `s-locked` most octagon-alakú (owner assete).
- **CSS**: a dupla glow eltávolítva a menü- és marker-ikonokról (az asset saját glow-ja
  marad, csak finom mélység-árnyék); a logó `.brand-logo` **mix-blend-mode: lighten
  eltávolítva** (átlátszó PNG-hez), vízszintes lockuphoz méretezve (width min(460px,84vw)).
  A `.aic` max-width/height sapka + back-gomb 26px méret (regresszió: OK, back 64×48).
- **TESZTELVE**: az OUTPUT asset-fájlok közvetlenül ellenőrizve (logó/m-continue/s-boss/
  ic-coin) — **1:1 3D, átlátszó, középen, nincs halo/clip**. DOM-metrika: mind a 15 ikon
  256² betöltve, menü 54×54 / marker 68px / boss 92px / logó 460×151 renderel (nincs
  blowup); `object-fit: contain` (nem tud vágni/torzítani). **0 konzolhiba.**
  (A preview screenshot-tool ebben a sessionben tartósan beragadt — környezeti hiba, nem
  kódhiba; a verifikáció asset-fájl Read + DOM-metrika + object-fit garancia alapján.)
- **Későbbre hagyva** (owner kérése szerint): az `elements/` (banner_day_name, plaque_day,
  meter_danger_skulls, plaque_xp, supply_crate) — külön board/briefing polish-körre.
- Csak asset + CSS + tool változott — gameplay/save/HUD-layout ÉRINTETLEN.
- sw.js cache: **zk-v24**. `node --check` mind a JS-re OK.

## RENDERED ICON CLIPPING + BACK-BUTTON FIX (2026-07-08)
- **Ok**: a korábbi QA "crop PASS"-t adott (az asset-PNG-k középen voltak), de a
  TÉNYLEGES renderelt UI-ban több ikon a badge széléhez ért / túl nagy volt, és a
  back-gomb felrobbant. Új QA-szabály: egy ikon csak akkor PASS, ha a valós UI
  containerben teljesen látszik (nem csak a forrás-PNG-ben).
- **Back-button bug (C1) JAVÍTVA**: az Armory/Lab/Settings back-gombja a 256px-es
  `m-back` assetet **natural méreten** renderelte (gomb ~294×278, széttörte a topbart),
  mert a `.aic-btn` csak a board/title HUD-ban volt méretezve. Fix (CSS): új
  `.btn .aic-btn, .backbtn .aic-btn { width:26px; height:26px }` + base `.aic`-hez
  `max-width/height: 100%` biztonsági sapka. **Most: gomb 64×48, ikon 26×26.** (Screenshot-igazolt.)
- **Rendered clipping / inner-scale fix**: az ikonok ~83%-on renderelődtek (a badge
  széléhez értek). A padded-ikon `TARGET` 238→**200** (a crop.js-ben) → minden ikon a
  256 vászon **~70%-át** tölti ki, bőséges átlátszó paddinggel → a valós UI-ban SOSEM
  ér a badge/hexagon/octagon széléhez, teljesen látszik. `object-fit: contain` marad
  (nem tud vágni). A menü/nav/hotspot/boss/scavenge/briefing ikonok újragenerálva.
- **TESZTELVE (screenshot, minden érintett képernyő)**: főmenü (ikonok tiszta peremmel),
  campaign board (nav + hexagon markerek + boss + scavenge teljesen látszik), Armory/
  Settings (back-gomb rendben, topbar nem törik), briefing thumb 78px tiszta, in-game
  HUD (regresszió: OK, 2×2 vezérlő-klaszter érintetlen). **0 konzolhiba.**
- **Viewport-gate**: desktop 16:9, mobil landscape 812×375 = 100% magasság (hotspot 56px,
  armory back 64×48), ultrawide 1600×600 = 16:9. Nincs kicsi középen.
- Frissítve: `docs/qa/VISUAL_QA_CHECKLIST.md` (új szabály: rendered-UI clipping + kisebb
  inner-scale). Csak asset-tartalom + CSS + tool változott — gameplay ÉRINTETLEN.
- sw.js cache: **zk-v23**. `node --check` mind a JS-re OK.

## SAFE PADDED ICON BOXES — egységes 256×256 canvas, külön fájlok (2026-07-08)
- **Döntés**: elég a precíz auto-crop csiszolásából. Áttértünk **biztonságos, paddolt,
  egységes ikon-dobozokra**: minden menü/board ikon **külön PNG**, EGYSÉGES **256×256
  átlátszó (RGBA) canvasra** középre komponálva, ~238px belső tartalommal (≥9px canvas-
  padding), object-fit: contain — semmi nem vágódik le, semmi nem csúszik félre.
- **Hogyan (`tools/crop.js`)**: fix rács-középpont + **NAGYVONALÚ forrás-doboz** az ikon
  köré (a bő margó elnyeli a középpont-becslés kis hibáit → soha nincs levágás), majd
  **bilineáris átméretezés** a 238px célra + **256×256 átlátszó vászonra középre komponálás**.
  A menü-dobozok bővebbek (sötét gombon a margó nem látszik); a board-hexek szűkebbek (a
  városi háttéren minimális sötét margó). RGBA kimenet (átlátszó padding).
- **Megjelenítés (CSS)**: minden asset-ikon `width/height: 100%; object-fit: contain` fix
  konténerben — nincs background-position sheet-hack, nincs skálázás-hack, nincs torzítás.
- **Eredmény (asset-fájlok vizuálisan ellenőrizve)**: m-continue/m-lab/m-back/s-boss/s-loot
  mind **középen, teljes ikon, egységes 256×256, egységes padding, semmi levágva**. Az
  `object-fit: contain` matematikailag garantálja, hogy a teljes ikon látszik, középen.
- **In-game kör-vezérlők (ic-*)**: VÁLTOZATLANOK (fix kalibrált dobozok, jók voltak).
- **TESZTELVE**: mind a 30 UI-asset-ikon betölt (0 törött); 24 db 256×256 paddolt, a coin
  RGB (változatlan). Menü-ikon 54×54 tisztán renderel; board hotspot 56px tap-target; nav
  nem takar; flow board→loadout→game ✔; save roundtrip ép; in-game vezérlők ✔. **0 konzolhiba.**
  node --check mind a JS-re OK. (A preview screenshot-tool ebben a sessionben a folyamatos
  canvas-render miatt beragadt — a verifikáció asset-fájl Read + DOM-metrika + object-fit
  garancia alapján; a JS/konzol tiszta.)
- **Viewport-gate**: mobil landscape 812×375 = 100% magasság, hotspot 56px; desktop 16:9;
  ultrawide 16:9. Csak asset-tartalom + tool + CSS-megjelenítés változott — gameplay ÉRINTETLEN.
- sw.js cache: **zk-v22** (asset-PNG-k RGBA 256×256 tartalomra frissültek).

## ICON CROP / ALIGNMENT FIX — production-ready, középre igazított kivágások (2026-07-08)
- **Probléma**: a menü/board asset-ikonok kivágásai el voltak csúszva / eltérő fekete
  peremmel (fix méretű manuális dobozok pontatlan koordinátákkal) → „odadobott kép" hatás.
- **Megoldás (NEM CSS-hack, hanem tiszta asset-előkészítés, `tools/crop.js`)**:
  - **Sor-sűrűség profil**: a sheet vízszintes sávjaiból meghatározva a PONTOS ikon-Y-sávok
    (menü-octagon y≈147–270, state-hexagon y≈387–493) — így a fejléc/feliratok NEM lógnak bele.
  - **Centroid + FIX doboz**: a fénylő pixelek súlypontja adja a stabil optikai középpontot
    (szimmetrikus ikonoknál a keret színétől/fényességétől függetlenül), majd minden ikon
    **azonos méretű** dobozba kerül (menü 172×132, state 130×120) → egységes padding/optikai súly.
  - **Kézi középpont-felülírás** a halvány/aszimmetrikus ikonokhoz (m-back chevron, m-continue),
    ahol a centroid megbízhatatlan lett.
  - A sötét-keretes **kör-vezérlők** (ic-*) fix kalibrált dobozok maradtak (ott jók voltak).
- **Eredmény**: minden menü-octagon és board-hexagon **középen, egységes mérettel/peremmel**,
  nincs beégett felirat/perem. (Screenshot-igazolt: menü + campaign board.)
- **TESZTELVE** (böngésző + screenshot): főmenü (6 octagon egységes), board (nav-octagon +
  hexagon markerek: boss/scavenge/locked/done/current mind középen), briefing thumb, in-game
  vezérlő-ikonok (regresszió: OK). Flow board→loadout→game ✔. **0 konzolhiba.**
- **Viewport-gate ÁTMENT**: desktop 16:9 (1280×720), mobil landscape 812×375 = 100% magasság
  (hexagon 56px tap-target, nav nem takar), ultrawide 16:9. Csak asset-tartalom + tool változott
  — DOM/CSS-integráció és gameplay ÉRINTETLEN.
- sw.js cache: **zk-v21** (az asset-PNG-k tartalma frissült). `node --check` mind a JS-re OK.

## ICON CONSISTENCY PASS — egységes prémium asset-ikonnyelv minden UI-felületen (2026-07-08)
- **Cél**: a már javított in-game asset-ikonstílus (ingame_icons.png) következetes
  átvitele a főmenüre, boardra, briefingre, loadoutra, armory/lab-ra — hogy a teljes
  UI ikonrendszere egységes legyen (ne maradjon régi SVG/placeholder stílus).
- **Bővített PNG-vágó** (`tools/crop.js`): az `ingame_icons.png`-ből kiszeletelve
  **8 menü-octagon** (`m-continue/campaign/scavenge/armory/lab/settings/shop/back`) és
  **6 board-state hexagon** (`s-done/current/locked/boss/loot/danger`) → `assets/ui/`.
- **Egységes asset-ikon helper** (`js/ui.js` `AIMG(name)`): `<img>`-et ad az asset-hez,
  SVG fallback ha nincs. Átvezetve:
  - **Főmenü**: a gomb-ikonok (`.mb-ic`) az asset-octagonok (play/campaign/scavenge/
    armory/lab), a title coin + gear szintén asset. (Screenshot-igazolt.)
  - **Board nav**: CAMPAIGN/SCAVENGE/SETTINGS asset-octagon; back/gear a HUD-ban asset
    (ház nélkül, az octagon MAGA a gomb); SHOP cart-asset; coin asset.
  - **Board hotspotok**: a state-emblémák **asset-hexagonok** (done=pipa, locked=lakat,
    boss=**fenyegető vörös koponya-hex**, scavenge=**lila loot-hex** — nem generikus
    dobozka); a számozott (current/open) marad CSS-hexagon számmal. (Screenshot-igazolt.)
  - **Briefing**: thumb = asset-hex (boss/loot/current), **veszély-mérő = asset-koponya**
    (on/off opacitással), jutalom = asset-coin.
  - **Loadout/result**: coin = asset; eredmény-ikon = asset-hex (win=done/lose=boss/free=loot).
  - **Armory/Lab/Shop**: az összes ár-coin + back-gomb asset (SVG coin-ok kiváltva).
- **CSS** (`css/style.css`): `.aic*` házolás — az asset saját kerete a látvány, a régi
  CSS-badge/ház eltávolítva (nincs dupla-keret); `.hs-asset` hexagon-embléma; veszély-
  mérő opacitás-alapú; coin inline méretezés.
- **TESZTELVE** (böngésző + screenshot, valós motor): főmenü (asset-octagon ikonok),
  board (nav-octagon + hexagon markerek, fenyegető boss, loot scavenge), briefing/loadout
  (asset thumb/coin/veszély), armory/lab (asset coin+back) — **vizuálisan igazolt,
  egységes**. Assetek 404 nélkül. Flow: board→loadout→game ✔. save roundtrip ép.
  **0 konzolhiba.** Regresszió: in-game HUD asset-ikonok változatlanul jók.
- **Viewport-gate ÁTMENT**: desktop 16:9 (1280×720 teljes menü); mobil landscape 812×375 =
  100% magasság, hexagon 56px tap-target (boss 76px), a nav NEM takarja a hotspotokat;
  ultrawide 16:9 megőrizve. Csak asset/UI/CSS/DOM változott — gameplay/save ÉRINTETLEN.
- sw.js cache: **zk-v20** (14 új ikon precache-elve). `node --check` mind a JS-re OK.

## ASSET INTEGRATION — logó + menü-háttér + prémium in-game ikonok (2026-07-08)
- **Új assetek beépítve** (`assets/references/`): `app_logos.png` (brand-koncepció lap),
  `main menu background.png` (16:9 poszt-apokaliptikus utca), `ingame_icons.png`
  (prémium UI ikon-sheet). Nem referenciaként — **ténylegesen beépítve**.
- **Zero-dep PNG-vágó** (`tools/crop.js`, csak beépített `zlib`+`fs`): a sheet-ekből
  egyedi PNG-ket vág (`assets/ui/`). Kimenet: `logo.png` (Logo A — piros koponya +
  ZOMBIE CHRONICLES + tagline), `appicon.png` (Icon A), és 8 kör-ikon
  (`ic-fire/ammo/swap/grenade/dash/pause/medkit/coin.png`). (Nem futásidejű függőség,
  csak build-idejű asset-előkészítés.)
- **Logó**: a főmenü logója most az `assets/ui/logo.png` (mix-blend-mode: lighten →
  a sötét háttér eltűnik, a koponya+felirat a városi háttéren ül), nagyobb (max 26vh),
  jól komponálva. **Favicon + apple-touch-icon + manifest** → `appicon.png` (branding
  konzisztencia; a 180/512 fallback marad).
- **Főmenü háttér**: `main menu background.png` **valódi háttérként** (`<img class="menu-bg-img">`
  külön wrapperben) + olvashatósági scrim/vignette. **Animálhatóra előkészítve** ÉS
  azonnali motion polish: lassú ambient zoom/pan (`menuDrift` 28s) + lélegző vörös
  horizont-glow (`menuGlow` 6s); `prefers-reduced-motion` tisztelve. (Screenshot-igazolt.)
- **In-game ikonok cseréje**: a touch-gombok (fire/gránát/lőszer/swap) és a HUD
  (pause, coin) most a **sliced asset-ikonok** — a kör-ikon MAGA a gomb arca (beépített
  gyűrű+glow), nem CSS-rajz. A régi SVG/placeholder ikonok kiváltva. (Screenshot-igazolt.)
- **Touch gombok újrapozicionálása**: a bal-alsó egysoros gombsor helyett **2×2 sarok-
  klaszter** (fire jobb-alsó sarok hüvelykujjnak, gránát mellé, lőszer/swap fölé). A
  klaszter 333px→**175px** széles → a jobb szélhez húzva (mobilon 49%→72% jobbra),
  **jóval kevesebb takarás**; fire 96px, mellékgombok 68px (nagyok, de kompaktak).
  (Screenshot-igazolt.)
- **TESZTELVE** (böngésző + screenshot, valós motor): főmenü (háttér+logó), in-game HUD
  (asset-ikonos gombok), 2×2 sarok-klaszter — **vizuálisan igazolt**. Assetek 404 nélkül
  betöltenek (a szóközös fájlnév is). Flow: board→loadout→game ✔. save export/import ép
  (adat egyezik). **0 konzolhiba.**
- **Viewport-gate ÁTMENT**: desktop 16:9; mobil landscape 812×375 = 100% magasság,
  sarok-klaszter kevés takarással; ultrawide 1600×600 = 16:9 megőrizve. Nincs „kicsi
  középen". Csak asset/UI/CSS/DOM változott — gameplay/economy/save ÉRINTETLEN.
- sw.js cache: **zk-v19** (új assetek precache-elve). `node --check` mind a JS-re OK.

## UI OVERHAUL — a régi zöld UI leváltása prémium, boardhoz illő design systemre (2026-07-08)
- **Ok**: a prémium board-háttérre eddig a régi „gagyi zöld retro" UI-réteg került → a
  játék vizuálisan szétesett (prémium bg + olcsó overlay). Referencia:
  `assets/references/visual_style_sheet.png` + `main menu.png` (a beégetett cél-UI).
- **Design system csere (`css/style.css`)**: új `:root` tokenek — sötét **fémes/füstös
  panelek**, típus-akcentusok: **arany = fő akció**, vörös = boss/veszély, zöld = ready/
  active, kék = info, lila/smaragd = loot. A zöld-dominancia megszűnt (zöld már csak
  ready/success). Fém `--ui-bevel` (felső fény + alsó árnyék + belső keret), `--ui-shadow`.
- **Közös gombrendszer**: `.btn` default = semleges fém (NEM zöld); `.btn.primary` = arany
  akciógomb; `.danger` = vörös; `.ok` = zöld (ready); `.ghost` = fém. `.tab.active` = arany.
  `.screen h2` = arany. A `.screen` háttér-tint zöldről semleges sötétre váltva.
- **Főmenü (referencia szerint)**: sötét glossy fém-bárok **thin neon accent-borderrel**
  (Continue=zöld, Campaign=vörös, Scavenge=lila, Armory=arany, Lab=kék, Settings=szürke),
  accent ikon-badge glow-val, nagyobb bold címkék (80px magas gombok). **Screenshot-igazolt**
  — a mockup vizuális nyelvét követi.
- **Board**: **központi prémium DAY plakett** — fémes „DAY 1" tábla + arany zóna-név
  („DAY 1 — QUARANTINE STREET"). Nagyobb HUD (back/coin/SHOP/gear). **Bal nav vízszintes
  pillekké** (ikon + label, arany aktív) — mobilon kompakt oszlop, hogy NE takarja a boardot.
- **Mission hotspotok teljes újratervezés**: **hexagon badge-ek** (accent-keret + sötét mag),
  jóval nagyobbak (emblem 68×74, boss 92, mobil emblem 56 — 56px+ tap-target), **olvasható
  névcímkével** minden markeren; current=arany pulzáló, done=zöld pipa, locked=sötét lakat,
  boss=nagy vörös koponya (fenyegető), scavenge=lila/arany láda. Screenshot-igazolt.
- **Mission briefing / loadout / result / pause modálok**: fémes panel (arany accent-vonal),
  arany **START/INDULÁS** gomb, nagyobb tipográfia. A régi zöld doboz eltűnt. Screenshot-igazolt.
- **In-game HUD + touch gombok**: nagyobb HP-sáv (196×22, vörös rim-glow), prémium fegyver-
  chip, nagyobb pause. **Touch gombok**: fire **104px** (vörös), mellékgombok **80px**
  (lőszer=arany, swap=kék, gránát=vörös), gloss + accent-glow + press-pulzálás + badge-
  számlálók, nagyobb távolság. Nagyobb kék joystick (116px). Screenshot-igazolt.
- **TESZTELVE** (böngészőben, valós motor + screenshot): főmenü/board/loadout/in-game
  **vizuálisan igazolt** (a UI + board egy rendszer, nem „régi UI prémium háttéren").
  Flow: hotspot→briefing→START→loadout→game ✔; Scavenge→briefing→run ✔; armory fémes
  kártyák + arany aktív tab ✔; settings ✔. **0 konzolhiba.** save export/import roundtrip
  ép (csak `_ts` időbélyeg tér el — az adat egyezik).
- **Viewport-gate ÁTMENT**: desktop 16:9 (kitölt, screenshot); mobil landscape 812×375 =
  100% magasság, hexagon markerek 56px+, a bal nav NEM takarja a hotspotokat/címkéket
  (nav jobb szél 64px < hotspot 91/119px); ultrawide 16:9 megőrizve. Nincs „kicsi középen".
- Csak UI/CSS/DOM változott — **gameplay/economy/boss/save/campaign-logika ÉRINTETLEN**.
- sw.js cache: **zk-v18**. `node --check` mind a JS-re OK.

## M1B — Prémium UI + gameplay feel + KRITIKUS input fix (2026-07-08)
- **KRITIKUS touch-input fix (`js/input.js`)**: a virtuális joystick a pointer
  `clientX/Y` (VIEWPORT-koordináta) alapján pozicionálta a `#joybase`-t, ami a
  `#joyzone`-hoz (offset parent) képest van elhelyezve. Mivel a `#stage` középre
  igazított/letterboxolt, a kettő eltért → a joystick „mellé" került. Javítás: a
  bázis a zóna `getBoundingClientRect()`-jéhez relatívan kerül az ujj alá
  (`clientX - zr.left - BASE_HALF`). A `#stage` nincs skálázva (csak eltolva), így
  a tengely-delta változatlanul helyes. **Böngészőben igazolva**: az érintési pont
  és a bázisközéppont eltérése **0px** desktopon (640px stage-offsetnél), mobil
  landscape-en (73px oldalsó letterboxnál) és ultrawide-on is. RADIUS 36→40.
- **Prémium ikonrendszer (`js/icons.js` újraírva)**: vastagabb kontúr (stroke 1.9→2.3),
  telt/kettős rétegű, sötét háttéren is olvasható, játékba illő ikonok; új ikonok:
  `reload`, `ammo`, `medkit`, `boss`, `objective`. A vékony fehér placeholder-hatás
  megszűnt. A CSS glow/shadow/badge réteget ad (nem lapos).
- **Főmenü gyökeres UI polish (`css/style.css`)**: a menügombok accent-gradiens
  üvegpanelek lettek (accent-színnel átszínezett háttér + erős border-highlight +
  belső fény + mélység); az ikonok **prémium accent-gradiens badge**-ekben ülnek
  (korong + gloss + gyűrű + glow), sötét glyph-fel. Primary gombon futó fény
  (goldShine). Erősebb hover/press, tisztább vizuális hierarchia.
- **Gameplay HUD polish (`index.html` + CSS)**: prémiumabb fegyver-chip (nagyobb
  ikon, glossy panel), **animált RELOAD-jelző** a chipen (forgó spinner + sweep-sáv;
  önmagát törli, `ZD.ui.flashReload()` fegyverváltáskor). Vezérlőgombok (fire/gránát/
  lőszer/swap) **accent-színes prémium korongok** (fire=vörös, gránát=vörös, lőszer=
  arany, swap=kék) gloss + glow + press-pulzálással; nagyobb, olvashatóbb glyphek.
- **Combat feel turbó (`js/game.js` + `audio.js`)**: torkolattűz-punch (additív
  muzzle-glow + szikrák + füst + min. shake minden lövésnél), erősebb/hosszabb golyó-
  tracer izzó maggal, becsapódási szikrák a találatnál, **erősebb robbanás** (fényes
  mag-szikrák + porgyűrű + több törmelék + nagyobb shake/hitstop), **gránátdobás-
  feedback** (por-pukkanás + rúgás + új `throw` hang), prémiumabb boss HP-sáv
  (keret + gloss + vörös glow + lag-csík).
- **Emoji-mentesítés + i18n a gameplayben**: az összes maradék in-game emoji
  eltávolítva (📦/🪙/⚠/✖/☠ float-feliratok és canvas-bannerek, a generátor 🛡
  rajzolt pajzzsá). Az in-game HUD-feliratok és bannerek most **lokalizáltak**
  (EN-default konzisztencia): `hud.*` + `game.*` kulcsok EN+HU (LOW AMMO, OUT,
  +N AMMO, MINI-BOSS, WAVE N, STAGE N, THE BOSS HAS ARRIVED/ENRAGED, GENERATOR
  DESTROYED, BOSS bar-címke).
- **TESZTELVE** (böngészőben, valós motor): 0 konzolhiba; főmenü 6 prémium gomb
  gradiens ikon-badge-ekkel; board 6 hotspot + 3 nav + briefing az új ikonokkal;
  játék indul, HUD/vezérlők láthatók, reload-flash működik; 70+ frame lövés/gránát/
  render (boss-szint) hibamentes; EN↔HU nyelvváltás. **Screenshot a folyamatos
  canvas-animáció miatt időtúllépik (tooling-korlát) — a render() hibamentesen fut,
  DOM/eval-verifikációval igazolva.**
- **Viewport-gate ÁTMENT**: desktop 16:9 (kitölt); mobil landscape 812×375 = 100%
  magasság, 16:9, input-hiba 0px; ultrawide 1600×600 = 16:9 megőrizve, teljes
  magasság. Nincs „kicsi középen"; a `#stage` közös doboz.
- sw.js cache: **zk-v17** (JS/CSS/HTML változott). `node --check` mind a JS-re OK.

## MASTER PLAN rögzítve — hivatalos hosszú távú terv (2026-07-08)
- Létrehozva: [`docs/MASTER_PLAN.md`](MASTER_PLAN.md) — **ZombieChronicles — Master
  Development Plan**. Ez mostantól a játék HIVATALOS fejlesztési terve; minden új
  feladat előtt EZT + a `STATUS.md`-t kell elolvasni, és csak az aktuálisan megjelölt
  fázist implementálni (nincs terven kívüli feature, nincs előreugrás külön kérés nélkül).
- Tartalom: alapvízió (saját név/asset/UI, spiritual successor, NEM live-service:
  nincs Battle Pass / gem / clan / ranking / starter pack), kötelező technikai
  invariánsok (viewport/stage scaling, sw cache bump, `node --check`, 0 konzolhiba,
  STATUS frissítés, push main), jelenlegi állapot, és **M1–M11 hivatalos fázissorrend**:
  M1 brand/menü/board/lokalizáció, M2 day-based campaign, M3 játékmód-identitás,
  M4 armory/weapon upgrade, M5 character system, M6 skill/ability upgrade,
  M7 achievements, M8 daily missions, M9 zombie visual, M10 stage visual polish,
  M11 combat juice. **Aktuális aktív fázis: M1.**
- Ebben a körben **NEM** implementáltunk új feature-t — csak dokumentáció (MASTER_PLAN
  létrehozása + STATUS frissítés). JS/CSS/HTML/sw.js VÁLTOZATLAN → nem kellett cache bump.
- Ellenőrzés: `node --check` mind a JS-re OK (nem változott kód, sanity check).

## FÁZIS 4 — Rebrand ZombieChronicles + főmenü + lokalizáció + emoji-mentes UI (2026-07-08)
- **Rebrand → ZombieChronicles**: index.html `<title>`/meta, manifest name/short_name,
  const.js fejléc, apple-web-app-title. Új logó: `assets/references/logo.png` (vörös koponya),
  a főmenüben `mix-blend-mode: lighten`-nel beépítve (fekete háttér eltűnik), reszponzívan.
  (A save-kulcs/IDB-név VÁLTOZATLAN — a régi mentések nem törnek el.)
- **Lokalizáció (`js/i18n.js`) — English alap + Magyar**: központi `ZD.i18n` dictionary,
  `ZD.t(key, vars)` interpolácóval; a nyelv a **save-ban** tárolódik (`data.lang`, def. 'en'),
  betöltéskor/importkor alkalmazódik. **Beállításokban nyelvválasztó** (English / Magyar),
  azonnal újrarenderel + ment. Lefedve: főmenü, day board, mission briefing, settings,
  loadout, result, pause, armory/lab fejléc+gombok, HUD, státusz/nehézség/mód/objektíva szövegek.
- **Emoji-mentes UI (`js/icons.js`)**: egységes inline **SVG ikonkészlet** (coin, gear, back,
  play, chevron, campaign/target, scavenge/crate, armory/gun, lab/flask, lock, check, skull,
  warning, save, fire, grenade, swap, pause, close). Minden UI-emoji lecserélve SVG-re a
  főmenüben, boardon (HUD/nav/markerek/briefing), settingsben, loadout/result/pause modálban,
  armory/lab kártyákban és az index.html in-game HUD/kontrollokon. `node --check`: 0 emoji az
  ui.js-ben és index.html-ben.
- **Főmenü overhaul (prémium, egyszerű, Zombie Diary-szerű)**: logó + coin + settings HUD;
  6 nagy gomb (**Continue/New Game · Campaign · Scavenge · Armory · Lab · Settings**) SVG-ikonnal,
  al-felirattal, típus-accent színnel (green/red/purple/gold/blue), üveg/fém panel + glow + bevel,
  hover/press; SAVE:OK státusz-pill; a **Scavenge** közvetlenül a free-mode loadoutot indítja.
  Háttér: az élő animált menü-jelenet (UI-mentes, atmoszférikus). A „main menu.png" referencia
  kombinált 2-panel kép (mockup + clean) volt, nem különálló 16:9 clean bg — ezért a live scene
  marad háttérként (megfelel: clean bg + programozott UI + finom effektek).
- **Day board**: DAY-név/mission-nevek angolul (Quarantine Checkpoint/Abandoned Shop/Ruined
  Alley/Survivor Holdout/Infected Nest) az i18n-ből; markerek/briefing/HUD/nav SVG-ikonokkal.
- **TESZTELVE** (böngészőben): rebrand + logó megjelenik; EN alap; HU választható + mentődik;
  főmenü gombok (Continue→board, Scavenge→loadout, Armory/Lab/Settings) működnek; board i18n+SVG;
  briefing/loadout/result/pause/armory/lab lokalizált + emoji-mentes; save export/import ép.
  **0 konzolhiba.** node --check PASS.
- **Viewport-gate ÁTMENT**: desktop 16:9 (menü kifér, board kitölt); ultrawide 16:9 megőrizve;
  mobil landscape 812×375 (100% magasság, board kitölt; a menü 6 gombja görgethető — a stage
  hézagmentesen kitölt, nincs „kicsi középen").
- sw.js cache: **zk-v16** (i18n.js/icons.js/logo.png precache). `node --check` OK.

## FÁZIS 3.1 — Campaign UI polish (prémium overlay) (2026-07-08) — mi került bele
- **Csak a programozott UI overlay vizuális minőségét húztuk fel** (a clean board-artwork
  háttér és a funkciók VÁLTOZATLANOK; semmi nincs a képre égetve).
- **CSS-változók** a `:root`-ban (újrahasználható Day 2+ esetén is): `--ui-green/-gold/-red/
  -blue/-purple/-panel/-panel-solid/-border/-glow/-bevel`.
- **Felső HUD prémium**: fémes/üveg panelek (blur + bevel + belső fény), DAY 1 piros
  hazard-banner erősebb glow-val, **arany érme-pill** (gold rim + belső fény), **glossy
  SHOP gomb futó arany-csillanással** (goldShine), back/⚙ fémes kör-gombok hover/press-szel.
- **Bal nav prémium**: üveg panelek bevel-lel, aktív = arany gradient + fehér accent-csík,
  Scavenge külön lila/arany loot-glow-val; hover eltolás + press scale.
- **Prémium mission markerek** (státusz CSS-változókkal `--mk/--mkglow/--halo`): glossy,
  beveled, belső csillanós badge + ground-glow. **Available/current**: arany badge + pulzáló
  aura-gyűrű (ringPulse). **Completed**: zöld ✓ + stabil zöld glow. **Locked**: sötétített +
  🔒, olvasható. **Boss**: nagyobb vörös badge + fenyegető pulzáló vörös aura-gyűrű.
  **Scavenge**: arany láda + lila loot-glow. Hover scale, selected fehér ring.
- **Briefing panel prémium**: üveg/fém panel `backdrop-filter: blur`, felső **neon-vonal
  accent** (mód szerint zöld/vörös/arany), section-separator, **VESZÉLY (koponyák) · AJÁNLOTT
  fegyver · ZSÁKMÁNY (érme+XP)** ikonos sorok, nagy **glossy START** (mód-színnel: zöld/boss
  vörös/free arany). Az ajánlott fegyver mostantól látszik.
- **Animációk** (finomak, mobilbarát): marker-aura pulse, boss-aura pulse, current-glow,
  hover-scale, selected-flash, briefing slide/fade, gomb-press, SHOP arany-shine.
- **TESZTELVE** (böngészőben): prémium HUD/nav/markerek/briefing renderelnek; marker-állapotok
  (open/current/done/locked/boss/scavenge); briefing frissül + ajánlott fegyver; campaign→
  START→loadout→game (lvl2); boss briefing (n-boss vörös accent); SHOP/⚙/Scavenge/back működik;
  **0 konzolhiba.**
- **Viewport-gate ÁTMENT**: desktop 16:9, ultrawide 1600×600 (16:9 megőrizve), mobil landscape
  812×375 (100% magasság, kompakt HUD/nav). Nincs „kicsi középen".
- sw.js cache: **zk-v15**. `node --check` mind a JS-re OK.

## FÁZIS 3.0 — CLEAN board-artwork + teljesen programozott UI overlay (2026-07-08) — mi került bele
- **Iránykorrekció**: a 2.9-es `day1_board_target.png` egy MOCKUP volt (beégetett festett
  HUD/shop/coin/sidebar/mission-feliratok/briefing). Most a háttér a **tiszta artwork**:
  `assets/references/day1_board_target_clean.png` — CSAK a város/board, semmi UI-szöveg/gomb.
  A `visual_style_sheet.png` a másodlagos stílusreferencia.
- **Két külön réteg** (a mockup-UI-t NEM használjuk végleges UI-ként):
  1) **CLEAN BOARD BACKGROUND**: `<img class="board-bg" object-fit:cover>` a clean artwork
     (1672×941 = pontosan 16:9 → hézagmentesen kitölti a mindig-16:9 `#stage`-et).
  2) **PROGRAMOZOTT UI OVERLAY** (valódi DOM/CSS, nem festett, nem hitzone):
     - **Felső HUD**: ← gomb, **DAY 1 · KARANTÉN UTCA** piros hazard-banner, élő **érme**
       (data-coins), **SHOP** (arany) → armory, **⚙** → settings.
     - **Bal nav**: CAMPAIGN (aktív/arany) · SCAVENGE (→ farm briefing) · BEÁLLÍTÁS.
     - **Mission hotspotok** a clean helyszínek fölött (%-pozíció): 1 barikád, 2 bolt,
       3 romos sikátor, 4 védelmi tábor, 5 boss-fészek, + Scavenge (supply). Prémium
       halo+emblem markerek: completed (zöld ✓), current (arany pulzáló), locked (🔒),
       boss (vörös pulzáló), scavenge (amber).
     - **Live mission briefing** (bottom-sheet): thumbnail, státusz, DAY/mission, cím,
       típus, Cél, VESZÉLY (koponyák), ZSÁKMÁNY (érme+XP), nagy START.
  + finom `board-scrim` a UI olvashatóságához (az artworköt alig sötétíti).
- **Minden felirat kódból jön** (const.js CAMPAIGN + game-logika): Day-név, mission-név,
  reward, státusz később cserélhető — semmi nincs a képre égetve. A régi over-painted
  coin-overlay és a hitzone-ok TÖRÖLVE, helyettük valódi DOM-gombok.
- **Csak Day 1** (a clean artwork Day 1); save/day/campaign-logika VÁLTOZATLAN, kompatibilis.
- **TESZTELVE** (böngészőben): clean kép betölt (1672×941) + kitölti a stage-et; nincs
  beégetett UI a háttéren; programozott HUD/nav/hotspot/briefing működik; boss/locked/scavenge
  állapot; campaign→START→loadout→game (lvl2); Scavenge→game (isFree); SHOP→armory; ⚙→settings;
  save export/import roundtrip egyezik. **0 konzolhiba.**
- **Viewport-gate ÁTMENT**: desktop 16:9 (kitölt); ultrawide 1600×600 (16:9 megőrizve,
  kép kitölt); mobil landscape 812×375 (100% magasság, kép kitölt, programozott UI). Nincs
  „kicsi középen"; `#stage` közös 16:9 doboz.
- sw.js cache: **zk-v14**; a clean board-kép a precache-ben (offline). `node --check` OK.

## FÁZIS 2.9 — A VALÓDI board-kép közvetlen beépítése (MOCKUP-kép, felülírva 3.0-ban) (2026-07-08)
- **Iránykorrekció**: a korábbi verzió CSS-diorámával „újrarajzolta" a boardot — ez NEM
  volt jó. Most a **megadott board-artwork (`assets/references/day1_board_target.png`) MAGA
  a campaign screen háttere** (`<img class="board-bg" object-fit:cover>`), rá pozicionált
  interaktív overlay-ekkel. A `visual_style_sheet.png` a másodlagos stílusreferencia.
- **A régi gagyi CSS-gradient/dioráma háttér teljesen kidobva** (bs-sky/skyline/ground/nest
  stb. törölve). A board-kép 1672×941 = pontosan 16:9, a `#stage` mindig 16:9 → a kép
  hézagmentesen kitölti, a hotspotok %-os pozíciója pontosan a festett helyszínekre esik.
- **Overlay-rétegek a képen** (nem rajzoljuk újra a boardot):
  1) `board-bg` = a valódi kép; 2) **hotspot-overlay**: 5 misszió + Scavenge, %-pozícióval a
  festett helyszínek fölött; 3) **állapot/ikon-overlay**: prémium halo + emblem —
  completed (zöld ✓), current (arany pulzáló halo), locked (szürke 🔒), boss (vörös pulzáló
  fészek-marker), scavenge (amber 📦); 4) **HUD-overlay**: „← MENÜ" gomb, élő érme a festett
  érme fölé igazítva, átlátszó kattintózónák a festett SHOP/⚙ fölött; 5) **live mission
  briefing** (a festett briefing-sáv fölé, belépéskor a jelenlegi misszióval): thumbnail,
  státusz, DAY/mission, cím, típus, Cél, VESZÉLY (koponyák), ZSÁKMÁNY (érme+XP), nagy START.
- **Ikon-fejlesztés**: a mission-overlay-ek prémium halo+emblem markerek (nem gagyi blokkok);
  boss fenyegetőbb (vörös pulzáló), current látványosabb (arany pulzáló), completed szebb
  (zöld ✓), locked olvasható de nem rontja a képet, scavenge prémium amber.
- **Csak Day 1** (a board-artwork Day 1-specifikus); a hotspotok a Day 1 misszióira mutatnak;
  a save/day/campaign-logika VÁLTOZATLAN, visszafelé kompatibilis.
- **TESZTELVE** (böngészőben): a board-kép ténylegesen betölt (1672×941) és kitölti a stage-et;
  6 hotspot a helyükön; mission-választás frissíti a briefinget; locked/boss/scavenge állapot;
  campaign→START→loadout→game (lvl2); Scavenge→loadout→game (isFree); SHOP-hitzone→armory;
  ⚙-hitzone→settings; save export/import roundtrip egyezik. **0 konzolhiba.**
- **Viewport-gate ÁTMENT**: desktop 16:9 (kép kitölt); ultrawide 1600×600 (16:9 megőrizve,
  kép kitölt); mobil landscape 812×375 (100% magasság, kép kitölt, hotspotok a helyükön,
  kompakt briefing). A kép SOHA nem kicsi középen; `#stage` közös 16:9 doboz.
- sw.js cache: **zk-v13**; a board-kép a precache-ben (offline). `node --check` mind a JS-re OK.

## FÁZIS 2.8 — Illusztrált Day 1 board (referencia alapján — CSS-verzió, felülírva 2.9-ben) (2026-07-08)
- **Referencia-képek** a repóban: [`assets/references/day1_board_target.png`](../assets/references/day1_board_target.png)
  a **FŐ vizuális cél** (Day 1 board), [`assets/references/visual_style_sheet.png`](../assets/references/visual_style_sheet.png)
  a **másodlagos style sheet**. (Ékezetmentes néven; nem shippelt asset, az sw nem cache-eli.)
- **A 2×2 kártyás board lecserélve illusztrált, hotspot-alapú Day boardra** a referencia
  kompozíciója szerint (`js/ui.js` + `css/style.css`). Réteges architektúra, nem lapos kép:
  1) board háttér (dioráma: ég + skyline-sziluett + talaj + halvány út + boss-fészek izzás +
     köd/parázs/scanline), 2) hotspot-réteg (5 misszió + Scavenge, **% pozícióval** reszponzívan),
  3) állapot-overlay (locked/current/completed/boss), 4) felső HUD, 5) mission briefing, 6) bal nav.
- **Felső HUD**: mini-logó · **DAY 1 badge (biohazard, ◀▶ lapozás) + KARANTÉN UTCA** · 🪙érme ·
  🔫SHOP · ⚙beállítás. **Bal nav**: CAMPAIGN (aktív) · SCAVENGE · BEÁLLÍTÁS.
- **5 hotspot = konkrét helyszín** (nem node): hexagon marker (szám/☠/✔) + landmark-ikon
  (🚧 karantén / 🏪 bolt / 🧱 sikátor / 🗼 védelmi pont) + állapot-pad + cím+státusz felirat.
  Állapotok: locked (szürke+🔒), current (zöld pulzáló pad), completed (zöld ✔), boss.
  **Boss (Gócpont) = külön fertőzött fészek**: nagyobb vörös izzó landmark + skull marker, pulzál.
  **Scavenge Zóna = külön loot-hotspot** (amber láda), nem kampányprogress.
- **Mission briefing bottom-sheet** (referencia szerint): thumbnail · státusz-chip · DAY/mission ·
  cím · típus · **Cél (objektíva)** · **VESZÉLY (5 koponya)** · **ZSÁKMÁNY (🪙 + XP)** · nagy START.
  Boss = vörös vészstílus; zártnál indok + rejtett START. Start → a MEGLÉVŐ loadout→game flow.
- **Ebben a körben csak Day 1** a fókusz (minőségi mintaképernyő); a hotspot-elrendezés bármely
  napra működik (a nap-nav a HUD ◀▶-vel vált), a save/day-logika VÁLTOZATLAN, visszafelé kompatibilis.
- **TESZTELVE** (böngészőben): 6 hotspot, briefing (kampány/boss/scavenge/locked), campaign→START→
  loadout→game (lvl2), Scavenge→loadout→game (isFree), nap-nav (DAY 2), save export/import roundtrip.
  **0 konzolhiba**. **NEM roadmap** — illusztrált hotspot-board (screenshot-igazolt).
- **Viewport-gate ÁTMENT**: desktop 16:9=100%×100%; ultrawide 1600×600=16:9 megőrizve, minden
  hotspot a stage-en belül; mobil landscape 812×375=100% magasság, `@media (max-height:560px)`
  kompakt HUD/nav/hotspot. Nincs „kicsi középen”; `#stage` közös doboz.
- sw.js cache: **zk-v12**. `node --check` mind a JS-re OK.

## FÁZIS 2.7 — DAY-alapú campaign board (2026-07-08) — mi került bele
- **A lineáris roadmap/mission-hub lecserélve DAY-alapú kampányboardra** (Zombie
  Diary-szerű chapter-flow, de saját UI/asset). A kígyózó node-lánc, a zöld progress-
  vonal és az 1–40 roadmap KIVÉVE.
- **Struktúra (const.js CAMPAIGN)**: 1 nap = 5 misszió; az 5. mindig DAY FINALE (boss).
  `MISSIONS_PER_DAY=5`, `ACTIVE_DAYS=20` (=100 misszió), `MAX_DAYS=100` skálázhatóság.
  A save VÁLTOZATLAN numerikus mission-ID (level) — a UI day/mission formában mutatja.
  Helperek: `dayOf/missionInDay/levelOf/dayName/missionTitle`. Napok 1–10 kézzel
  finomított névvel + 5 misszió-címmel; 11–20 formula (ZONE_POOL/MISSION_POOL).
- **A meglévő motor 5-ös csoportjaira képződik**: `isBossLevel`=minden 5. (=finálé),
  `themeFor`=naponta téma, `modeFor`=napon belül irtás/védelem/túlélés/elit/boss.
  Nem kellett új progress-rendszer → visszafelé kompatibilis a régi mentésekkel.
- **STAGES 40→100** + **biztonságos soft-capek** a magas napokhoz: `dmgMul/quota/bossDmg`
  az 1–40 tartományban VÁLTOZATLAN (verifikált balansz), 40 fölött lágyítva
  (pl. quota 100=266 vs 410; bossDmg 100=106 vs 148) → kemény, de nem lehetetlen.
- **DAY selector strip**: 20 vízszintes lapozható nap-kártya (◀▶ nyilak + tap/scroll),
  aktuális kiemelve, zárt/„✔ biztosítva" jelöléssel; a kiválasztott középre görget.
- **DAY board**: fejléc (DAY NN · NÉV · téma + haladás-pöttyök + „x/5 biztosítva”),
  4 mission **helyszín-kártya** 2×2 rácsban (ikon+cím+típus+állapot) + teljes szélességű
  **DAY FINALE / BOSS** landmark (nagyobb, vörös, pulzáló). Nem node-lánc.
- **Mission briefing** (bottom-sheet): DAY szám+név, Mission x/5, pálya #, cím, státusz-
  chip, **objektíva**, hangulati leírás, VESZÉLY-mérő, helyszín, várható zsákmány,
  **ajánlott fegyver**. Boss=vörös vészkártya, zártnál indok + rejtett Start.
- **Progresszió**: Day 1 mission 1 induláskor elérhető; napon belül sorban nyílnak a
  missziók; a finálé teljesítése után a nap „BIZTOSÍTVA” és a következő nap feloldódik
  (a meglévő szekvenciális unlock adja). Régi mentés → helyesen day/mission-re képződik.
- **Free Mode = külön „SCAVENGE ZÓNA”** gomb a board alatt, saját briefinggel; NEM old
  fel napot/missziót (nem kampányprogress).
- **TESZTELVE** (böngészőben): 20 nap-tab, DAY 02 board (4 kártya+finálé, 2/5), briefing
  (nap/mission/objektíva/veszély/ajánlott fegyver), finálé vörös boss-kártya + zárt indok,
  nap-lapozás (DAY 03 ZÁRT), mission→BEVETÉS→loadout→game (lvl8), Free→loadout→game,
  **régi formátumú mentés import** (backward-compat) + board-leképezés, export/import
  roundtrip egyezik, friss játék (Day1 M1 elérhető, többi zárt). 0 konzolhiba.
- **Viewport-gate ÁTMENT**: desktop 16:9=100%×100%; ultrawide 1600×600=16:9 megőrizve,
  kifér; mobil landscape 812×375=100% magasság, `@media (max-height:620px)` kompakt
  board (tap-kártyák), minden kifér. Nincs „kicsi középen”; `#stage` közös doboz.
- sw.js cache: **zk-v11**. `node --check` mind a JS-re OK.

## Robusztus mentésrendszer — adatvesztés-védelem (2026-07-08) — mi került bele
- **Miért**: iOS-en a PWA kezdőképernyőről törlése kiüríti a `localStorage`-t → egy
  játékos elvesztette a haladását (5. pálya). Nincs backend (projektszabály), így
  kliensoldali, több-rétegű védelmet építettünk (`js/save.js`, `js/main.js`, `js/ui.js`).
- **IndexedDB-tükör**: minden `persist()` a localStorage MELLETT az IndexedDB-be is ír
  (`zombikronika/save/main`, tűzd-és-felejtsd). Boot-kor `recover()` fut: ha a localStorage
  üres/alapállapot, de az IDB-ben van érdemi mentés, **automatikusan visszaállítja** +
  visszaírja a localStorage-ba. (A fejlesztés közbeni localStorage-only törlést túléli.)
  A `_ts` időbélyeg dönt, ha mindkét réteg él. `reset()` mindkét réteget alapállapotba írja.
- **`navigator.storage.persist()`** boot-kor (`requestPersistent`): kéri a böngészőt, hogy
  ne törölje magától a tárhelyet (ITP/kilakoltatás elleni best-effort védelem).
- **Fájl-alapú biztonsági mentés** (Beállítások): **💾 LETÖLTÉS** → `zombikronika-mentes-
  ÉÉÉÉ-HH-NN.txt` (a mentés-kód), a Fájlok appba menthető — ez az EGYETLEN, ami a PWA
  törlését is túléli. **📂 FÁJL VÁLASZTÁSA** → import fájlból. A régi kód-másolós
  export/import megmarad.
- **Figyelmeztetés**: a Beállításokban ⚠ piros hint, ha még nincs fájl-mentés
  (`everBackedUp`); fájlmentés után ✔ zöldre vált. `refreshActive()` a boot-recover után
  frissíti az épp látható képernyőt.
- **TESZTELVE** (böngészőben): haladás→persist→IDB, localStorage törlés + **valós reload**
  → boot `recover()` teljes visszaállítás (coins/unlocked/cleared/owned/ammo/upgrade) ✔ ·
  localStorage visszaírva ✔ · fájl-mentés → everBackedUp + zöld hint ✔ · fájl-gombok +
  file-input jelen ✔ · `requestPersistent` hibamentes ✔ · 0 konzolhiba ✔ · viewport
  16:9=100%×100% (Beállítások panel, nincs regresszió). Teszt-adat kitakarítva.
- sw.js cache: **zk-v10** (JS változott). `node --check` mind a JS-re OK.

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
