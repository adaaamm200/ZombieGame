# Pause Menu implementációs specifikáció

Referencia: `visual_references/pause_menu_reference.png`

## Cél

A pause menu legyen gyors, egyszerű, de prémium. Ne legyen lapos/olcsó.

## Elemei

- blur/dim backdrop a gameplay fölött
- középső fémes modal panel
- cím: `PAUSED`
- első gomb: `RESUME`, gold variant
- második gomb: `QUIT`, red variant

## Működés

- Resume: visszatérés a játékba
- Quit: megerősítés után főmenübe / campaign mapra
- ESC vagy pause ikon: toggle
- háttér ne legyen kattintható kilépéshez, hogy ne legyen véletlen quit

## CSS/komponens

Használd:

- `zk-modal-backdrop`
- `zk-modal-panel`
- `zk-premium-button`
- `zk-premium-button--red`

## Elfogadási kritérium

- Középre igazított.
- Landscape és portrait módban sem lóg le.
- Gombok minimum 60 px magasak.
- A háttér erősen blur/dim.
