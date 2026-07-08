# RENDERING RULES — Zombi Krónika

> Ez a fájl a render/viewport **invariánsokat** rögzíti. Minden gameplay, UI, map,
> ammo, boss, shop vagy grafikai módosítás UTÁN ellenőrizni kell, hogy a canvas
> scaling nem romlott el. Ez egy **regressziós biztonsági háló**.

## Canvas / Viewport Invariant

A játék canvas mérete és viewport kezelése kritikus invariáns.

Tilos regresszió:
- A játék nem jelenhet meg kicsiben középen.
- Nem lehet hatalmas fekete üres tér a játék körül.
- A game stage nem lehet kis beágyazott téglalap a képernyő közepén.
- A world render, HUD, háttér, karakterek és touch gombok nem lehetnek külön skálázási rendszerben.
- A játékterületnek landscape nézetben desktopon és mobilon is a képernyő nagy részét ki kell töltenie.
- Letterbox csak minimális és kontrollált lehet.
- A camera zoom és a canvas scaling nem ugyanaz.
- A kis képet nem szabad kizárólag camera zoommal javítani.
- Először a canvas/stage/viewport méretezést kell rendbe tenni.

## Canonical layout pipeline

1. viewport méret meghatározása;
2. game aspect ratio meghatározása;
3. canvas CSS méret számítása;
4. devicePixelRatio szerinti belső canvas méret;
5. world render;
6. HUD render;
7. touch overlay igazítása ugyanarra a vizuális méretre.

## Jelenlegi megvalósítás (a valós kódhoz igazítva)

A projekt a fenti elvet így valósítja meg — a lényeg, hogy **egyetlen közös
skálázott doboz** (`#stage`) tartalmazza a canvast, a HUD-ot, a touch-gombokat ÉS
a menüket, tehát nincs külön skálázási rendszer.

- **Fix belső render-buffer**: `cv.width = VIEW_W*RS = 960`, `cv.height = VIEW_H*RS = 540`
  (`js/main.js`, `RS=2`). A logika 480×270-ben fut; a `ctx` `setTransform(RS,0,0,RS,0,0)`.
  A DPR-t itt a fix 2× belső felbontás + `image-rendering: pixelated` helyettesíti —
  a pixel-art éles marad. (Ha valaha DPR-alapú méretezésre váltunk, az invariáns
  ugyanaz: a stage töltse ki a viewportot, min. letterbox.)
- **Stage-illesztés** (`fit()` a `js/main.js`-ben): `scale = min(innerW/VIEW_W, innerH/VIEW_H)`,
  majd `#stage` CSS mérete `VIEW_W*scale × VIEW_H*scale`. Így a 16:9 doboz a
  képernyő nagy részét kitölti, a letterbox minimális. Újraszámol `resize`,
  `orientationchange` és `load` eseményre.
- **Egy közös doboz**: a canvas, `#hud`, touch-overlay és menük mind a `#stage`
  gyereke (`css/style.css`), így egyszerre, arányosan skálázódnak — nincs
  „canvas kicsiben, HUD az ablakhoz" szétesés.
- **Camera zoom ≠ canvas scaling**: a `C.ZOOM=1.75` KIZÁRÓLAG a world-render
  nagyítása (a kamera szűkebb logikai látómezőre clampel, `js/game.js`), NEM a
  canvas/stage méretezése. A kis-kép problémát SOHA nem camera zoommal javítjuk —
  előbb a stage/viewport méretezést kell rendbe tenni.

## Regresszió-ellenőrzés (kötelező minden érintő változtatás után)

Bármely gameplay / UI / map / ammo / boss / shop / grafikai módosítás után:

1. `node --check` minden JS fájlra (0 hiba).
2. Preview (localhost:8080) desktop nézet: a `#stage` a viewport nagy részét
   kitölti, nincs nagy fekete keret, a HUD a játéktérhez igazodik.
3. Mobil/landscape méret (pl. preview_resize): a stage arányosan skálázódik,
   a touch-gombok a canvasszal egy dobozban maradnak, min. letterbox.
4. Ha a canvas kicsiben, középen, nagy üres térrel jelenik meg → REGRESSZIÓ,
   javítás a `fit()` / `#stage` CSS szinten, NEM camera zoommal.
