# 01 — Globális UI szabályok

## 1. Full screen és safe-area

A játék UI wrapper legyen teljes képernyős:

- `width: 100dvw`
- `height: 100dvh`
- `overflow: hidden`
- `padding-top: env(safe-area-inset-top)`
- `padding-bottom: env(safe-area-inset-bottom)`

A HUD, footer és modal overlayek **nem lehetnek a scrollozható tartalom részei**.

## 2. Fix footer szabály

A következő felirat:

`For personal use only. | build v29`

mindig fixen a képernyő legalján legyen:

- `position: fixed`
- `bottom: env(safe-area-inset-bottom)`
- `z-index: 45`
- kis, halvány, monospace jellegű szöveg
- semmilyen menükártyán belül nem jelenhet meg

Ez javítja azt a hibát, hogy a főmenü scrollozható területének közepén ragad.

## 3. Gombstílus

Minden fő CTA gomb legyen:

- nagy tap target: minimum 54–60 px magas
- beveled / fémes hatás
- finom glow
- aktív állapotban kicsi `scale(.985)`
- disabled állapotban alacsony opacity
- ne legyen olcsó flat rectangle

## 4. Oldalsó kampány navigáció

A karikázott régi gombalátétek tiltva vannak.

Ne legyen:

- kör alakú háttér
- halo / fénykör
- lebegő kerek badge alattuk

Helyette:

- fémes téglalap/plaque button
- ikon felül, label alul
- kiválasztott elemnél színes border/glow

## 5. Színek képernyőnként

- Continue: zöld
- Campaign / boss: piros
- Scavenge: lila
- Armory: arany/narancs
- Lab: kék
- Általános panel: fekete, mélykék, grafit, fémes szürke

## 6. Ne törjön el telefonon

A layout használjon:

- `clamp()`
- `min()`
- `max()`
- flex/grid responsive elrendezést
- landscape képernyőknél külön kampány térkép layoutot
- portrait képernyőknél scrollozható tartalmi zónát fix HUD/footer mellett
