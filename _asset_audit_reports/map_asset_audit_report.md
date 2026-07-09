# MAP / BACKGROUND ASSET AUDIT REPORT

**Date:** 2026-07-09
**Scope:** Level 01 "Quarantine Street" runtime map assets (the only HD map wired into
the engine; theme 0 = campaign days 1–5). Themes 1–2 still render procedurally and are
out of scope. Levels 02–05 exist only as gitignored source packs and are **not** yet
implemented in the engine.
**Method:** Visual inspection of every runtime PNG under `assets/maps/level_01/`, the
processing tool (`tools/prepare-map-layers.js`), the rendering code (`js/sprites.js`),
and the original HD source strips under `assets/references/maps/levels/`.

---

## 0. Root cause of the "collage / patchy / dirty edge" problem

Two independent defects, both in the pipeline — **not** in the source art (the source
strips are clean, premium, cohesive):

1. **Destructive alpha extraction.** `removeDarkBg()` in `tools/prepare-map-layers.js`
   does an edge **flood-fill** keyed on a hard near-black threshold (`darkTh` 17–26) plus
   a thin feather. The HD layers are painted on a near-black **dark-teal** background, and
   the ruined buildings are *hollow* — sky shows through the gaps — so the fill floods
   *through* the building and eats interior brick/rubble that is also near-black. Result:
   swiss-cheese alpha holes + ragged semi-transparent fringe = the "shredded / patchy /
   halo / dirty edge" look. Vehicle wheels (dark tyre on dark ground) get the same
   halo rings.

2. **Collage-by-tiling.** `mid.png` (3 separate building cutouts with gaps) and
   `near.png` (a *row of individual* utility poles / a water tower / refinery towers —
   effectively a prop palette, not a scene) are drawn as **full-width tiled parallax
   layers**. Tiling discrete cutouts repeats "building, gap, building, gap…" and floats
   disconnected poles across the screen — an inherent "asset-dumped collage" even if the
   alpha were perfect.

**Fix direction (Phases 3–4):** replace destructive flood-fill with a non-destructive
**chroma-key ramp** (distance from the sampled background colour → smooth alpha, no
flood-fill, no holes), and stop tiling cutout strips — place a *few* cleanly-masked
**discrete** midground structures instead. Fewer, bigger, cleaner elements.

---

## 1. KEPT ASSETS (clean, cohesive, stay in `assets/maps/level_01/`)

| Asset | Size | Role | Why kept |
|---|---|---|---|
| `far.png` | 592 KB | Far background | Complete, cohesive painted night skyline (ruined city + smoke + fire glow). Reads as one finished premium scene on its own. Opaque full-bleed — no masking artifacts. **Hero layer.** |
| `ground.png` | 211 KB | Playable ground | Clean continuous wet-asphalt strip, consistent scale, opaque. Supports foot placement. |
| `props/police.png` | 11 KB | Prop (vehicle) | Cleanly separated dark cruiser + lightbar, minimal fringe. Good silhouette. |
| `fx/fog.png` | 146 KB | Atmosphere overlay | Additive (`lighter`) blend → black vanishes, no alpha needed. Subtle drifting smoke. (Minor faint top seam from label crop — cosmetic, re-trimmed in Phase 3.) |
| `fx/lightpool.png` | 31 KB | Atmosphere overlay | Additive streetlamp ground glow. Clean. |
| `fx/rain.png` | 186 KB | Atmosphere overlay | Additive rain/dust. Mixed-content sheet but black vanishes; used subtly. |

## 2. RE-PROCESS (source art is good; current runtime output is defective → regenerate clean)

These are **rejected in their current form** (moved to quarantine) but their **source
strips are excellent** and will be regenerated with the new chroma-key pipeline.

| Current asset | Size | Problem | Action |
|---|---|---|---|
| `mid.png` | 438 KB | Buildings shredded by flood-fill (swiss-cheese holes, ragged edges); tiled = repetitive | Regenerate as 2 **discrete** cleanly-masked buildings (skip the hollow-ruin centre that cannot mask cleanly) placed at fixed world-x, not tiled |
| `props/bus.png` | 61 KB | White halo rings around wheels, ragged underside | Re-mask with chroma-key |
| `props/car.png` | 20 KB | Wheel halos, ragged bottom | Re-mask with chroma-key |
| `props/suv.png` | 16 KB | Wheel halos, ragged bottom | Re-mask (or drop as near-duplicate of car — see §4) |

