# LEVEL 02 — QUICK MART — MAP AUDIT & BUILD REPORT

- **Date:** 2026-07-13 · **Build:** `v42` / SW cache `zk-v42`
- **Theme slot:** theme 1 (campaign days 6–10) — loaded via `loadMap(1, 'assets/maps/level_02/')`.
- **Pipeline:** identical to Level 01 (silhouette cleanup, clean layer model, procedural
  atmosphere). Source pack: `assets/references/maps/levels/level_02_quick_mart/` (gitignored,
  local reference — not deployed).

## 1. Assets KEPT / used directly (opaque downscale, no keying)
| Runtime file | Source | Role |
|---|---|---|
| `far.png` | `01_layers/quickmart_far_background.png` | Far skyline (cohesive dark stormy city) |
| `ground.png` | `04_ground/wet_asphalt_long_no_line.png` | Playable wet-asphalt ground strip |

## 2. Assets USED AFTER CLEANUP (per-column silhouette + feather + trim)
| Runtime file | Source | Role |
|---|---|---|
| `facade.png` | `02_main_building/quickmart_store_facade_full.png` | Hero midground structure (Quick Mart storefront) |
| `power_pole.png` | `03_props_vehicles/power_pole.png` | Midground vertical accent |
| `props/van.png` | `03_props_vehicles/van_wreck.png` | Prop (vehicle) |
| `props/gas_pump.png` | `03_props_vehicles/gas_pump_red.png` | Prop (on-theme) |
| `props/dumpster.png` | `03_props_vehicles/dumpster_green.png` | Prop |
| `props/gas_sign.png` | `03_props_vehicles/gas_price_sign.png` | Prop (on-theme roadside sign) |

All output silhouettes visually verified clean: solid, halo-free, no swiss-cheese. The facade
retains its lit interior / OPEN neon / ICE / QUICK MART sign. (The `power_pole` has minor thin
wire fringe at the base — acceptable as a distant dark silhouette; not a halo/hole.)

## 3. Assets REJECTED / not used (see `_rejected_assets/level_02/REJECTED_MANIFEST.md`)
- **Rejected (violate pipeline rules):** `06_effects/*` (PNG fog/rain/neon/spark/beam/toxic/
  window-glow/reflection overlays — atmosphere is procedural); `05_foreground/*` (all debris
  sets — noisy foreground strips hurt readability).
- **Reference only:** `00_reference/*` concept boards; `02_main_building/` facade *parts*
  (redundant with the full facade); `07_sprite_sheets/*`; `08_animated/*`;
  `01_layers/quickmart_midground_industrial_layer.png` (redundant with far skyline, baked
  foreground).
- **Unused spare props (clean, left out for uncluttered scene):** car_sedan_wreck, pickup_wreck,
  suv_wreck, gas_pump_green, street_lamp, shopping_cart, ice_machine_large, barrels_3_set,
  crates_set, and ground variants (yellow_line / tiles / curb / road_end_fragments).

### Reasons for rejection
PNG effect overlays → replaced by procedural atmosphere; foreground debris → noisy/collage risk;
concept boards → not production art; facade parts/sheets → redundant; extra props → clutter.

## 4. Layers created (clean layer model)
1. Far skyline (`far.png`, opaque, tiled, parallax 0.2)
2. Far/horizon mist (procedural `drawFogBand 'far'`)
3. Discrete midground structures (`facade` + `power_pole`, parallax 0.5, pattern period 640 —
   NOT a tiled cutout strip)
4. Mid mist (procedural `drawFogBand 'mid'`)
5. Ground (`ground.png`, opaque, tiled, parallax 1.0)
6. Sparse props (`van`, `gas_pump`, `dumpster`, `gas_sign` — 4, well spaced)
7. Procedural atmosphere (foreground mist near-invisible + thin rain)

## 5. Files changed
- `tools/prepare-map-layers.js` — added `doLevel02()` + `emitOpaque()` + CLI dispatch
  (`node tools/prepare-map-layers.js 2`); Level 01 path untouched.
- `js/sprites.js` — `loadMaps()` now also `loadMap(1, 'assets/maps/level_02/', {...})`.
- `sw.js` — cache `zk-v42`; precache 8 Level 02 assets.
- `js/const.js` — `ZD.BUILD='v42'`.
- New runtime assets under `assets/maps/level_02/` (far, ground, facade, power_pole, 4 props).
- Docs: this report + `_rejected_assets/level_02/REJECTED_MANIFEST.md`; `docs/STATUS.md`,
  `CHANGELOG_AI.md`.
- **No `drawBackground`/`drawStructures`/`drawFog*`/render/camera change** — the existing
  generic per-theme HD path handles Level 02 as-is.

## 6–9. Pipeline / atmosphere / viewport
- **Silhouette pipeline used?** Yes (no dark-bg removal, no flood-fill, no tiled cutout strips,
  no PNG fog/rain, no noisy foreground).
- **Procedural atmosphere applied?** Yes (same `C.atmosphere`, default `subtle`).
- **v41 dynamic `VIEW_W` preserved?** Yes — unchanged; verified active on Level 02.

## 10–13. Verification (real browser, Level 02 = level 6, theme 1, 2026-07-13)
| Viewport | VIEW_W | Buffer | Side bar | Fill | Scene (non-black) | Ground |
|---|---|---|---|---|---|---|
| Desktop 1280×720 | 480 | 960×540 | 0 | 100% | 100% | 85.9% |
| Wide 1760×820 (2.15:1) | 580 | 1160×540 | 0 | 100% | 94% | 85.9% |
| Mobile landscape 812×375 | 584 | 1168×540 | ~0 | 100% | 94% | 85.9% |

- All 8 Level 02 assets load (HTTP 200). Deterministic frame render confirms the HD scene:
  dark-blue skyline at top, warm-lit facade in the mid, dark ground at bottom, warm neon/interior
  pixels present.
- **Desktop test:** PASS. **Mobile landscape test:** PASS.
- **Console errors:** none.
- **Screenshot note:** the browser screenshot tool times out on the continuously-animated canvas
  (known environment limitation); verification done via deterministic single-frame render +
  pixel sampling + per-asset PNG inspection (authoritative).

## 14. Remaining risks / open questions
- `power_pole` base has minor wire fringe — cosmetic; can raise the silhouette threshold if
  disliked.
- Level 02 has no `fx/lightpool.png` (the facade's baked interior/neon provides local light);
  procedural atmosphere still applies. Add a light pool later if wanted.
- Theme mapping: Level 02 occupies theme 1 (days 6–10). Levels 03/04/05 would take theme 2 and
  then reuse slots — the 3-theme cycle may need extension for 5 distinct environments (future).
- Spare clean props remain available if a fuller dressing is later desired.

## Explicit confirmations
- ✅ No files outside the project folder were touched.
- ✅ No rejected **Level 01** assets were reintroduced.
- ✅ **Level 03 has NOT been started.**
- ✅ Weapon / shop / character / zombie / HUD / gameplay systems were NOT changed.
- ✅ Dynamic `VIEW_W` fullscreen (v41) preserved; no revert to fixed 16:9 pillarbox.
