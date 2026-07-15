# Zombi Krónika — Sprite Produkciós Dokumentáció
*Verzió 1.0 — 2026.07.13.*

---

## 1. Diagnózis — miért hat "gagyinak" jelenleg

Mielőtt nekiállnánk a generálásnak, érdemes tisztázni, hogy AI-generált game sprite-oknál 90%-ban ugyanaz az 5 hiba okozza az amatőr hatást. Szinte biztos, hogy ezek közül kettő-három nálad is jelen van:

1. **Inkonzisztens kameraszög/perspektíva** — minden generálás kicsit más szögből "látja" a karaktert, ezért a sprite-ok nem illenek egy közös vizuális térbe.
2. **Inkonzisztens fényforrás** — az egyik sprite-on balról, a másikon szemből jön a fény → a karakterek úgy néznek ki, mintha külön világból lennének kivágva.
3. **Nincs egységes színpaletta** — minden generálás "kitalálja" a saját színeit, ezért a képernyőn kaotikus, össze nem illő a paletta.
4. **Nincs kontúr/sziluett-stratégia** — pixelnél nagyobb felbontású, "photoreal AI" stílusú kép kis méretben (64–128px) elmosódik, olvashatatlanná válik mozgásban.
5. **Statikus pózból animáció** — egy darab AI kép nem animáció. Ha csak egy állókép van mozgatva/nyújtva kódból, az mindig béna lesz.

A dokumentum célja, hogy ezt az 5 pontot **rendszerszinten** kizárja: ne minden generálásnál újra döntsünk stílusról, hanem egy rögzített szabálykönyv (art bible) alapján, ismételhető módon dolgozzunk.

---

## 2. Art Bible — a vizuális stílus rögzített szabályai

Ezt minden promptba be kell építeni, szó szerint, változtatás nélkül. Ez a "stílus-anchor".

**Nézőszög (kamera) — KORRIGÁLVA:**
- **Oldalnézet (side-scroller/profile view)**, nem top-down — a karakter és a zombik oldalról látszanak, a mozgás balra-jobbra történik a képernyőn.
- A karakter mindig **pontosan oldalra néz** (90°-os profil), a kód a sprite-ot vízszintesen tükrözi (flip), ha a másik irányba kell mozognia — így elég **egy irányban** legenerálni mindent, nem kell külön bal/jobb verziót kérni.
- Rögzített kameramagasság (szemmagasság körüli, enyhén alulról vagy szemből), nulla perspektivikus torzítás.
- **Prompt-kulcsszó, mindig ugyanaz:** `strict side view, 90-degree profile, character facing right, 2D side-scroller game camera, flat orthographic framing, no perspective distortion, no 3/4 angle, not a front-facing portrait`

**Fényforrás:**
- Egyetlen fő fényforrás, felülről–balról, ~45°-ban, hideg tónusú (holdfény/vészvilágítás hangulat).
- Másodlagos, gyenge rim-light (szegélyfény) a sziluett kiemelésére sötét háttér előtt.
- **Prompt-kulcsszó:** `single key light from upper-left at 45 degrees, cold moonlight tone, subtle rim light for silhouette separation, consistent shadow direction`

**Színpaletta (rögzítve, hex kódokkal):**
| Szerep | Szín | Hex |
|---|---|---|
| Alap sötét háttér/ruha | szinte fekete kék-szürke | `#0D1117` |
| Másodlagos sötét | sötét acélszürke | `#232A34` |
| Bőr/semleges közép tónus | hideg szürkésbarna | `#5A5348` |
| Player-frakció accent (neon) | elektromos cián | `#00D9FF` |
| Zombi accent (neon) | mérgező zöld | `#6FBF3F` (izzó verzió: `#39FF14`) |
| Veszély/boss accent | neon lila-magenta | `#B026FF` |
| Vér/seb accent | tompított vörös | `#C4213B` |

Ez a paletta MINDEN sprite-on visszaköszön — a karakterek egyedi ruhaszíne variálható, de az **accent-neon és az alap sötét bázis fix.**

