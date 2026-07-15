# Part-Rig Pipeline — karakter-animáció + testszakadás

> Ez a dokumentum a **jóváhagyott** karakter-megjelenítési módszert írja le
> (part-alapú cutout rig + procedurális juice), és azt, **hogyan kell assetet
> generálni**, hogy illeszkedjen. Erre építjük a többi zombit és a játékost.
>
> Kapcsolódó kód: [`js/part_rig.js`](../js/part_rig.js) · vágó:
> [`assets/sprites/zombies/kobor/cut_parts.py`](../assets/sprites/zombies/kobor/cut_parts.py)
> · demók: `assets/sprites/zombies/kobor/rig-demo.html`, `juice-demo.html`

---

## 0. TL;DR — a módszer egy mondatban

Egy karaktert **külön testrészekre** (fej, törzs, kar, 2 láb) bontunk, mindegyiket
a saját **forgáspontja** körül animáljuk (járás = lengő lábak/kar), halálkor a
részek **fizikai darabként (gib) leszakadnak** — a „élő" érzés többi részét
(rázás, hitstop, vér, hit-flash) procedurális **juice** adja. **Nincs
kép-egymásra-pakolás, nincs statikus kép ringatása.**

Miért: egyetlen statikus képből nem lehet sem rendes oldalnézeti járást, sem
testszakadást csinálni. Mindkettőhöz külön mozgó/leszakítható testrész kell.

---

## 1. A rendszer három rétege

```
1) ASSET   →   2) RIG-CONFIG   →   3) RUNTIME (motor + juice)
   (kép)         (geometria)         (js/part_rig.js + game.js)
```

1. **Asset** – a karakter részekre bontva, valódi átlátszósággal.
2. **Rig-config** – forgáspontok (ízületek), talp-anchor, rajzolási sorrend,
   hangolási paraméterek. Karakterenként egy bejegyzés a `RIGS` regiszterben.
3. **Runtime** – a `ZD.partRig` motor rajzolja/animálja, és halálkor szétdobja a
   részeket. A juice-t a játék meglévő rendszere adja (`st.shake`, `st.hitstop`,
   `st.parts`, decal).

---

## 2. ASSET-GENERÁLÁSI KÖVETELMÉNYEK  ⭐ (ez a legfontosabb rész)

A rig csak akkor lesz jó, ha a generált kép **riggelhető**. Két út van:

