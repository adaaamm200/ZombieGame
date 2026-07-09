# Mission Briefing / Start képernyő specifikáció

Referencia: `visual_references/mission_briefing_reference.png`

## Cél

A régi mission popup helyett prémium mission briefing modal kell.

## Tartalom

- cím: `Mission 5 · Boss`
- objective: `Destroy the source of the infection — the Boss.`
- loadout card:
  - weapon image
  - weapon name: `Vipera SMG`
  - ammo: `17`
  - bal/jobb weapon switch gomb
- stats:
  - Grenades: 2
  - HP: 166
  - `+1 grenade` purchase: 200 coin
  - `READY` status
- CTA:
  - `START` gold button
  - `BACK` dark secondary button

## Működés

- Weapon arrows léptetik a kiválasztott fegyvert.
- START csak akkor aktív, ha a mission unlocked és a loadout valid.
- Grenade purchase csak akkor aktív, ha van elég coin.
- Back vissza a campaign mapra.

## Data source

- `data/weapons.json`
- `data/shop_items.json`
- `data/missions.json`

## Elfogadási kritérium

- Weapon image valóban nagy és látható.
- Gombok nem túl kicsik.
- Mission panel nem takarja ki teljesen a hátteret, de fókuszált.