**Kontúr / sziluett-stratégia:**
- Nincs klasszikus fekete komplett outline (az AI-stílushoz nem illik), helyette: **erős value-kontraszt + neon rim-light** adja a sziluettet.
- Minden karakter/zombi sziluettjének 64×64 px-es kicsinyítésben is felismerhetőnek kell lennie kontúr nélkül is (lásd QA checklist).

**Részletezettségi szint:**
- "Semi-realistic painterly", ne fotórealisztikus, ne cell-shaded anime — ez a Zombie Diary-nál is jellemző köztes stílus, ami jól skálázódik kis felbontásban is.
- **Prompt-kulcsszó:** `semi-realistic painterly game art style, moderate detail, readable at small scale, not photorealistic, not cel-shaded anime`

**Konzisztencia-mondat (mindig illeszd a prompt végére):**
> `Consistent with the "Zombi Krónika" game art style: dark neon-glow post-apocalyptic, cold moonlit lighting, cyan/toxic-green accent colors, strict 2D side-scroller profile view.`

---

**Stílus-anchor megerősítve (HADMŰVELETI TÉRKÉP alapján):**
A feltöltött tábor-térkép pontosan ezt az irányt igazolja vissza: festői, izometrikus/top-down, sötét alap + éles színes fényfoltok zónánként. Ez alapján a **zóna-színek frakció-kódként** is szolgálhatnak a karaktereknél és a zombiknál (lásd 4–5. pont), így a sprite-ok és a háttér-környezet egy vizuális nyelvet beszélnek:

| Zóna a térképen | Szín | Játékbeli jelentés |
|---|---|---|
| Karantén/fertőzött terület | toxikus zöld | zombi-accent, fertőzés |
| Őrtorony/katonai perem | hideg kék | player-frakció fő accent |
| Tábortűz/közösségi tér | meleg narancs/amber | túlélő tábor, "otthon" érzés |
| Ládák/anomália zóna | neon lila | különleges tech/anomália |
| Szörny-fészek | pulzáló vörös | boss/veszély-accent |

---

## 3. Technikai specifikáció

**Munkafelbontás (AI generáláshoz):**
- Generálj **1024×1024**-es (vagy nagyobb) képet, majd **downscale**-eld a cél méretre. A supersampling (nagyban generálni, kicsire kicsinyíteni) sokkal tisztább élt és kevesebb AI-zajt/artifaktot ad, mint közvetlenül kis méretben generálni.

**Cél sprite méretek (játékban):**
- Player karakterek: **128×128 px** sprite sheet cellánként
- Zombik (normál): **96×96 px**
- Boss/elit zombik: **192×192 px** vagy **256×256 px**
- PNG, alfa csatornás átlátszó háttér, power-of-2 sheet méret a GPU-barát betöltéshez

**Sprite sheet elrendezés:**
- Soronként egy animáció (state), oszloponként egy frame
- Fix cellaméret + 2–4 px padding cellák között (elkerüli a "bleeding" hibát textúra-szűrésnél)
- Pivot pont mindig a talp közepén (lábfej-vonal), hogy a kollízió/pozicionálás konzisztens legyen

**Fájl- és mappastruktúra:**
```
/assets/sprites/
  /characters/
    /char_01_nev/
      idle.png  walk.png  attack.png  hurt.png  death.png
      char_01_nev_meta.json   ← frame count, FPS, pivot, hitbox
  /zombies/
    /zmb_01_walker/
      ...ugyanez...
  /_reference/
    style_anchor_master.png   ← az első, jóváhagyott "etalon" kép, erre hivatkozol vissza minden új generálásnál
```

**Névkonvenció:** `[kategória]_[sorszám]_[név]_[animáció]_[frame].png`
Példa: `zmb_03_futo_walk_04.png`

---

## 4. Játszható karakterek — roster (5 db)

A térkép öt zónájából inspirálva, mindegyik karakter egy zónához köthető identitással:

