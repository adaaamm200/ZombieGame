# ROADMAP — Zombi Krónika

> Hosszú távú fejlesztési terv. A cél **nem** egy egyszerű retro prototípus, hanem
> egy saját névvel, saját grafikával és saját assetekkel készült, **Zombie Diary
> által inspirált, de továbbgondolt**, modernebb, addiktívabb mobilos zombis
> akciójáték — grindolható fejlődéssel, valódi mód-identitással.

## Szerzői jogi irány (KÖTELEZŐ)
- **Nincs** védett Zombie Diary asset (grafika, hang, UI, név, konkrét asset).
- Nincs egy az egyben másolás. Minden art/hang/kód saját.
- Cél: saját *spiritual successor / hommage* — a core loop és a hangulat legyen
  Zombie Diary-szerű, de a megvalósítás teljesen saját.

---

## FÁZIS 1 — Ammo / Economy / Free Mode / Boss Balance ✅ (folyamatban → kész)
- Lőszerrendszer átdolgozása: sokkal olcsóbb, játékosbarátabb árak.
- Kis és nagy ammo pack (nagynál mennyiségi kedvezmény).
- Pálya előtti **és** meccs közbeni (emergency) ammo vásárlás.
- Kezdő pisztoly soha nem softlockol (végtelen lőszer).
- Egyértelmű low-ammo / no-ammo / nincs-elég-pénz feedback.
- **Free Mode**: külön, hullámalapú végtelen pénzfarm mód (nem kampánypálya).
- **Boss balansz**: kisebb/skálázott HP, fair sebzés, attack telegraph + cooldown,
  kitérési lehetőség, nincs lehetetlen időlimit, tiszta fázisok és death-feedback.
- Economy/reward átnézése: 2-4 pálya vagy pár Free Mode futam után érezhető fejlődés.

## FÁZIS 2 — Campaign Map / Pályaválasztás ✅ (kész)
- Saját stílusú **map-alapú** kampányképernyő (kígyózó útvonal, SVG úttal). ✔
- 40 pálya node-okként, összekötő úttal, lock/unlock rendszerrel. ✔
- Node-típusok: normál/irtás, védelem, elite, túlélés, boss, + Free Mode akció-node. ✔
- Stage preview panel (mód, módosító, várható jutalom, nehézség, ajánlott felkészültség). ✔
- Vizuális progress-érzés: zöld „megtett" út a feloldott pályáig, is-next pulzálás. ✔
- Lásd a részleteket: [`docs/STATUS.md`](STATUS.md).

## FÁZIS 3 — Valódi játékmód-identitás
- A meglévő módok legyenek **tényleg** különbözőek — saját cél, tempó, jutalom, veszély.
- Clear (irtás), Survival (idő), Boss Hunt, Elite Hunt, Defense, Free Mode.
- Mód-specifikus szabályok, HUD és jutalomszorzók.

## FÁZIS 4 — Weapon Upgrade System
- Fegyverenkénti külön upgrade-szintek (nem csak globális labor).
- Damage, Fire rate, Magazine / ammo-hatékonyság, Reload speed.
- Special effect (pl. láncvillám, gyújtás, fagyasztás) — később.
- A régi fegyverek is maradjanak relevánsak fejlesztéssel.

## FÁZIS 5 — Több karakter
- Több játszható karakter külön **passzív** képességekkel
  (pl. Soldier, Scavenger, Medic, Engineer, Hunter, Heavy).
- Karakterválasztó képernyő; karakterenként eltérő sprite/szín/silhouette.
- A választott karakter mentődjön.

## FÁZIS 6 — Nagy grafikai és combat polish
- Részletesebb player + zombik, félelmetesebb boss.
- Több vér, blood splatter/stain, erősebb muzzle flash, bullet tracer, hit flash,
  knockback, floating damage, screen shake, gránátrobbanás, pickup-animáció,
  boss warning + boss death effekt.
- Kevésbé prototípus — komolyabb arcade mobiljáték megjelenés.

---

### Aktuális státusz
Lásd [`docs/STATUS.md`](STATUS.md). **A FÁZIS 1 és FÁZIS 2 KÉSZ.** A következő a
FÁZIS 3 (valódi játékmód-identitás) — a 3–6 fázis egyelőre dokumentált terv, azokba
csak külön döntés után kezdünk bele.
