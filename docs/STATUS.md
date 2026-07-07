# STATUS — élő státusz-dokumentum

> Minden érdemi lépés után frissítendő. Új session elején ELŐSZÖR ezt olvasd el.

## Hol tartunk
- **Játszható, teljes alapjáték + TELJES VIZUÁLIS ÁTÉPÍTÉS kész** — „Zombi Krónika".
- Zero-dependency: HTML5 canvas + vanilla JS (classic scriptek, nincs build), PWA.
- Tartalom: 8 fegyver, 6 zombitípus + boss (minden 5. pálya), 7 fejlesztés, 40 pálya, érme/medkit drop, gránát, mentés-export/import.

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
- `node --check` minden JS fájlra hibátlan; konzol futás közben tiszta (0 hiba).
- Böngészős automata teszt lefutott: főmenü ✔, bolt 8 kártya + SMG-vásárlás ✔, labor HP-fejlesztés ✔, 40 pályacella ✔, játékindítás kattintással ✔, export/import ✔, 30 mp szimulált játék (mozgás+tüzelés+váltás+gránát) hibamentesen ✔, teljes pálya végigjátszás → győzelem + pálya-feloldás ✔.
- Screenshot-ellenőrzés: mindhárom téma, boss-banner + HP-sáv, robbanás, kártyás bolt, labor, pályaválasztó, eredmény-modál — a prototípus-hatás megszűnt.
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
1. **Hosting a telefonhoz**: HTTPS kell a PWA-hoz. Opciók: Netlify/Vercel (ingyenes, privátabb URL), GitHub Pages (ingyenes tervben csak publikus repónál). Döntés függőben.
2. Balansz-finomhangolás igény szerint (nehézség, árak) — első kézi játék után.
3. Extra tartalom később: több pályatéma, második karakter, teljesítmények.
4. Kézi vizuális finomhangolás igény szerint (sprite-részletek, színek) — a felhasználó első benyomása alapján.

## Következő lépések
- Felhasználói kézi teszt asztali böngészőben (új látvány átnézése).
- Hosting kiválasztása → telefonra telepítés.