| # | Callsign (név) | Archetípus | Szerep gameplay-ben | Zóna-kötődés / accent |
|---|---|---|---|---|
| 1 | **Farkas** (Kovács Bence) | Roham/közelharc, ex-katona | Gyors, magas DPS közelharcban | Őrtorony zóna → hideg kék + acélszürke páncél |
| 2 | **Szellem** (Tóth Léna) | Mesterlövész/felderítő | Nagy hatótáv, alacsony HP, éjszakai álca | Karantén zóna pereme → sötétzöld terepszín + kék rim-light |
| 3 | **Medve** (Nagy Gábor) | Nehézgéppuskás/tank | Magas HP, lassú, frontvonal | Tábortűz zóna → meleg amber highlightok + rozsdás páncéllemez |
| 4 | **Angyal** (Varga Dóra) | Orvos/támogató | Gyógyítás, csapat-buff | Őrtorony zóna → fehér-türkiz kereszt jelzés, hideg kék |
| 5 | **Szikra** (Fekete Márk) | Technikus/anomália-szakértő | Csapdák, robbanó és energia-fegyverek | Anomália/láda zóna → neon lila accent + sárga-fekete figyelmeztető csík |

*A ruházat sötét bázisa (2. pont palettája) mindenkinél közös — a fenti zóna-accent adja az egyéni karaktert, miközben az egész csapat egy csapatnak látszik.*

*Minden karakternél az arc/sziluett egyedi legyen, de a ruházat sötét bázisa (2. pont palettája) és a cián accent egységesen visszaköszönjön — ez adja a "csapat" vizuális összetartozását.*

---

## 5. Zombi tipológia — 5–8 típus, degradáció-alapú rendszer

A Zombie Diary-stílus egyik erénye, hogy a zombitípusok **egyértelműen felismerhetők mozgás közben is**, pusztán sziluett alapján. Javasolt rendszer: minden típusnak saját **mozgásmintázata + sziluett-torzulása** van, nem csak a textúrája más.

| # | Név | Típus | Sziluett-jellemző | Viselkedés | Veszély-szint |
|---|---|---|---|---|---|
| 1 | **Kóbor** | Walker (alap) | Görnyedt, szimmetrikus | Lassú, egyenes vonalban követ | Alacsony |
| 2 | **Iramodó** | Futó (Runner) | Előredőlt, hosszú végtagok | Gyors sprint, kiszámíthatatlan irányváltás | Közepes |
| 3 | **Puffadt** | Dagadt/Bloater | Túlméretezett törzs, aszimmetrikus | Lassú, halál esetén AoE gázrobbanás | Közepes-magas |
| 4 | **Sikoltó** | Csontváz-mutáns (Screamer) | Vékony, csontos, karok felfelé | Sikoltás → többi zombit odahívja | Közepes (támogató típus) |
| 5 | **Vasbordás** | Páncélos/Tank zombi | Széles váll, fém-lemez implantok | Magas HP, lassú, blokkolja a lövedéket elölről | Magas |
| 6 | **Csúszó** | Mászó (Crawler) | Alacsony, féltest hiányzik | Talajon kúszik, nehéz eltalálni | Közepes |
| 7 | **Éjlopó** | Stalker | Vékony, szinte fekete sziluett | Csak árnyékban mozog, meglepetés-támadás | Magas |
| 8 | **A Vérmag** (boss) | Mutált Óriás / fészek-entitás | Aránytalanul nagy, tüskés, pulzáló vörös maggal a mellkasban — közvetlen utalás a térkép vörös fészek-struktúrájára | Terület-támadás, több fázisú harc, sebezhető "mag" pont | Nagyon magas |

*Az összes zombi közös alap-anatómiából induljon ki (ugyanaz a csontváz-arány, ugyanaz a fényezés-szabály), és csak a torzulás/mutáció mértéke, illetve a neon-zöld izzási pontok (szem, sebek, gerinc) helye különböztesse meg őket. **A Vérmag** kivétel: nála a zöld helyett a térkép fészkéhez hűen pulzáló vörös/magenta izzás a domináns accent — ő vizuálisan is jelzi, hogy más "családból" jön, mint a sima fertőzöttek.*

