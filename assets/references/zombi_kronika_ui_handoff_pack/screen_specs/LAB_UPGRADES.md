# Lab / Upgrades képernyő specifikáció

Referencia: `visual_references/lab_upgrades_reference.png`

## Cél

A Lab adja a hosszú távú progression rendszert.

## Fő upgrade kategóriák

- Weapon Damage
- Fire Rate
- Magazine Size
- Critical Chance
- Survivor Armor
- Max HP
- Grenade Capacity
- Medkit Efficiency
- Scavenge Bonus
- Coin Gain

## Featured Research

Panel:

- `Advanced Combat Protocols`
- unlock: Tier 6 Weapons and Advanced Mods
- effect: `+15% Weapon Damage permanently`
- progress: `58%`
- cost: `2500 research`

## UpgradeCard mezők

- icon
- name
- current level / max level
- current stat
- next stat
- progress blocks
- upgrade cost
- disabled state, ha nincs elég resource

## Data source

`data/upgrades.json`

## Elfogadási kritérium

- Upgrade lista jól skálázódik mobilon.
- Kártyák 2 oszlopban tablet/desktopon, 1 oszlopban keskeny mobilon.
- Resource cost egyértelmű.