### 2/A út — EGY állókép, amit mi vágunk szét (a mostani Kóbor így készült)
Gyorsabb, de csak akkor működik tisztán, ha a **végtagok nem takarják egymást**
(a takart rész „lyukat" hagyna a vágásnál).

**KÖTELEZŐ:**
- **Oldalnézet** (side-scroller), teljes alak, állva, talpon.
- **VALÓDI átlátszó háttér** (PNG alfa). NEM belefestett szürke kockás minta!
  (Ez volt a korábbi bukás — a generátor a „transparent" kockát tömör pixelként
  rárajzolta. Ellenőrzés: az alfa ne legyen mindenhol 255.)
- **Szétnyíló láb-póz:** a két láb legyen kissé **szét/lépésben**, közöttük
  látható **rés** → tiszta bal/jobb láb-vágás.
- **Elhúzott kar:** az elülső kar lógjon kissé **eltartva** a törzstől (rés a
  kar és a test között) → tiszta kar-vágás. (A klasszikus zombi „előre nyúló"
  póz erre tökéletes.)
- **Látható nyak:** a fej üljön a vállak fölött, ne olvadjon a törzsbe → tiszta
  fej-vágás.
- **Konzisztens keret:** az alak vízszintesen középen, talp a kép aljához közel,
  ismert függőleges sávban. Minden karakternél UGYANAZ a keretezés → ugyanaz a
  rig-config sablon, minimális kézi méréssel.

**TILOS / kerülendő:**
- Szemből/háromnegyedes nézet (nem oldalnézet).
- Fegyver/prop, ami átfedi a végtagokat (elrontja a vágást).
- Egymást takaró karok/lábak (occlusion → lyuk a vágásnál).
- Belefestett háttér, keret, talaj-árnyék a képen (mi rajzoljuk az árnyékot).

### 2/B út — KÜLÖN megrajzolt részek (prémium, ajánlott a jövőre)
A generátor **eleve külön testrészeket** ad (fej, törzs, elülső kar, hátsó kar,
comb×2, lábszár×2), mindegyik **teljes, átlátszó** — a törzs a kar mögött is
komplett. Így **nincs occlusion-lyuk**, és külön kar/comb/lábszár is lengethető
(valódi ízületek). Ez a hosszú távú cél a csúcsminőséghez.

### Kész prompt-sablon (2/A úthoz)
```
Full-body SIDE VIEW of a [KARAKTER LEÍRÁS], standing, game character sprite,
mid-stride stance with legs slightly apart (clear gap between the two legs),
one arm hanging slightly away from the torso, head clearly above shoulders,
TRUE TRANSPARENT BACKGROUND (alpha, NOT a painted checkerboard), no ground,
no shadow, no frame, no weapon overlapping the limbs, centered, feet near
bottom edge, high detail, [STÍLUS: dark gritty comic].
```
Méret: 1024×1024 (nyugodtan nagy — a motor leskálázza). Formátum: PNG alfával.

### QA-ellenőrzés generálás után (kötelező)
```
py -c "from PIL import Image; im=Image.open('X.png').convert('RGBA'); \
a=im.split()[-1]; print('van atlatszo?', a.getbbox()!=(0,0)+im.size)"
```
Ha az alfa `getbbox` az egész képkocka → **nincs valódi átlátszóság**, a kép
hibás (belefestett háttér), újra kell generálni / le kell kulcsolni.

---

## 3. A vágás (cut_parts.py) — 2/A út

A [`cut_parts.py`](../assets/sprites/zombies/kobor/cut_parts.py) egy állóképet
maszkol 5 részre, **y-sávok + x-vágás** alapján. Minden part **teljes-vászon
(1024×1024)** PNG, csak a saját régiója látszik → tökéletes illeszkedés.

A Kóbor tényleges vágási határai (a `kobor_raw.png` tartalom-elemzéséből):

| Part | Szabály | Megjegyzés |
|---|---|---|
| `head` | `y < 238` | fej + nyak |
| `torso` | `222 ≤ y < 658` ÉS nem-kar | törzs + hátsó kar (átfed a fejjel/lábbal) |
| `arm_front` | `400 ≤ y ≤ 648` ÉS `x ≥ 546+(y-400)·0.16` | elülső, eltartott kar (ferde vágóvonal) |
| `leg_left` | `y ≥ 606` ÉS `x < 497` | bal láb |
| `leg_right` | `y ≥ 606` ÉS `x ≥ 497` ÉS nem-kar | jobb láb |

Az **átfedések** (pár px) szándékosak: elrejtik a varratokat, ha egy rész elfordul.
Új karakternél ezeket a határokat kell újramérni (lásd 5. pont).

---

## 4. A rig-config — koordináta-rendszer és forgáspontok

Minden geometria az **1024×1024 képtérben** van (felül-bal az origó, y lefelé nő).
A `RIGS[type]` bejegyzés a `js/part_rig.js`-ben. A Kóbor konkrét értékei:

```js
anchor:  { x:497, y:920 }        // TALP a talajon (ide kerül a GROUND_Y)
contentH: 811                    // fej-teto(109) → talp(920): erre skálázunk
height:   46                     // kirajzolt magasság (logikai px, a walkerhez)
pivots: {                        // ízületek = forgáspontok
  neck:     { x:628, y:236 },    // fej forog a nyak körül
  shoulder: { x:560, y:415 },    // kar forog a váll körül
  hipL:     { x:455, y:618 },    // bal láb forog a bal csípő körül
  hipR:     { x:545, y:618 },    // jobb láb forog a jobb csípő körül
}
cent: {                          // testrész-KÖZÉPPONTOK (a gib e körül pörög)
  head:{x:563,y:173}, torso:{x:512,y:440}, arm_front:{x:591,y:524},
  leg_left:{x:371,y:763}, leg_right:{x:617,y:764},
}
order: ['leg_left','torso','head','leg_right','arm_front']  // hátulról előre
```

**Hogyan mérjük egy új karakternél** (a vágott partok bbox-aiból):
- `anchor` = a talp képpontja (x = az alak vízszintes közepe, y = a lábfej alja).
- `pivot` (ízület) = ahol a rész a testhez csatlakozik: **nyak** = a fej alsó
  közepe; **váll** = a kar felső vége; **csípő** = az adott láb felső közepe.
- `cent` = a part befoglaló dobozának közepe (`getbbox` → középpont).
- `contentH` = anchor.y − (fej-teto y). A `height` a kívánt on-screen magasság.

---

## 5. A runtime motor — `ZD.partRig` (js/part_rig.js)

Újrafelhasználható, **típusonként bővíthető** modul. Publikus API:

| Metódus | Mit csinál |
|---|---|
| `load()` | betölti a part-képeket + fehér hit-flash maszkokat |
| `has(type)` | van-e (betöltött) rig ehhez a típushoz |
| `draw(ctx, z)` | élő karakter rajza: járás/idle póz + talaj-árnyék + hit-flash |
| `spawnGibs(z)` | halálkor: a részek leszakadnak (fizikai gibek) |
| `update(dt)` | a gibek fizikája (gravitáció, pattanás, megnyugvás) |
| `drawGibs(ctx)` | a leszakadt részek rajza (kamera-téren belül!) |
| `reset()` | gibek törlése (új pálya) |

**Póz-logika:** ha `z.moving` → a lábak `sin(phase·cadence)·legSwing` szerint
**ellentétesen** lengenek, a kar `·armSwing`, + fej-billegés + test-bob. Ha nem
mozog → idle „légzés". A `z.phase`-t a játék adja.

**Bekötés a játékba** (5 kis horog, mind `has()`-védett → biztonságos fallback):
1. `main.js` → `ZD.partRig.load()`
2. `sprites.js drawZombie` teteje → walker: `partRig.draw`; halott walker: nincs
   holttest (a gibek kezelik) → `return`
3. `game.js killZombie` → `partRig.spawnGibs(...)` + `st.shake`
4. `game.js update` → `partRig.update(dt)`
5. `game.js render` (a `st.parts` után, **kamera-transzformon belül**) →
   `partRig.drawGibs(ctx)` · `start()` → `partRig.reset()`

Ha a part-képek nem töltenek be, `has()` false → a régi atlasz/procedurális rajz
megy tovább (nincs összeomlás).

---

## 6. Hangolás (behangolt értékek)

A demóban élő csúszkákkal hangoltuk (`rig-demo.html`). A Kóbor beégetett értékei:

| Paraméter | Érték | Hol |
|---|---|---|
| `legSwing` | 10° | láblengés amplitúdó |
| `armSwing` | 5° | karlengés amplitúdó |
| `cadence` | 2.0 | járásütem-szorzó (× `z.phase`) |
| gib „force" | 1.0 | szétrepülés-erő szorzó |
| vér | 2× szándék | a killZombie vér-mennyisége |
| gravitáció | `C.GRAVITY` (620) | a játék saját gravitációja |

A gib-indítási sebességek (`GIB_SPEC` a part_rig.js-ben) a játék ~46px skálájára
hangoltak (fej felpattan legmagasabbra, törzs hátra, kar előre, lábak le).

---

## 7. Új karakter hozzáadása — lépésről lépésre

1. **Generálj** assetet a 2. pont szerint (oldalnézet, valódi alfa, szétnyíló
   láb + eltartott kar). Ellenőrizd az átlátszóságot (QA-parancs).
2. **Vágd** részekre (`cut_parts.py` másolata a karakter határaival), VAGY
   generáld eleve külön részként (2/B út).
3. **Mérd** ki a rig-configot (anchor, pivots, cent) a partok bbox-aiból (4. pont).
4. **Vedd fel** a `RIGS`-be egy új bejegyzésként (típus = a játékbeli enemy-type,
   pl. `runner`, `brute`, vagy a `player`).
5. **Hangold** (demo-szerű csúszkákkal, ha kell) és égesd be az értékeket.
6. **Teszteld** a játékban (a `has(type)` automatikusan aktiválja).

A zombi-típusok már léteznek a játékban (`walker/runner/bloater/spitter/brute/
crawler/boss`) — csak part-készlet + `RIGS`-bejegyzés kell mindegyikhez. A
**játékos** külön draw-úton megy (`drawPlayer`), ahhoz egy hasonló horog kell.

---

## 8. Jelenlegi állapot, korlátok, következő lépések

**Kész:** Kóbor (`walker`) — járás (külön lábak + kar) + testszakadás, a játékba
integrálva (main d306b91..8a41b03). A többi zombi még a régi atlasz-rajzot használja.

**Korlátok (őszintén):**
- A Kóbor **egyetlen állóképből kivágott** rig, nem célra-rajzolt részek → „elég
  jó", nem csúcsminőség. A **hátsó** kar a törzzsel marad (nincs külön hátsó-kar
  lengés). A prémiumhoz a 2/B út (külön rajzolt részek) kell.
- Kis méreten (~46px) a részletek/varratok halványabbak — a fő élmény a halál.
- A gib-képek 1024px-esek, futásidőben leskálázva; sok egyszerre → érdemes lehet
  előre-renderelt kis vászonra optimalizálni (perf, későbbi lépés).

**Következő lépések:**
1. Játékteszt visszajelzés alapján finomhangolás (cadence/méret).
2. A pipeline kiterjesztése a többi zombira és a játékosra (mindegyikhez saját
   part-készlet + `RIGS`-bejegyzés).
3. Opcionális: a 2/B (külön rajzolt részek) út bevezetése a csúcsminőséghez.
4. Perf-optimalizáció (előre-renderelt part-vásznak), ha sok egyed lesz.