---

## 6. Animáció terv

AI-ból teljes, kézzel animált frame-sorozatot kérni **nem hatékony** — inkonzisztens lesz frame-ről frame-re. Két reális stratégia:

**A) Ajánlott: kevés kulcs-frame + kód-oldali interpoláció**
Mivel side-scroller a nézet, **egy irányban** (jobbra néző profil) kell csak legenerálni mindent — a másik irányhoz a kód vízszintesen tükrözi (`ctx.scale(-1,1)` vagy CSS `transform: scaleX(-1)`). Generálj **1 statikus póz-referenciát** state-enként, majd a mozgást (járás-bólogatás, kar-lengés, fegyver-imbolygás) **kódból, egyszerű transzformációkkal** (bounce, sprite squash/stretch, réteges végtag-mozgatás) old meg. Ez sokkal olcsóbb és konzisztensebb, mint 6-8 AI-frame egyeztetése.

**B) Ha valódi frame-sorozat kell:** generálj egy jóváhagyott "etalon" állóképet, majd **ugyanazt a referenciaképet** használd minden további generáláshoz bemenetként (lásd 7. pont — Elements), és csak a pózt írd át a promptban. Így a stílus/szín/karakter azonos marad, csak a testtartás változik.

**Javasolt state-gép és frame-szám (B stratégiához):**

| Állapot | Frame szám | FPS | Megjegyzés |
|---|---|---|---|
| Idle | 4 | 6 | finom légzés/imbolygás |
| Walk/Move | 6 | 10 | teljes ciklus |
| Attack | 4–6 | 12 | felütés-becsapódás-visszahúzás |
| Hurt/Hit reaction | 2 | 8 | rövid, éles |
| Death | 6–8 | 10 | nem loop |
| Spawn/Scream (csak bizonyos zombiknál) | 4 | 8 | egyedi típusoknál |

---

## 7. Higgsfield MCP munkafolyamat — konzisztencia elérése generálás közben

Mivel te már a Higgsfield MCP-t (nano_banana_pro) használod, van pár konkrét funkció, ami **kifejezetten a te problémádat oldja meg** (a "minden generálás máshogy néz ki" jelenséget):

**7.1 — Reference Elements (a legfontosabb eszköz neked)**
A Higgsfieldben létre tudsz hozni egy újrafelhasználható "Element"-et (karakter/prop/környezet referencia) egyetlen jóváhagyott képből. Utána **minden további generáláshoz be tudod húzni ugyanazt a referenciát** a promptba, így az AI nem "találja ki" újra a karaktert minden alkalommal, hanem az adott referenciaképhez igazodik. Ez nano_banana_pro modellel is működik.
→ **Munkafolyamat:** 1) generálj egy etalon karakterképet a fenti Art Bible szerint → 2) ha jó, mentsd el Element-ként → 3) minden további pózhoz/animációhoz/zombihoz ezt a referenciát használd bemenetként, és csak a pózt/akciót írd át szövegesen.

**7.2 — remove_background**
Minden legenerált sprite-ról automatikusan levágható a háttér, tiszta alfa-csatornás kivágást adva — ezt érdemes pipeline-szerűen minden képre lefuttatni exportálás előtt, hogy ne kézzel kelljen photoshopozni.

**7.3 — upscale_image**
Ha egy generálás alacsonyabb felbontásban sikerült jól, utólag 2K/4K-ra upscalelhető, mielőtt lekicsinyíted a cél sprite méretre (lásd 3. pont — supersampling trükk).

**7.4 — outpaint_image**
Ha egy karakter vágása/kompozíciója nem elég "laza" (pl. túl közel van a kép szélére generálva), kibővíthető a vászon anélkül, hogy újra kéne generálni az egészet.

**Amit NEM érdemes ezekre a feladatokra használni:** a motion_control (Kling-alapú videó mozgás-transzfer) videót generál egy karakterképből egy mozgás-referencia alapján — ez inkább cutscene/marketing videóhoz jó, mint pixel-pontos, kódba illeszthető sprite sheet animációhoz. Játékbeli animációhoz a 6/A vagy 6/B stratégiát javaslom.

