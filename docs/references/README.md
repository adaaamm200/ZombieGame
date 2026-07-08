# References

This folder documents how reference material is used. The actual reference **images**
live in [`../../assets/references/`](../../assets/references/) (kept next to the app so
they can also be shipped as real assets when they are production art).

## Reference priority
- **Reference images take priority** over improvised cheap UI.
- If a reference is a concrete board/background/icon asset, **use it as an actual
  asset**, not just as loose inspiration.

## Production asset vs reference-only
- **Production asset** (used in-game): e.g. the clean Day 1 board background, the main
  menu background, the sliced UI icons, the logo.
- **Reference-only** (style/mood guide, not shipped as-is): concept sheets, mockups,
  style sheets, character/zombie concept boards.

## Current reference / source files (in `assets/references/`)
- `day1_board_target_clean.png` — Day 1 board **background** (production).
- `main menu background.png` — main menu **background** (production).
- `app_logos.png` — brand/logo concept sheet → `assets/ui/logo`, `appicon` (source).
- `ingame_icons.png` — premium UI icon sheet → sliced into `assets/ui/*` (source).
- `visual_style_sheet.png`, `karakterek.png`, `map1..5.png` — style / concept references.

> When adding a new reference, note here whether it is production or reference-only,
> and where its sliced/derived assets live.
