# Menu Icons v1 — ready-made premium menu icon sources

Owner-provided, individually composed premium menu icons (dark metal octagon +
accent glyph). Each is a SEPARATE, centered, well-margined icon → no sheet slicing
needed. These replace the sheet-sliced `assets/ui/m-*.png` menu icons.

## Files → target menu slot
| Source file (this folder)   | Glyph / accent            | Target production file      | Menu slot          |
|-----------------------------|---------------------------|-----------------------------|--------------------|
| `menu_continue_v1.png`      | green play triangle       | `assets/ui/m-continue.png`  | Continue / New Game |
| `menu_campaign_v1.png`      | red battle-map (X/O/route)| `assets/ui/m-campaign.png`  | Campaign           |
| `menu_scavenge_v1.png`      | purple backpack           | `assets/ui/m-scavenge.png`  | Scavenge           |
| `menu_armory_v1.png`        | gold weapons rack         | `assets/ui/m-armory.png`    | Armory             |
| `menu_lab_v1.png`           | blue flask                | `assets/ui/m-lab.png`       | Lab                |
| `menu_settings_v1.png`      | steel gear                | `assets/ui/m-settings.png`  | Settings (+ title/board gear) |
| `menu_back_v1.png`          | steel back chevron        | `assets/ui/m-back.png`      | Back button        |

> NOT included: Shop (cart). Keep the existing `assets/ui/m-shop.png` until a Shop
> source is provided. Board mission-state hexes (`s-*.png`) are unaffected.

## Current state (IMPORTANT for processing)
- Size: **1254×1254**, color type **RGB (no alpha)**.
- Background: **flat light** (~244–254, near white), NOT a checkerboard.
  → must be made transparent before use.

## Processing plan for tomorrow (do NOT do it tonight)
1. Make the light background transparent (RGBA). Robust approach: edge flood-fill
   removing the connected near-white border (threshold ~248), so light metallic
   highlights INSIDE the octagon are preserved (avoid a naive global luminance key
   that would punch holes in the silver gear / bevels).
2. Auto-trim to the icon bounds, then pad onto a 256×256 transparent canvas with the
   icon at ~70% (same safe-padded system as the current `m-*.png`; matches the
   rendered-UI inner-scale rule in `docs/qa/VISUAL_QA_CHECKLIST.md`).
3. Output over the existing `assets/ui/m-continue.png` … `m-back.png`.
4. No CSS changes needed — the menu/nav/back use `object-fit: contain` already.
5. Verify each screen via screenshot (main menu, board nav, armory/lab/settings back).
6. Bump `sw.js` cache; update `docs/STATUS.md` + `CHANGELOG_AI.md`; commit.

Extend `tools/crop.js` with a small "transparent-from-light-bg + pad to 256" path
for these 7 sources (they are single icons, not a sheet — no coordinate slicing).