---

## 8. Prompt sablonok (Art Bible beépítve)

**Karakter etalon-prompt sablon (side-scroller):**
```
[Karakter leírás: szerep, ruházat, testalkat, egyedi jegyek],
strict side view, 90-degree profile, character facing right, 2D side-scroller
game camera, flat orthographic framing, no perspective distortion, no 3/4
angle, not a front-facing portrait,
single key light from upper-left at 45 degrees, cold moonlight tone,
subtle cyan rim light for silhouette separation, consistent shadow direction,
semi-realistic painterly game art style, moderate detail, readable at small scale,
not photorealistic, not cel-shaded anime,
dark desaturated base colors (#0D1117, #232A34) with cyan accent (#00D9FF),
full body visible, neutral standing pose, feet on the same ground line, transparent background,
Consistent with the "Zombi Krónika" game art style: dark neon-glow post-apocalyptic, cold moonlit lighting, strict 2D side-scroller profile view.
```

**Zombi etalon-prompt sablon (side-scroller):**
```
[Zombi típus leírás: torzulás, testalkat, sérülés-minta],
strict side view, 90-degree profile, character facing right, 2D side-scroller
game camera, flat orthographic framing, no perspective distortion, no 3/4
angle, not a front-facing portrait,
single key light from upper-left at 45 degrees, cold moonlight tone,
glowing toxic-green accents on wounds/eyes/spine (#6FBF3F, glow #39FF14),
subtle rim light for silhouette separation,
semi-realistic painterly game art style, moderate detail, readable at small scale,
not photorealistic, not cel-shaded anime,
dark desaturated base tones (#0D1117, #232A34, #5A5348),
full body visible, neutral pose, feet on the same ground line, transparent background,
Consistent with the "Zombi Krónika" game art style: dark neon-glow post-apocalyptic, cold moonlit lighting, strict 2D side-scroller profile view.
```

*Miután van egy etalon, a további generálásoknál (Element-referenciával) csak a pózt/akciót kell átírni, a fenti stílus-blokk maradhat változatlan.*

---

## 9. Post-processing pipeline (kód-oldali konzisztencia-javítás)

Ha az AI-generálás ellenére is marad kis eltérés (paletta, kontraszt) a sprite-ok között, egy egyszerű Python/Node script bevetésével **utólag egységesíthető** a teljes sprite-készlet:
- **Színpaletta quantizálás** — minden sprite-ot ráhúzol a fenti rögzített 6-8 színű palettára (pl. `Pillow` + `quantize()`), ez azonnal egységesíti a hangulatot akkor is, ha az AI kicsit máshogy színezett.
- **Kontraszt/fényerő normalizálás** — hisztogram-illesztés az etalon képhez.
- **Automatikus alfa-vágás + margó-eltávolítás** — hogy minden sprite pontosan a cellaméret közepén, azonos pivot-tal üljön.

Szólj, ha szeretnéd, hogy megírjam ezt a post-processing scriptet — 20-30 perc alatt összeáll, és utána minden legenerált sprite-ot egy paranccsal átfuttathatsz rajta.

---

## 10. QA checklist minden sprite-hoz, mielőtt bekerül a játékba

- [ ] 64×64-re kicsinyítve is felismerhető a sziluett?
- [ ] A fényforrás iránya megegyezik a többi sprite-tal?
- [ ] A paletta (2. pont) betartva, nincs "idegen" szín?
- [ ] Átlátszó háttér, nincs maradék háttér-zaj a szélén?
- [ ] Pivot pont a talpvonalon van?
- [ ] Ugyanabban a kameraszögben/perspektívában készült, mint a többi?
- [ ] Ha animáció-sorozat: a frame-ek között nincs "ugrás" a karakter méretében/arányaiban?

---

## 12. Döntés-napló és revideált stratégia (2026.07.13.)

