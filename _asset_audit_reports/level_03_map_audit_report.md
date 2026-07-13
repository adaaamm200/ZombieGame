# LEVEL 03 — ZOMBIE ALLEY — MAP AUDIT & BUILD REPORT

> **REVISED — TURBO (v46, 2026-07-13).** The first build (dark cropped silhouettes) was too
> dark/lifeless. Rebuilt: the **full painted alley scene** `00_reference/full_original_map3.png`
> (the clean painting, NOT the annotated concept board) is now the rich, **living** far backdrop
> — neon (BAR/LIQUOR), green toxic glow, warm streetlamp, wet reflections, distant city, all
> baked in — put through a new `brighten()` (gamma-lift + saturation). Cropped to the upper 64%
> (walls/neon/distance, no baked floor). Kept: wet-asphalt ground (brightened) + 2 props
> (car, fence, brightened). Dropped: the dark `bar_building`/`wall_a`/`door`/`dumpster` crops and
> the low-res `alley_far_background`. Verified: avg on-screen brightness ~99–101 (was ~76),
> 100% non-black, fills viewport, 0 console errors. The sections below describe the original
> pass; the current runtime set is: `far.png` (painted scene), `ground.png`, `props/car.png`,
> `props/fence.png`.


- **Date:** 2026-07-13 · **Build:** `v45` / SW cache `zk-v45`
- **Location slot:** map/location index 2 → **mission 3 of every day** (`loadMap(2, 'assets/maps/level_03/')`).
- **Pipeline:** same as Level 01/02 (silhouette cleanup, clean layer model, procedural
  atmosphere). Source pack: `assets/references/maps/levels/level_03_zombie_alley/` (gitignored).
- **Note:** this pack ships mostly as element **palette sheets/strips** (not individual props),
  so discrete elements were isolated with fractional 2D crops + silhouette clean.

## 1. KEPT / used directly (opaque downscale)
| Runtime | Source | Role |
|---|---|---|
| `far.png` | `01_layers/alley_far_background.png` | Far ruined-city skyline |
| `ground.png` | `03_ground/alley_wet_asphalt_long_no_line.png` | Wet asphalt ground |

## 2. USED AFTER CLEANUP (2D crop → silhouette + feather + trim)
| Runtime | Source (crop) | Role |
|---|---|---|
| `bar_building.png` | nearground strip, left | Midground hero (BAR corner building) |
| `wall_a.png` | midground strip, left | Midground wall/building |
| `props/car.png` | car-wrecks set (bottom-left) | Prop (wrecked car) |
| `props/fence.png` | car-wrecks set (top-left) | Prop (chain-link fence panel) |
| `props/door.png` | nearground strip (right) | Prop (green-glow doorway — atmosphere) |

All outputs verified clean silhouettes (dark, alley-appropriate; no swiss-cheese/halos).

## 3. REJECTED / not used (see `_rejected_assets/level_03/REJECTED_MANIFEST.md`)
- **Rejected (rule violations):** `07_effects/*` (fog_ground, rain_overlay, smoke_plumes,
  streetlamp_beams, fire_and_embers, red_green_neon PNG overlays — atmosphere is procedural);
  `04_foreground/*` and `01_layers/alley_foreground_debris_strip.png` (noisy foreground strips).
- **Reference only:** `00_reference/*` concept boards; `02_source_sheets/*`; `08_animated/*`
  (bar_sign / red_beacon / steam_vent frames).
- **Palette sheets used only as crop sources, not tiled:** `01_layers/alley_nearground_*`,
  `01_layers/alley_midground_*` (cropped for discrete elements), `06_vehicles/alley_car_wrecks_set`.
- **Unused spare:** `05_props/*` sets, `03_ground` variants (yellow_line / tiles / fragments),
  `alley_playable_ground_strip` (used the individual wet-asphalt instead), and the dumpster/barrel
  bottom-row elements (crops caught neighbours → dropped to keep it clean).

## 4. Layers created (clean layer model)
far skyline (0.2) → far mist → discrete structures `bar_building` + `wall_a` (0.5, period 520,
not tiled) → mid mist → ground (1.0) → sparse props `car`/`fence`/`door` → procedural atmosphere.

## 5. Files changed
- `tools/prepare-map-layers.js` — added `cropRect()` + `doLevel03()` + CLI `3`.
- `js/const.js` — `LOCATIONS[2].map = 2` (Zombie Alley now HD); BUILD v45.
- `js/sprites.js` — `loadMap(2, 'assets/maps/level_03/', {...})`.
- `sw.js` — cache zk-v45 + 7 precache entries.
- New runtime `assets/maps/level_03/` (far, ground, bar_building, wall_a, 3 props).
- No render/camera change (generic per-location HD path).

## 6–13. Pipeline / atmosphere / viewport / verification
- Silhouette pipeline used (no dark-bg removal, no tiled cutout strips, no PNG fog/rain, no
  noisy foreground). Procedural atmosphere applied (default subtle). v41 dynamic `VIEW_W` preserved.
- Real browser (Day 1 mission 3 = level 3, location 2):
  | Viewport | VIEW_W | Side bar | Fill | Scene | Ground |
  |---|---|---|---|---|---|
  | 1280×720 | 480 | 0 | 100% | 94% | — |
  | 812×375 | 584 | ~0 | 100% | 95% | 85.9% |
  All 7 assets HTTP 200; **0 console errors**; screenshot via deterministic frame render +
  pixel sampling (canvas-animation screenshot times out — known env limit).

## 14. Remaining risks / open questions
- Level 03 art is darker/grittier than Level 02; the buildings read as dark alley silhouettes
  (intended), but if you want more contrast I can raise the silhouette threshold or pick
  brighter crops (e.g., the BAR neon element).
- Dumpster/barrel dropped (palette crops caught neighbours); can be added later with tighter boxes.
- No `fx/lightpool` for level_03 (procedural atmosphere only).

## Explicit confirmations
- ✅ No files outside the project folder were touched.
- ✅ No rejected Level 01/02 assets were reintroduced.
- ✅ **Level 04 has NOT been started.**
- ✅ Weapon / shop / character / zombie / HUD / gameplay systems were NOT changed.
- ✅ Dynamic `VIEW_W` fullscreen (v41) preserved; location-based map binding intact.
