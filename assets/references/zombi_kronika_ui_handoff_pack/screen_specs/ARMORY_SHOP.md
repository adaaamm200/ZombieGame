# Armory + Shop képernyő specifikáció

Referencia: `visual_references/armory_shop_reference.png`

## Cél

A fegyverválasztó, ammo és shop legyen külön kezelhető, de egy képernyőn is működjön.

## Layout

- top: Back, `ARMORY`, coin box
- tabs:
  - WEAPONS
  - AMMO
  - SHOP
- main area:
  - 2 oszlopos WeaponCard grid
  - jobb oldalon vagy külön tabban ShopItem lista
- bottom dock opcionális: Events, Daily Reward, Store

## WeaponCard mezők

- weapon image
- name
- stats:
  - DMG
  - RATE
  - DPS
- ammo count
- action:
  - SELECT
  - EQUIPPED
  - BUY

## ShopItem mezők

- item image
- item name
- amount / effect
- price
- buy button

## Data source

- `data/weapons.json`
- `data/shop_items.json`

## Kötelező fegyverek

- M9 Pisztoly
- Vipera SMG
- Őrszem Sörétes
- M4A1 Assault
- L96A1 Sniper
- MG42 LMG

## Elfogadási kritérium

- Fegyverképek ne placeholder szürke blokkok legyenek.
- Stat barok egységesek.
- Equipped állapot zöld highlight.
- Buy/select gombok ne legyenek ronda kerek alátéten.
