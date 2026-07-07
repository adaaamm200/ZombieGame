# STATUS — élő státusz-dokumentum

> Minden érdemi lépés után frissítendő. Új session elején ELŐSZÖR ezt olvasd el.

## Hol tartunk
- **Játszható, teljes alapjáték kész** — „Zombi Krónika", a Zombie Diary játékmenetének saját hommage-a.
- Zero-dependency: sima HTML5 canvas + vanilla JS (classic scriptek, nincs build), PWA (manifest + service worker + generált PNG ikonok).
- Tartalom: 8 fegyver, 6 zombitípus + boss (minden 5. pálya), 7 fejlesztés, 40 pálya, érme/medkit drop, gránát, mentés-export/import.

## Jelenlegi állapot — TESZTELVE ✅
- `node --check` minden JS fájlra hibátlan; konzol futás közben tiszta.
- Böngészős füzet-teszt (bot) lefutott: pálya teljesítés (14/14 kill, érmegyűjtés, bónusz), pálya-feloldás, bolt-vásárlás (SMG), labor-fejlesztés (HP), boss-fázis (VEZÉR HP-sáv) — mind működik.
- Futtatás: `node tools/server.js` → http://localhost:8080 (vagy bármilyen statikus szerver).
- Asztali teszt: A/D mozgás, Space tűz, G gránát, Q fegyverváltás, P szünet.
- A mentés tesztadatai visszaállítva tisztára (reset megtörtént).

## Fájlok
- `index.html`, `css/style.css` — váz + retro UI
- `js/const.js` — balansz (fegyverek, zombik, fejlesztések, skálázás)
- `js/game.js` — motor (hullámok, ütközés, zsákmány, boss)
- `js/sprites.js` — procedurális pixel-grafika; `js/audio.js` — szintetizált SFX
- `js/ui.js` — képernyők (menü/pályák/bolt/labor/beállítások/modálok); `js/input.js` — joystick+gombok+billentyűzet
- `js/save.js` — localStorage + export/import; `sw.js`, `manifest.webmanifest`, `icons/`
- `tools/server.js` (dev szerver), `tools/make-icons.js` (PNG ikongeneráló)

## Döntések
- Saját név („Zombi Krónika"), saját kódból rajzolt grafika és szintetizált hangok — az eredeti játék védett assetjeit nem másoljuk; a játékmenet-mechanika az, ami hűen követi az eredetit.
- PWA út: App Store és Mac nélkül telepíthető iPhone-ra (Safari → Hozzáadás a kezdőképernyőhöz).
- iOS miatt: WebAudio első érintésre oldódik fel, portré módban „fordítsd el" felirat, safe-area kezelés.

## Nyitott kérdések
1. **Hosting a telefonhoz**: HTTPS kell a PWA-hoz. Opciók: Netlify/Vercel (ingyenes, privátabb URL), GitHub Pages (ingyenes tervben csak publikus repónál). Döntés függőben.
2. Balansz-finomhangolás igény szerint (nehézség, árak) — első kézi játék után.
3. Extra tartalom later: több pályatéma, második karakter, teljesítmények.

## Következő lépések
- Felhasználói kézi teszt asztali böngészőben.
- Hosting kiválasztása → telefonra telepítés.
