# MAP / PÁLYA ASSET AUDIT — 2026-07-09

> Cél: felmérni a betett map-fejlesztési anyagokat, a jelenlegi motor-állapotot, és
> megmondani pontosan mi kell egy KÉSZ, prémium pályához (mozgás + lövés + effektek +
> zombik + HD háttér). **Ez elemzés — kód nem változott.**

---

## 1. MI ÉRKEZETT BE (leltár)

Forrás: `assets/references/maps/` — 5 db `level_0X_..._separated_png_assets.zip`
(rétegre bontott PNG export) + 5 teljes koncepció-board + `zombie quarantine street/`.

**Rendszerezve ide** (kibontva, egységes struktúra):
`assets/references/maps/levels/`

```
levels/
  README_FOR_CLAUDE.md          # a készítő útmutatója (render-sorrend, ne fekete-küszöbölj)
  asset_manifest.json           # per-réteg crop-box + méret + forrás
  level_01_quarantine_street/   (79 fájl, 23 MB)   ← a kampány Day 1 témája!
  level_02_quick_mart/          (58 fájl, 28 MB)
  level_03_zombie_alley/        (38 fájl, 16 MB)
  level_04_fortified_checkpoint/(31 fájl, 17 MB)
  level_05_infection_nest_arena/(27 fájl, 14 MB)   ← boss-aréna (vörös, szerves korrupció)
```
**Összesen: 233 fájl, ~97 MB.**

Minden pálya azonos, számozott mappastruktúrával (a render-sorrend = a mappaszám):

| Mappa | Tartalom | Példa méret |
|---|---|---|
| `00_reference` | teljes map + koncepció-board (NEM játékasset) | full_map **1672×941** (16:9) |
| `01_layers` | **far background** + midground stripek (parallax) | far_bg **1392×212**, mid **1002–1390×332–375** |
| `02_midground / 02_main_building` | különálló épületek, víztorony, oszlopok | building **~150×300** |
| `03_props` | kerítés, barikád, hordó, tábla, sátorláda, homokzsák | változó |
| `04_vehicles / 04_ground` | busz, autók, rendőrautó, kuka | bus **618×193** |
| `05_ground` (`03_ground` a 03–05-nél) | **playable ground** strip, út-csempék, járdaszegély | wet_road **1206×100**, tile-sheet 1448×1086 |
| `06_foreground` (`04/05_foreground`) | előtér-törmelék (a játékos ELÉ) | strip |
| `07_effects` (`06_effects`) | **köd/füst, tűz/izzás, rendőr-fény, toxikus zöld, eső, fény-vetület, vörös energia, csáp** | set-ek 525–670×100–245 |
| `08_animated` | animált prop (figyelmeztető lámpa 4-frame; boss-mag 4-frame) | ritka (nagyrészt üres) |

**Minőség:** sötét, cinematikus, **festett HD** — pontosan illik a már beépített HD
ellenség- és katona-sprite-okhoz. A koncepció-boardok fejléce: *"MODULAR · LAYERED ·
PARALLAX READY · GAME-OPTIMIZED · 5+ depth layers · human ~1.8m scale"*.

---

## 2. HOL TARTUNK — MI MŰKÖDIK MÁR (a motorban)

A pálya „összeállításához" **a nehéz rész nagy része KÉSZ**:

| Rendszer | Állapot | Hol |
|---|---|---|
| **Mozgás** (joystick, fizika, kamera) | ✅ kész | `input.js`, `game.js` |
| **Lövés** (8 fegyver, golyó, találat, muzzle) | ✅ kész | `game.js`, `const.js` |
| **Effektek** (muzzle-punch, vér, robbanás, részecske, hitstop, shake) | ✅ kész | `game.js`, `sprites.js` |
| **Zombik** (7 típus HD sprite, spawn, hullám, boss, bloater-burst) | ✅ kész (előző körök) | `enemy_sprites.js`, `game.js` |
| **HD játékos** (katona-sprite) | ✅ kész | `enemy_sprites.js` |
| **PARALLAX háttér-RENDSZER** | ✅ **létezik** — de procedurális | `sprites.js` |
| HD in-game háttér | ❌ **ez hiányzik** (most procedurális pixel-art) | — |

