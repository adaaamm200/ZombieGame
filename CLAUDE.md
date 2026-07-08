# ZombieGame / Zombi Krónika — Claude Project Rules

> This is the main project rulebook, loaded at the start of every Claude Code session.
> Read this first, then the relevant `docs/` files for the current task.
> Related: [`AGENTS.md`](AGENTS.md) · [`TASKS.md`](TASKS.md) · [`CHANGELOG_AI.md`](CHANGELOG_AI.md)
> · [`docs/vision/`](docs/vision/) · [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md)
> · [`docs/STATUS.md`](docs/STATUS.md) · [`docs/RENDERING_RULES.md`](docs/RENDERING_RULES.md)

## Project Identity
- Zombie Diary-inspired arcade zombie shooter, but with **fully original assets**.
- No copyrighted assets, names, UI, characters, audio or other protected elements.
- No direct clone UI or sprite copying — spiritual successor / homage only.
- Premium **dark, gritty, mobile** game direction.

## Technical Stack
- HTML5 Canvas
- Vanilla JavaScript
- CSS
- PWA
- **Zero dependency**
- **No build step** (classic scripts, no bundler / framework / package manager)

## Work Safety
- Work only inside the repo (`C:\Claude Munka\ZombieGame`).
- No full rewrite without explicit approval.
- No dependency install.
- No force push.
- Small, reviewable steps.
- Check `git status` before work.
- Summarize changed files after work.

## Non-Negotiable Visual Rules
- Canvas / viewport must **never** become a tiny centered box (see
  [`docs/RENDERING_RULES.md`](docs/RENDERING_RULES.md)).
- Campaign board must **not** look like a generic roadmap / 1–40 node chain.
- Reference images **override** improvised cheap UI.
- Do not replace premium artwork with cheap CSS approximations.
- Icons must be **centered, padded, consistent and production-ready** (safe padded
  icon box, not a fragile sheet crop).
- No old green UI dominance — green only for ready / success / health.

## Asset Rules
Every generated asset must include:
- filename **without extension**;
- target folder;
- recommended format;
- asset type;
- usage;
- implementation notes;
- QA notes.

See [`docs/asset_pipeline/ASSET_NAMING.md`](docs/asset_pipeline/ASSET_NAMING.md) and
[`docs/asset_pipeline/ASSET_IMPORT_RULES.md`](docs/asset_pipeline/ASSET_IMPORT_RULES.md).

## Handoff Rules
Every phase ends with:
- summary;
- files changed;
- tests run;
- what was **not** changed;
- open questions;
- next recommended step.

Also append an entry to [`CHANGELOG_AI.md`](CHANGELOG_AI.md).

---

<!-- =========================================================================
     A KORÁBBI RÉSZLETES SZABÁLYZAT — MEGŐRIZVE (auto-push, auto-mode safety,
     engedélyek, kódminőség, összefoglaló-forma). NE TÖRÖLD.
     ========================================================================= -->

# PROJEKT SZABÁLYOK (Claude Code) — RÉSZLETES (megőrizve)

Ez a fájl Claude-nak szól. A `CLAUDE.md` a projekt gyökerébe kerül, és minden
session elején betöltődik. A viselkedési szabályokat írja le — a tényleges
engedélyeket a `.claude/settings.json` adja.

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

## Auto Mode Safety Rules

- Work only inside this repository: C:\Claude Munka\ZombieGame
- Do not modify files outside the repository.
- Do not run destructive delete commands without explicit confirmation.
- Do not install dependencies.
- Do not add build tools or frameworks.
- Do not force push.
- Do not change git remotes.
- Do not touch secrets, credentials, tokens or system files.
- Normal repo-local edits, checks, docs updates, commits and normal push are allowed.
- Before work: check git status.
- After work: run node --check on all JS files, update docs/STATUS.md, commit and push.

Stay zero-dependency: HTML5 canvas + vanilla JS + PWA. No bundler, framework or
package manager. Stop and ask before any destructive/irreversible action, a full
service-worker/cache rewrite, or a large architectural rewrite.

See also: [`docs/RENDERING_RULES.md`](docs/RENDERING_RULES.md) — the Canvas / Viewport
invariant that MUST be re-checked after every gameplay/UI/map/ammo/boss/shop/graphics change.