**Kameraszög korrekció:** a dokumentum eredetileg top-down 3/4 nézetet feltételezett (Zombie Diary alapján) — a valós gameplay viszont **oldalnézeti side-scroller**. A 2., 6. és 8. pont ennek megfelelően frissítve (lásd fent).

**Stílus-döntés:** a festői/semi-realisztikus irány marad (nem vált retro pixel art-ra). Ez kizárja a PixelLab-ot elsődleges eszközként — a PixelLab kifejezetten pixel art/blokkos stílusra optimalizált, a mi festői, izzó-eres Kóbor-referenciánkkal nem konzisztens.

**Eszköz-tapasztalat:** Higgsfield MCP, Layer.ai és Seele AI mindegyike kredit-falba futott gyakorlati tesztelés közben. Tanulság: **ne váltogassunk tovább ingyenes/próba platformok között** — egy eszközre érdemes koncentrálni, kis kredit-befektetéssel.

**Javasolt út innentől — kredit-hatékony stratégia:**
Mivel a festői stílus megmarad és side-scroller a kamera, **nincs szükség teljes AI-generált animáció-sorozatra** (ami sok kreditet és sok konzisztencia-kockázatot jelentene). Ehelyett a dokumentum 6/A stratégiáját követjük szigorúan:
- **Entitásonként csak 1 db etalon állókép kell** (oldalnézeti, semleges álló póz) — ez a Higgsfield-del (Elements-referenciával a konzisztenciáért) generálható.
- A mozgást (járás-bólogatás, kar-lengés, találat-visszalökés) **kódból** oldjuk meg egyszerű transzformációkkal, nem AI-frame-ekkel.
- Ez drasztikusan csökkenti a szükséges generálások/kreditek számát: 13 entitás × 1 kép, nem 13 × 5-8 animációs frame.
- Ha később mégis szükség lenne valódi AI-generált frame-sorozatra egy-egy kiemelt akcióhoz (pl. boss speciális támadása), a Layer.ai vagy Ludo.ai marad a tartalék opció (mindkettő kezel nem-pixel-art, festői stílust is) — de csak célzottan, nem az egész rosterhez.

---

## 14. Implementációs csomag — konkrét, kódba illeszthető megoldás

Ez a fejezet írja le a ténylegesen leszállított, működő implementációt. A csomag 6 fájlból áll (mind elérhető letöltésként):

| Fájl | Szerepe |
|---|---|
| `sprite-rig.js` (v1.1) | Újrafelhasználható canvas animációs motor. Bármelyik karakterre/zombira működik, csak a JSON config és a képek cserélődnek. Tartalmazza a `dismember` szétváló halál-fizikát és az `onEvent` hook-ot. |
| `blood-fx.js` | VFX-modul: vér-részecskék, sebek, becsapódás-szikra, képernyőrázás, villanás. Univerzális, minden entitás ugyanazt használja. |
| `slice_sprite.py` | Python segédszkript: egy állókép gyors feldarabolása törzs + láb részre, és a hozzá tartozó rig JSON automatikus generálása. |
| `slice_vfx_sheet.py` | Python segédszkript: egy rács-elrendezésű VFX-lap (pl. vérfoltok) egyedi darabokra vágása + manifest generálás. |
| `integration-example.js` | Minta `Entity` osztály, ami összeköti a rig-et és a blood-fx-et, és megmutatja a game loop-ba illesztést. |
| `test-harness.html` | Önálló, böngészőben futtatható teszt oldal, HP-számlálóval — ide másolod a kimeneteket, és azonnal látod animálva, kódolás nélkül. |

### 14.1 — A workflow lépésről lépésre (Kóborral, példaként)