**Kulcs:** a `sprites.js`-ben MÁR van teljes parallax-motor:
`tileLayer(ctx, tile, cam, parallax, bottomY)` — tileli és görgeti a réteget a kamera +
parallax-faktor szerint. 3 téma (`THEMES`: utca/labor/romváros), rétegenként:
`far (0.2) → mid (0.5) → near (0.8) → ground (1.0)` + `decorFor()` prop-elhelyezés.
**Csak a rétegek forrása procedurális** — ide kell bekötni a HD strip-eket.

→ **Nem nulláról építünk parallaxot; a HD rétegeket a meglévő rendszerbe illesztjük.**

---

## 3. GAP-ANALÍZIS — MI KELL EGY KÉSZ HD PÁLYÁHOZ

### 3.1 A #1 technikai munka: RÉTEG-ALFA / COMPOSITING
A stripek **szándékosan sötét (near-black) háttérrel** készültek (a README tiltja a
naiv fekete-küszöbölést). Rétegezéshez:
- **far background + playable ground** = teljes-bleed, ATLÁTSZATLAN → könnyű (alul rajzol).
- **midground / prop / vehicle / foreground** = a near-black KÖRNYEZET-et átlátszóvá kell
  tenni (hogy a far bg átlátsszon a házak KÖZÖTT), a sötét ÉPÜLET-részletek MEGtartásával.
  → **luminancia+él-alapú maszk** (nem küszöb), VAGY a manifest crop-boxai már izolálják a
  tartalmat, VAGY egyedi propoknál kézi vágás. Ez a fő asset-előkészítő lépés.
- **effektek** (tűz, izzás, toxikus, vörös mag, rendőr-fény) = **additív/screen blend**
  (a fekete eltűnik, csak az izzás marad) — ehhez nem kell maszk.

### 3.2 Per-pálya réteg-KONFIG (adat)
Kell egy struktúra: kampány-nap/level → { far, mid, near, ground, foreground, effects[],
props[] } fájlok + parallax-faktorok + y-pozíciók + tileable-e. A meglévő `THEMES` a horog.

### 3.3 Runtime előkészítő tool (mint a button/enemy tool)
`tools/prepare-map-layers.js` (zero-dep): per-pálya far/ground **downscale** játék-felbontásra
(1200px → ~game res), mid/prop **alfa-maszk**, effekt-set **szeletelés** → `assets/maps/`
tiszta runtime rétegek. **97 MB forrás → néhány MB futásidejű asset.**

### 3.4 Talaj + collision igazítás
A `playable_ground` strip teteje = `GROUND_Y`; a talp-vonal (játékos/zombi) erre üljön.
A ground parallax=1 (a kamerával mozog). Minimális igazítás.

### 3.5 Prop-elhelyezés (busz, autók, barikád, hordó)
A `decorFor()` már világ-x szerint rak propokat — a procedurális rajzot lecseréljük HD
prop-képekre (talp-anchor + árnyék, mint a zombiknál). A propok a mid és a játékos között.

### 3.6 Foreground + 5. parallax-réteg
A `06_foreground` a JÁTÉKOS ELÉ kerül (parallax >1). A motor most 4 réteget rajzol
(far/mid/near/ground) — +1 foreground overlay + effekt-overlay = a kért „5+ depth". Kis bővítés.

### 3.7 Effekt-integráció
Köd/füst (lassú pásztázó overlay), tűz/izzás (additív, a romoknál), rendőr-fény
(villogó), toxikus zöld (bloater/spitter közelében), **eső** (atmospheric_particles),
fény-pool (lámpák alatt), boss-aréna vörös mag (pulzáló 4-frame). Illeszkedik a már meglévő
scene-grade/vignetta réteghez.

