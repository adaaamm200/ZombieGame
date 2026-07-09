# UI Kit v1 — owner-provided premium UI icon/element sources

> **STATUS (2026-07-09): INTEGRATED** — `menu/`, `markers/`, `coin`, and `logo/logo_full`
> were processed by `tools/prepare-ui-kit-v1.js` (edge flood-fill light-bg removal + trim +
> 256 pad @~70%, logo kept aspect) and written over `assets/ui/m-*.png`, `s-*.png`,
> `ic-coin.png`, `logo.png`. The `elements/` (banner_day_name, plaque_day,
> meter_danger_skulls, plaque_xp, supply_crate) and `logo/logo_wide` are STILL PENDING —
> reserved for a board/briefing polish pass.


Owner-provided, individually composed premium UI assets (dark metal + accent glyph).
Each is a SEPARATE, centered, well-margined asset → **no sheet slicing / crop needed**.
This kit supersedes and consolidates the earlier `menu_icons_v1/` folder (its 6
duplicate octagons were removed; its unique `continue` was moved in as `menu/menu_continue.png`).

## Common state (IMPORTANT for processing)
- All source files: **1254×1254** (except logos, see below), color type **RGB (no alpha)**.
- Background: **flat light** (~242–254, near white), NOT a checkerboard.
  → must be made transparent before use (edge flood-fill from the near-white border,
  threshold ~248, so inner metallic highlights are preserved — do NOT global-key luminance).
- Then pad onto a transparent canvas at ~70% (same safe-padded system as the current
  `assets/ui/*.png`; matches the rendered-UI inner-scale rule in
  `docs/qa/VISUAL_QA_CHECKLIST.md`).

---

## menu/ — octagon action icons → `assets/ui/m-*.png` (256×256)
| Source                    | Glyph / accent        | Target production file      | Menu slot           |
|---------------------------|-----------------------|-----------------------------|---------------------|
| `menu/menu_continue.png`  | green play triangle   | `assets/ui/m-continue.png`  | Continue / New Game |
| `menu/menu_campaign.png`  | red map + pins/route  | `assets/ui/m-campaign.png`  | Campaign            |
| `menu/menu_scavenge.png`  | purple backpack       | `assets/ui/m-scavenge.png`  | Scavenge            |
| `menu/menu_armory.png`    | gold weapons rack     | `assets/ui/m-armory.png`    | Armory              |
| `menu/menu_lab.png`       | blue flask            | `assets/ui/m-lab.png`       | Lab                 |
| `menu/menu_shop.png`      | gold cart (NEW)       | `assets/ui/m-shop.png`      | Shop (board SHOP)   |
| `menu/menu_settings.png`  | steel gear            | `assets/ui/m-settings.png`  | Settings (+ title/board gear) |
| `menu/menu_back.png`      | steel back chevron    | `assets/ui/m-back.png`      | Back button         |

## markers/ — board state markers → `assets/ui/s-*.png` (256×256)
| Source                        | Shape / accent          | Target production file    | State      |
|-------------------------------|-------------------------|---------------------------|------------|
| `markers/marker_completed.png`| green hexagon, check    | `assets/ui/s-done.png`    | Completed  |
| `markers/marker_current.png`  | green hexagon, target   | `assets/ui/s-current.png` | Current    |
| `markers/marker_boss.png`     | red hexagon, horned skull | `assets/ui/s-boss.png`  | Boss       |
| `markers/marker_loot.png`     | purple hexagon, crate   | `assets/ui/s-loot.png`    | Loot/Reward/Scavenge |
| `markers/marker_danger.png`   | gold hexagon, skull     | `assets/ui/s-danger.png`  | Danger meter |
| `markers/marker_locked.png`   | **OCTAGON**, gray lock  | `assets/ui/s-locked.png`  | Locked (note: octagon, not hexagon — decide at impl whether to keep octagon or request a hexagon variant) |

## elements/ — banners, plaques, pickups, currency (aspect varies)
| Source                          | Size / aspect | What it is                        | Suggested use (TBD at impl) |
|---------------------------------|---------------|-----------------------------------|-----------------------------|
| `elements/coin.png`             | 1254² round   | gold "Z" coin                     | `assets/ui/ic-coin.png` (coin everywhere) |
| `elements/supply_crate.png`     | 1254² box     | dark metal supply/ammo crate      | scavenge/supply pickup or scavenge thumb |
| `elements/banner_day_name.png`  | 2172×724 (3:1)| "DAY 1 · QUARANTINE STREET" plate | board DAY banner (with zone name) |
| `elements/plaque_day.png`       | 1774×887 (2:1)| "DAY 1" metal plaque              | board DAY number plaque |
| `elements/meter_danger_skulls.png` | 2172×724 (3:1) | 3 skull danger meter strip     | briefing DANGER meter |
| `elements/plaque_xp.png`        | 1774×887 (2:1)| blue "XP" reward plaque           | briefing XP reward tag |

> Elements are NOT square icons — do not force them into the 256 square icon pipeline.
> Keep their aspect (trim + transparent bg + reasonable max width), or reserve for a
> later board/briefing polish pass. Only the coin fits the round `ic-coin` slot.

## logo/ — brand
| Source                | Size / aspect  | Use                                        |
|-----------------------|----------------|--------------------------------------------|
| `logo/logo_full.png`  | 1672×941 (16:9)| main menu logo → replace `assets/ui/logo.png` (horizontal lockup; better than current crop) |
| `logo/logo_wide.png`  | 2172×724 (3:1) | compact/header logo variant (topbars)      |

---

## Processing plan for tomorrow (do NOT implement tonight)
1. **menu/** + **markers/** (squares): light-bg → transparent (edge flood-fill), pad to
   256×256 at ~70%, output over `assets/ui/m-*.png` and `assets/ui/s-*.png`. No CSS change
   (menu/nav/markers already use `object-fit: contain`). Marker locked: decide octagon vs hexagon.
2. **coin**: same → `assets/ui/ic-coin.png`.
3. **logo_full**: transparent bg + trim, replace `assets/ui/logo.png`; re-check `.brand-logo`
   sizing (it's now horizontal 16:9, may want less max-height / more width).
4. **elements** (banners/plaques/meter): defer to a board/briefing polish pass; keep aspect,
   do not squash into the icon pipeline.
5. Extend `tools/crop.js` with a "transparent-from-light-bg + trim + pad" path for single
   icons (no coordinate slicing — these are already separate icons).
6. Screenshot-verify each screen; bump `sw.js` cache; update `docs/STATUS.md` + `CHANGELOG_AI.md`.