1. **Töltsd le a jóváhagyott Kóbor képet** a Higgsfield generálásból (jobb klikk → mentés), pl. `kobor_raw.png` néven.
2. **Távolítsd el a hátteret** — Higgsfield `remove_background` eszköze, vagy bármilyen más háttér-eltávolító.
3. **Becsüld meg a csípő/váll koordinátáit** a képen (pixelben) — ha nem vagy biztos benne, küldd el a képet, és megbecsüljük együtt (ahogy Kóbornál is tettük: pixel-elemzéssel, nem tippeléssel).
4. **Futtasd le a szeletelő scriptet:**
   ```bash
   python3 slice_sprite.py --input kobor_raw.png --output-dir ./kobor_parts \
     --hip-y 600 --hip-x 500 --shoulder-x 535 --shoulder-y 270
   ```
   Ez létrehozza: `kobor_parts/body.png`, `kobor_parts/leg.png`, `kobor_parts/kobor_rig.json`.
5. **Vágd szét a VFX-lapot is** (egyszer, univerzálisan, nem entitásonként):
   ```bash
   python3 slice_vfx_sheet.py --input blood_splatter_sheet.png \
     --output-dir ./assets/fx --cols 3 --rows 2 --prefix splat
   ```
   Majd tedd a `wound_stump.png` és `impact_spark.png` fájlokat is az `assets/fx/` mappába.
6. **Teszteld böngészőben** — másold a `test-harness.html`-t, `sprite-rig.js`-t, `blood-fx.js`-t és `integration-example.js`-t egy mappába, mellé a `kobor_parts/` és `fx/` almappákat, indíts helyi szervert, nyisd meg böngészőben.
7. **Ha jó, illeszd be a tényleges game loop-ba** az `integration-example.js` mintája szerint.

### 14.2 — Opció A vs Opció B (minőségi döntés a testrészeknél)

- **Opció B (amit a `slice_sprite.py` csinál):** gyors, ingyenes, a már meglévő egyetlen képből dolgozik. Korlát: a kar nem leng külön (a törzshöz rögzítve marad), és mindkét láb ugyanazt a kivágott képet használja (ez a legtöbb kis/közepes méretű sprite-nál észrevehetetlen a gyakorlatban).
- **Opció A (production-quality, ha van rá kredit):** a törzset, mindkét kart és mindkét lábat **külön AI-generálással** kéred (ugyanazzal a stílus-referenciával/Elements-szel a konzisztenciáért), tiszta vágásokkal, saját pivot-ponttal mindegyiknél. Erre akkor érdemes áttérni, ha a Opció B-s prototípus már bizonyította, hogy a rendszer működik.

**A VFX-eknél (vér, seb, szikra) viszont mindig megéri AI-generálást használni** — ezek univerzálisak (egyszer legenerálva, minden entitásra újrahasznált), tehát a kredit-befektetés nagyon alacsony a nyereséghez képest (lásd 14.4).

### 14.3 — JSON rig séma (referencia)

```json
{
  "id": "kobor",
  "anchor": {"x": 90, "y": 400},
  "pivots": {
    "hip": {"x": 100, "y": 300},
    "shoulder": {"x": 100, "y": 120}
  },
  "parts": {
    "body": {"src": "body.png", "x": 0, "y": 0, "width": 180, "height": 300, "pivotRef": null},
    "frontLeg": {"src": "leg.png", "x": 0, "y": 300, "width": 180, "height": 100, "pivotRef": "hip"},
    "backLeg": {"src": "leg.png", "x": 0, "y": 300, "width": 180, "height": 100, "pivotRef": "hip"}
  },
  "animations": {
    "idle": {"type": "bob", "amplitude": 3, "speed": 1.6},
    "walk": {"type": "cutoutWalk", "legAmplitudeDeg": 26, "speed": 6, "bobAmplitude": 5},
    "hurt": {"type": "knockback", "duration": 0.45, "shakeAmplitude": 6, "next": "idle"},
    "death": {
      "type": "dismember",
      "gravity": 320, "popUp": 90,
      "flingSpeedMin": 40, "flingSpeedRange": 30,
      "spinSpeedMin": 110, "spinSpeedRange": 90,
      "bounceDamping": 0.32, "maxBounces": 2, "groundY": 46,
      "frontLegCollapseDeg": 70, "backLegCollapseDeg": 45,
      "legCollapseDuration": 0.45
    }
  }
}
```