### 3.8 Pálya-hossz / világ-szélesség
Jelenleg `WORLD_W=1040`. A stripek tileable-ök → tetszőleges hossz. Definiálni kell a
pálya-hosszt + a tileable élek kezelését (a far/ground varratmentes-e — tesztelni kell).

---

## 4. MI HIÁNYZIK / KOCKÁZAT

- **Alfa-maszkolt runtime rétegek** — a mid/prop/foreground stripek NEM játékkészek
  átlátszóság nélkül; ez a fő elvégzendő előkészítés (3.1 + 3.3).
- **Tiling-metaadat** — nincs jelölve melyik strip varratmentesen tileable; tesztelni kell.
- **08_animated szinte üres** — animált propból csak a figyelmeztető lámpa + boss-mag van;
  a mozgás nagy részét kód-vezérelt effekttel adjuk (mint a bloater-burstnél).
- **97 MB forrás** — git-be/Pages-deploybe rakva erősen bloatolná a (már amúgy is lassú)
  deployt. **Ajánlás:** a forrás maradjon `assets/references/`-ben (NE deploy-oljuk), és
  csak a FELDOLGOZOTT, kicsi runtime rétegeket commitoljuk `assets/maps/`-be integráláskor.
- **Perf** — nagy képek 60fps-en: le kell méretezni játék-felbontásra + kevés réteg.

---

## 5. MIRE VAN SZÜKSÉGEM TŐLED (döntések)

1. **Scope**: a 3 procedurális témát cseréljük az 5 HD pálya-környezetre, és a kampány-napokat
   ezekre map-eljük? (Day 1 = Quarantine Street, Day 5 finálé = Infection Nest arena — **pontosan illik**.)
2. **Alfa-stratégia OK?** far/ground teljes-bleed; mid/prop/foreground luminancia+él-maszk;
   effektek additív blend. (Ez a README-vel konform — nincs naiv fekete-küszöb.)
3. **Perf-cél**: leméretezzem a rétegeket ~játék-felbontásra (memória/fps)? Igen/nem.
4. **Forrás a repóban?** Maradjon lokális referencia (nem deploy), csak a feldolgozott
   runtime layer commitolódik? (Ajánlott.)
5. **Melyik pályát prototípusozzam ELŐSZÖR?** Javaslat: **level_01 Quarantine Street** —
   ez a Day 1, és egy „vertical slice"-t tudok építeni: HD parallax háttér + ground + pár
   prop + köd/fény effekt, a MEGLÉVŐ mozgással/lövéssel/zombikkal.

---

## 6. JAVASOLT MENETREND (ha zöld út)

1. `tools/prepare-map-layers.js` — level_01: far+ground downscale, mid/prop alfa-maszk,
   effekt-szeletelés → `assets/maps/level_01/`.
2. `THEMES`/`drawBackground` HD-módú kiterjesztése: image-réteg támogatás (a tileLayer már kész).
3. Level_01 „vertical slice" bekötése (Day 1 in-game háttér) + talaj-igazítás.
4. Foreground + effekt-overlay réteg (5. mélység).
5. HD propok a `decorFor`-ba (busz, autó, barikád) talp-anchorral.
6. Vizuális QA valódi böngészőben (parallax, talaj, perf), majd a többi pálya.

**Becslés:** 1 kész „vertical slice" pálya (level_01, mozgás+lövés+zombik+HD parallax+effekt)
= 1 fókuszált munkakör. A maradék 4 pálya utána nagyrészt konfig + asset-előkészítés.

---

### Összegzés egy mondatban
A **motor kész** (mozgás/lövés/effekt/zombik/HD karakterek + parallax-rendszer);
a betett anyag **prémium, rétegzett, pontosan illik**; a hiányzó láncszem a **HD rétegek
alfa-előkészítése + per-pálya bekötése** — ez egy jól körülhatárolt, elvégezhető munka.
