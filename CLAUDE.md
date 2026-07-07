# PROJEKT SZABÁLYOK (Claude Code) — ÚJRAFELHASZNÁLHATÓ SABLON

Ez a fájl Claude-nak szól. A `CLAUDE.md` a projekt gyökerébe kerül, és minden
session elején betöltődik. A viselkedési szabályokat írja le — a tényleges
engedélyeket a `.claude/settings.json` adja.

> Ez egy webes projekt sablon (pl. React/Vite/Next vagy hasonló). A stack a
> projekt tényleges `package.json`-jából derül ki; ehhez igazodj.

---

## PROJEKT_ROOT = a mappa, amelyben ez a fájl van

Ezt a mappát és minden almappáját tekintsd `PROJECT_ROOT`-nak.
Minden fájlművelet ezen belül kell maradjon.

### Belül (PROJECT_ROOT) — szabadon, kérdés nélkül

- olvasás, keresés, fájl létrehozás, szerkesztés, refaktor
- tesztek, linterek, formázók, type-checkek (eslint, prettier, tsc, vitest/jest)
- projekt-lokális szkriptek, dev szerver, build, ideiglenes fájlok
- több kapcsolódó módosítás egy körben

Ne kérj engedélyt minden olvasáshoz/szerkesztéshez/teszthez. Dolgozz kötegelve.

### Kívül (PROJECT_ROOT-on kívül) — TILOS

Soha ne érj el/olvass/írj/listázz semmit a projektmappán kívül. Ez abszolút.
Tiltott: szülő/testvér mappák, más meghajtók (C:\, D:\), hálózati/UNC utak,
felhő-mappák, user profil, `..`/`../`, kivezető symlink/junction. Ha kívülre
mutatna, ne tedd — kérdezz.

---

## ENGEDÉLYHEZ KÖTÖTT (kérdezz előtte) műveletek

- fontos fájlok/mappák törlése, tömeges átnevezés/áthelyezés
- sok, nem összefüggő fájl egyszerre módosítása
- bármi a PROJECT_ROOT-on kívül
- függőség telepítése/frissítése (npm/pnpm/yarn/bun install, add)
- letöltés/feltöltés/internet/külső API hívás
- admin/root parancsok, OS-beállítás, környezeti változó a projekten kívül
- titkok/kulcsok/tokenek olvasása/kiírása/tárolása/módosítása (.env, API kulcs)
- Git: force-push, rebase, merge, PR. (status és diff szabad.)
  KIVÉTEL: a normál `git add` + `git commit` + `git push` a projekt SAJÁT origin
  repójába (a `git remote get-url origin` szerinti cím, main branch) ELŐRE
  ENGEDÉLYEZETT és AUTOMATIKUS. A kész-munkafolyamat összefoglaló után automatikusan
  pushold a változásokat. (force-push/rebase/merge/PR továbbra is engedélyköteles.)
- hosszú futó folyamat éles publikálása, éles szolgáltatás/DB
- deploy éles környezetbe (Vercel/Netlify prod) — SOHA automatikusan

Ha engedély kell, EGYSZER kérdezz az egész csoportra, és írd le, miért.

## TITKOK

Soha ne hardcode-olj/írj ki/tárolj titkot forráskódban. Ha kell, .env-ben
(legyen .gitignore-ban) vagy ignorált lokális configban. Kulcs/token NE menjen gitbe.

## KÓDMINŐSÉG

- fókuszált változások; ne írj át működő, nem érintett részt feleslegesen
- őrizd meg a meglévő viselkedést, ha a feladat nem kéri a változtatást
- egyszerű, moduláris kód; világos nevek; típusok ahol illik
- konfiguráció külön az üzleti logikától; nincs PROJECT_ROOT-on kívüli út
- reszponzív, akadálymentes (a11y) szemlélet a webes UI-nál
- írj tesztet, ahol értelmes; tartsd a projektet futtathatóként

## HALADÁS KÖVETÉSE

- Vezess `docs/STATUS.md` élő státusz-dokumentumot (mi kész, teszt-állapot, hogyan
  futtatható, döntések, következő lépések). MINDEN érdemi lépés után frissítsd.
- Új gépen/új session elején OLVASD EL a `docs/STATUS.md`-t.

## ÖSSZEFOGLALÓK

- Összefoglalót/briefet EGY másolható kódblokkba tegyél.
- Ha a tartalom ``` blokkot tartalmaz, a külső fence négy backtick.

## KÉSZ-MUNKAFOLYAMAT ÖSSZEFOGLALÓ (ChatGPT átadás) — KÖTELEZŐ, AUTOMATIKUS

MINDEN kész munkafolyamat után — külön kérés/engedély nélkül, automatikusan — adj
EGY GOMBBAL MÁSOLHATÓ, részletes összefoglalót ChatGPT-nek beilleszthetően:

1. Hol tartunk (konkrét fájlok, változások)
2. Jelenlegi állapot (működik-e, teszt/build, hogyan futtatható)
3. Döntések (mit és miért)
4. Nyitott kérdések (számozva)
5. Következő lépések

Forma: EGY másolható kódblokk (ha belül ```, a külső fence négy backtick).

## FUTTATÁS / ÚJRAINDÍTÁS

- Kódmódosítás után a hosszú futó folyamatokat (dev szerver, app) szükség esetén
  TELJESEN állítsd le és indítsd újra (új függőség/config/build-szintű változásnál).

## HIBAKEZELÉS

Ha valami elromlik: nézd a projekt-lokális logokat (konzol/dev szerver/build),
javítsd a PROJECT_ROOT-on belül, futtasd újra a teszteket/buildet, foglald össze.
Ne keress hiányzó fájlt a projekten kívül; ha hiányzik, kérdezd a felhasználót.

## VÉGE / ÖSSZEGZÉS

A feladat végén: mi változott, mely fájlok, milyen ellenőrzések futottak, mi van
hátra, kellett-e kihagyni engedélyhez kötött lépést.

## RÖVID ALAPELV

Projektmappán belül: dolgozz szabadon, hatékonyan, állandó engedélykérés nélkül.
Projektmappán kívül: ne csinálj semmit. Engedélyt csak destruktív, külső, érzékeny,
hálózati, függőség-telepítő, deploy, vagy projekten kívüli műveletekhez kérj.
(A saját repóba pusholás automatikus.)