Ez a séma **entitásonként külön fájl** — a 4–5. pont mind az 5 karakterének és mind a 8 zombitípusnak lesz saját ilyen JSON-ja, saját `body.png`/`leg.png` képekkel, ugyanabban a mappastruktúrában, ahogy a 3. pont leírja. A `death` blokk paraméterei (fling-sebesség, pattanás, forgás) entitásonként egyedileg hangolhatók — egy nehéz Tank-zombinál pl. lassabb, tompább esés illik, egy vékony Sikoltónál dinamikusabb.

### 14.4 — VFX rendszer: vér, sebek, szétváló halál (2026.07.13. bővítés)

A "gagyi" halál-animáció (egyszerű eldőlés) helyett valódi "juice"-t kapott a rendszer, **anélkül hogy minden entitáshoz külön VFX-et kellene generálni** — az alábbi 3 asset **univerzális**, egyszer legenerálva, minden karakterre/zombira újrahasznált:

| Asset | Prompt-sablon | Felhasználás |
|---|---|---|
| `blood_splatter_sheet.png` | 4-6 szabálytalan vérfolt, toxikus-zöld izzású alálárnyalattal | Vér-részecskék és földi tócsa-decal-ok |
| `wound_stump.png` | Szakadt, izzó zöld csont/gerinc-textúra a vágásvonalra | A halálnál a felsőtest-alsótest szétválás vizuális "sebe" |
| `impact_spark.png` | Kompakt szikra+füst becsapódás-effekt | Minden nem-halálos találatnál |

**Feldolgozási lépés:** a `blood_splatter_sheet.png`-t a `slice_vfx_sheet.py` szeleteli szét egyedi darabokra (`splat_01.png`, `splat_02.png`, ...) + `splat_manifest.json`-t generál, amit a `blood-fx.js` tölt be futásidőben.

**Mit ad hozzá a rendszer:**
- **Fokozódó sebek** — minden nem-halálos találatnál egy véletlenszerű vérfolt-decal jelenik meg a testen, felhalmozódva.
- **Vér-részecske robbanás** — fizikailag repülő, gravitációval eső, elhalványuló, valódi festett textúrájú vércseppek (nem egyszerű körök).
- **Becsapódás-szikra** minden találatnál.
- **Képernyőrázás + piros villanás** találatnál (kicsi) és halálnál (nagyobb).
- **Valódi szétváló halál** — a felsőtest fizikailag leválik a csípőtől (gravitáció, pattanás, forgás), a `wound_stump.png` textúra jelöli a vágásvonalat, a lábak összecsuklanak, és a landolás helyén állandó vér-tócsa marad.

**Mappastruktúra-kiegészítés:**
```
assets/
  fx/
    blood_splatter_sheet.png   ← eredeti, meg nem vágott generálás (referenciaként megtartva)
    splat_01.png ... splat_0N.png
    splat_manifest.json
    wound_stump.png
    impact_spark.png
```

---

## 15. Javasolt következő lépés

A roster és a zombi-lista véglegesítve van (4–5. pont), zóna-alapú accent-színekkel a HADMŰVELETI TÉRKÉP alapján.

**✅ Mérföldkövek eddig (2026.07.13.):**
- Kóbor etalon side-view képe legenerálva és jóváhagyva.
- Sprite rig motor (mozgás, sebzés, halál) implementálva és leszállítva.
- VFX rendszer (vér, sebek, szétváló halál) implementálva és leszállítva.

**Következő lépések:**
1. Teszteld végig a teljes Kóbor pipeline-t a saját gépeden (14.1 workflow), és jelezz vissza, ha bármi elcsúszik.
2. Ha jó, menjünk tovább a következő entitásra — javaslat: **Farkas** (a csapat "arca") vagy **A Vérmag** (a leglátványosabb, mivel már van rá vizuális referencia a térképről).
3. A többi 11 entitásnál ugyanezt a workflow-t ismételjük — a VFX-eket (blood-fx) nem kell újragenerálni, azok univerzálisak.
