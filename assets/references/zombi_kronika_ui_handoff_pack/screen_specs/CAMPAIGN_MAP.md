# Campaign Map képernyő specifikáció

Referencia: `visual_references/campaign_map_reference.png`

## Cél

A karikázott részek javítása:

1. Bal oldali nav gombok — nincs kör/alátét.
2. Top-right SHOP gomb — erősebb, prémium button.
3. Bottom-right FIGHT BOSS — nagy, brutális, piros boss CTA.

## Layout

Landscape ajánlott, de responsive legyen.

- Top center: `DAY 1 | QUARANTINE STREET`
- Top left: Back button
- Top right: coin box + `SHOP` gomb
- Left side: vertical nav plaques
  - Campaign
  - Scavenge
  - Settings
- Map:
  - 1-1 Quarantine Checkpoint
  - 1-2 Abandoned Shop
  - 1-3 Barricaded Road
  - 1-4 Infected Nest
- Bottom panel:
  - mission title
  - objective
  - danger
  - suggested weapon
  - reward
  - FIGHT BOSS CTA

## Tiltott

- kör alakú gombalátét
- random glow körök
- túl kicsi boss gomb
- Shop gomb elbújtatva

## Data source

`data/missions.json`

## Elfogadási kritérium

- A `FIGHT BOSS` gomb a panel jobb oldalán domináns.
- A shop gomb top-right jól látható, de nem takarja a coin boxot.
- Oldalsó nav egyértelmű és prémium.
