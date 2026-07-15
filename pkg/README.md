# Zombi Krónika — Asset csomag

> **Ez a csomag NEM tartalmazza a képeket** — azokat a Higgsfield generálásokból
> neked kell lementened. A csomag a **mappa-vázat, a kódot és a szkripteket**
> adja, plusz ez a README pontosan megmondja, melyik kép hova megy.

---

## 1. Mit hova ments (a chat-ben generált képek)

### Zombik — `_raw.png` végződéssel, a saját mappájukba
| Generált kép | Mentsd ide |
|---|---|
| Kóbor (walker) | `assets/sprites/zombies/kobor/kobor_raw.png` |
| Runner (iramodó) | `assets/sprites/zombies/runner/runner_raw.png` |
| Crawler (mászó) | `assets/sprites/zombies/crawler/crawler_raw.png` |
| Spitter (köpő, sárga-zöld) | `assets/sprites/zombies/spitter/spitter_raw.png` |
| Bloater (puffadt, lila) | `assets/sprites/zombies/bloater/bloater_raw.png` |
| Brute (behemót) | `assets/sprites/zombies/brute/brute_raw.png` |
| Boss (ha lesz) | `assets/sprites/zombies/boss/boss_raw.png` |

### Karakterek
| Generált kép | Mentsd ide |
|---|---|
| Farkas (soldier) | `assets/sprites/characters/farkas/farkas_raw.png` |
| Szellem (scavenger) | `assets/sprites/characters/szellem/szellem_raw.png` |
| Angyal (medic) | `assets/sprites/characters/angyal/angyal_raw.png` |
| Medve (heavy) | `assets/sprites/characters/medve/medve_raw.png` |
| Szikra (hunter/tech) | `assets/sprites/characters/szikra/szikra_raw.png` |

### Fegyverek — mind az `assets/sprites/weapons/` mappába
`w1_m9.png` · `w2_vipera.png` · `w3_soretes.png` · `w4_ak.png` ·
`w5_langszoro.png` · `w6_minigun.png` · `w7_rpg.png` · `w8_ion.png`

*(A sorrend a `const.js`-ed fegyver-sorrendjét követi.)*

### VFX + UI — `assets/fx/` és `assets/ui/`
`blood_splatter_sheet.png` · `wound_stump.png` · `impact_spark.png` ·
`muzzle_flash.png` · `flame.png` · `explosion_sheet.png` · `rocket.png` ·
`acid_spit.png` · `coin.png` · `grenade.png`

---

## 2. Ellenőrzés — futtasd le, ha bedobtad a képeket

```bash
python tools/verify_assets.py
```

Kiírja, mi hiányzik, és — ami a legfontosabb — **melyik képen nincs valódi
átlátszóság**. A zombiknál/karaktereknél ez kritikus: átlátszóság nélkül a
part-vágás használhatatlan. Amelyik pirosan jön ki, azon futtass
háttér-eltávolítást (Higgsfield `remove_background`), és mentsd felül.

---

## 3. Part-rig workflow (zombik + karakterek)

Entitásonként két lépés. Példa a Runnerrel:

```bash
cd assets/sprites/zombies/runner

# 1) Automata kimérés  ->  runner_cuts.json + runner_rig.txt
python ../../../../tools/measure_rig.py --input runner_raw.png --name runner --facing left

# 2) Vágás + előnézet  ->  head/torso/arm_front/leg_back/leg_front.png
python ../../../../tools/cut_parts.py --cuts runner_cuts.json
```

**Fontos, őszintén:** a `measure_rig.py` egy **jó kiindulópontot** ad, nem
tökéletes végeredményt. Tapasztalat alapján:
- fej / törzs / lábak → általában elsőre jó
- **elülső kar → gyakran kézi finomhangolást igényel**

**Ha a kar rossz** (a `cut_parts.py` kiírja, ha egy part majdnem üres):
nyisd meg a `<név>_cuts.json`-t, és állítsd az `arm_front` blokk értékeit
(`y0`, `y1`, `edge_x`, `slope`), majd futtasd újra a `cut_parts.py`-t.
**Nem kell újragenerálni a képet.**

Mindig nézd meg a `<név>_preview.png`-t:
🔴 fej · 🔵 elülső kar · 🟢 törzs · 🟡 hátsó láb · 🟣 elülső láb

### `--facing` paraméter
A karakter merre néz a képen. A Runner pl. `left` (fej a jobb oldalon, de a
test balra dől). Ha rosszul adod meg, a kar-vágás a rossz oldalon keresi a kart.

### Végül: RIGS bejegyzés
A `<név>_rig.txt` tartalmát másold a `js/part_rig.js` `RIGS` regiszterébe.
Az értékek kiindulópontok — a `legSwing`/`armSwing`/`cadence` hangolható
(a `rig-demo.html`-lel, ahogy a Kóbornál).

---

## 4. VFX workflow

A vérfoltos lapot egyszer kell szeletelni (univerzális, minden entitásra):

```bash
python tools/slice_vfx_sheet.py --input assets/fx/blood_splatter_sheet.png \
  --output-dir assets/fx --cols 3 --rows 2 --prefix splat
```

Ha 0 vagy 1 darabot talál, próbáld más `--cols/--rows` értékkel (2x2, 3x3) —
a generált lap elrendezése nem mindig pontosan 3x2.

Ugyanez a robbanás-sheetre (ha rács-elrendezésű lesz):
```bash
python tools/slice_vfx_sheet.py --input assets/fx/explosion_sheet.png \
  --output-dir assets/fx --cols 4 --rows 2 --prefix boom
```

---

## 5. Mi van a csomagban

```
js/
  blood-fx.js          VFX modul (vér, sebek, szikra, rázás, villanás)
tools/
  measure_rig.py       automata anatómia-mérő -> cuts.json + rig.txt
  cut_parts.py         generikus vágó + színkódolt előnézet
  slice_vfx_sheet.py   VFX-lap szeletelő + manifest
  verify_assets.py     QA: alfa-ellenőrzés + hiánylista
assets/                a mappa-váz, ide kerülnek a képek
docs/                  ide teheted a PART_RIG_PIPELINE.md-t
```

**Megjegyzés a `js/`-hez:** a `blood-fx.js` a te meglévő `js/part_rig.js`-ed
mellé kerül. A projektedben már van saját `part_rig.js` motor (juice, gibek) —
a `blood-fx.js` azt **kiegészíti** a textúra-alapú vér/seb/szikra réteggel,
nem váltja ki.

---

## 6. Ajánlott sorrend

1. Ments le minden képet a fenti nevekkel/helyekre
2. `python tools/verify_assets.py` → javítsd az alfa-hibás képeket
3. Zombinként/karakterenként: `measure_rig.py` → `cut_parts.py` → nézd az előnézetet → ha kell, hangold a JSON-t
4. `slice_vfx_sheet.py` a vér-lapra
5. `RIGS` bejegyzések bemásolása a `js/part_rig.js`-be
6. Teszt a játékban
