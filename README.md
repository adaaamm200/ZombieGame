# Zombi Krónika

Retro, oldalnézetes zombis akciójáték — a klasszikus mobilos zombis „run and gun"
játékok (pl. a már nem elérhető Zombie Diary) játékmenetének saját készítésű
hommage-a, **kizárólag magáncélú felhasználásra**. Minden kód, grafika és hang
saját készítésű (a sprite-ok kódból rajzolódnak, a hangok szintetizáltak) —
külső függőség és külső asset nincs.

## Játék

- Oldalnézetes aréna, két irányból támadó zombihullámok
- 6 zombitípus: sétáló, futó, kúszó, köpködő, óriás + VEZÉR (minden 5. pályán)
- 8 fegyver: pisztoly, SMG, sörétes, gépkarabély, lángszóró, minigun, RPG, lézer
- 7 fejlesztés a laborban: életerő, regeneráció, sebzés, kritikus, sebesség, gránát, érme-bónusz
- 40 pálya növekvő nehézséggel, érmegyűjtés, bolt, mentés (localStorage)
- Érintéses irányítás (virtuális joystick + gombok) és billentyűzet (A/D + Space, G gránát, Q váltás, P szünet)

## Futtatás

```bash
node tools/server.js        # http://localhost:8080
```

Vagy bármilyen statikus webszerverrel tálalható; build lépés nincs.

## Telefonra (iOS PWA)

1. Tedd elérhetővé HTTPS-en (pl. Netlify/Vercel/GitHub Pages).
2. Nyisd meg Safariban → Megosztás → **Hozzáadás a kezdőképernyőhöz**.
3. A játék teljes képernyős, offline is működő appként fut; a mentés a telefonon marad.

## Fejlesztés

- `tools/make-icons.js` — PNG app-ikonok újragenerálása (natív Node, csomag nélkül)
- Állapot: lásd [`docs/STATUS.md`](docs/STATUS.md)
