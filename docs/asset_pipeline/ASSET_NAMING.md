# Asset Naming

## Rules
- **lowercase**
- **no accents** (áéíóö → aeioo)
- **no spaces**
- **underscores** as separators
- **version suffix** (`_v1`, `_v2`, …)
- every asset must have a **filename without extension** in its brief

## Examples (filename without extension)
- `playable_characters_concept_v1`
- `zombie_types_concept_v1`
- `soldier_turnaround_v1`
- `soldier_sprite_sheet_v1`
- `walker_sprite_sheet_v1`
- `runner_sprite_sheet_v1`
- `weapon_icons_progression_v1`
- `combat_vfx_sprite_sheet_v1`
- `pickup_item_icons_v1`

## Target folders (current convention)
- Reference sheets / concepts: `assets/references/`
- Production, sliced UI icons and derived assets: `assets/ui/`
- App / PWA icons: `icons/` (and `assets/ui/appicon`)

> Keep the extension out of the brief's "filename without extension" field; add the
> recommended format separately (see the prompt template).