## 3. REJECTED ASSETS (removed from the map; moved to `_rejected_assets/`)

| Asset | Size | Reason for rejection |
|---|---|---|
| `near.png` | 158 KB | Row of disconnected utility poles / water tower / refinery towers = a **prop palette**, not a scene. Tiled as a parallax layer → floating-cutout collage. Poles heavily shredded by flood-fill. The **water tower** silhouette is salvaged separately from source as one discrete midground element. |
| `fg.png` | 40 KB | Foreground debris strip badly shredded (swiss-cheese) by `prop`-mode flood-fill; reads as noise across the bottom of the screen; hurts readability in front of the player. |
| `props/barrel.png` | 2.7 KB | Near-black unreadable blob; almost no legible silhouette. Low value, adds clutter. |
| `props/trash.png` | 2.8 KB | Shredded black-and-white noise fragment; broken alpha. |
| `props/xbarricade.png` | 3.2 KB | Reduced to a thin illegible sliver by masking; effectively broken. |
| `props/barrier.png` | 7.4 KB | Small concrete barrier; acceptable edges but low value and contributes to prop-spam. Rejected to favour fewer/bigger elements (can be reinstated later if needed). |

## 4. DUPLICATES / REDUNDANCY

- `car.png`, `suv.png`, `bus.png` are all "wrecked civilian vehicle." To avoid a
  repetitive vehicle row, the rebuilt map keeps at most **bus + one car + police**
  (3 vehicles across the whole level), spaced far apart. `suv.png` is treated as a
  **near-duplicate of `car.png`** and dropped unless a second car silhouette is needed.
- `mid.png` buildings overlap thematically with buildings already painted into
  `far.png`; the midground therefore uses only **2** discrete buildings for depth, not a
  full tiled row, to prevent building-on-building visual noise.

## 5. ASSETS MOVED TO `_rejected_assets/`

Moved (mirrored path `_rejected_assets/level_01/…`): `mid.png`, `near.png`, `fg.png`,
`props/bus.png`, `props/car.png`, `props/suv.png`, `props/barrel.png`, `props/trash.png`,
`props/xbarricade.png`, `props/barrier.png`.
(`bus`/`car` sources are re-masked into fresh runtime files; the quarantined copies are the
old defective outputs, preserved for rollback.) See
`_deleted_asset_logs/cleanup_log.md` for the exact move log + timestamps.

## 6. ASSETS STILL USED FOR THE FINAL MAP (after Phase 3 rebuild)

- **Far background:** `far.png` (kept as-is)
- **Midground structures:** `bld_a.png`, `bld_b.png` (2 discrete buildings, regenerated),
  `watertower.png` (1 silhouette, regenerated from the infrastructure source)
- **Ground:** `ground.png` (kept as-is)
- **Props (sparse):** `bus.png`, `car.png`, `police.png` (regenerated / kept; 3 total)
- **Atmosphere:** `fx/fog.png`, `fx/lightpool.png`, `fx/rain.png` (kept; used subtly)

## 7. RISKY / UNCERTAIN CASES

- **Middle ruined building** (hollow shell in the source buildings strip): genuinely hard
  to alpha-mask because sky passes through it. **Decision:** exclude it from the midground;
  use only the two solid end buildings. Low risk.
- **`fx/rain.png`** is a multi-effect sheet (dust + streaks + embers side by side); tiling
  can band. Mitigation: low alpha + treat as subtle. If banding shows in QA, crop to the
  rain-streak sub-region only.
- **Levels 02–05:** source-only, not implemented. This audit/repair covers Level 01 (the
  live map). The rebuilt pipeline is written to extend to them later, but they are **not**
  touched in this pass. Stated explicitly so "5 maps repaired" is not over-claimed.
