# FINAL MAP REPAIR SUMMARY

**Date:** 2026-07-09 · **Build:** v38 · **SW cache:** zk-v38
**Scope:** Level 01 "Quarantine Street" (theme 0 = campaign days 1–5) — the only HD map
wired into the engine.

---

## What was wrong

The in-game background looked fragmented / collage-like / patchy with dirty edges and
black-halo/swiss-cheese artifacts. **Root cause was the pipeline, not the source art:**

1. **Destructive alpha masking** — `removeDarkBg()` flood-filled a hard near-black
   threshold. On these near-black-background HD paintings the fill flooded *through*
   hollow ruined buildings and dark-on-dark vehicle areas, eating interior detail →
   swiss-cheese holes, ragged fringe, wheel halos.
2. **Collage-by-tiling** — the midground (`mid.png`, 3 building cutouts) and infrastructure
   (`near.png`, a row of separate poles/towers) were drawn as **full-width tiled parallax
   layers**, so they repeated and floated as disconnected cutouts.

## How it was fixed

- **New non-destructive masking** (`tools/prepare-map-layers.js`, rewritten): a **per-column
  silhouette fill** — for each column find the confident object pixels and fill the whole
  vertical span solid. This ignores interior darkness entirely, producing clean, solid,
  halo-free silhouettes, then a 3×3 alpha feather for smooth edges + alpha-bbox trim.
- **Composition discipline** — stopped tiling cutout strips. The midground is now a few
  **discrete** cleanly-masked structures placed at chosen positions (parallax 0.5), not a
  repeating strip. Foreground debris strip removed. Prop count cut hard.
- **Clean layer model** (`js/sprites.js`): far skyline → horizon-fog → discrete midground
  structures → ground → light pools → sparse vehicle props → drifting fog → scene grade;
  foreground = subtle rain only.

## Assets — kept / rejected / moved / regenerated

**Kept as-is (clean):** `far.png` (cohesive skyline), `ground.png` (wet road),
`props/police.png`, `fx/fog.png`, `fx/lightpool.png`, `fx/rain.png`.

**Regenerated clean (silhouette pipeline):** `bld_a.png` (left building), `bld_b.png`
(QUICK MART corner building), `watertower.png` (midground landmark), `props/bus.png`,
`props/car.png`.

**Rejected → moved to `_rejected_assets/level_01/` (not deleted):** `mid.png`, `near.png`,
`fg.png`, and props `bus/car/suv/barrel/trash/xbarricade/barrier.png` (old defective
outputs). The middle **hollow ruined building** was intentionally excluded — sky passes
through it, so it cannot be masked cleanly.

**Permanently deleted:** none.

## Map files / code changed

| File | Change |
|---|---|
| `tools/prepare-map-layers.js` | Rewritten: silhouette masking + feather + building segmentation; outputs bld_a/bld_b/watertower + re-masked bus/car/police |
| `js/sprites.js` | New `drawStructures()`; HD `drawBackground` uses far + horizon-fog + discrete structures + ground + sparse props + fog; `loadMap`/`loadMaps` new clean set; `drawForeground` = rain only (fg strip removed) |
| `js/const.js` | `ZD.BUILD` v37 → v38 |
| `sw.js` | cache zk-v37 → zk-v38; precache list updated (bld_a/bld_b/watertower in; mid/near/fg/suv/barrier/barrel/xbarricade/trash out) |
| `.gitignore` | `_rejected_assets/` kept local (binary rollback, not deployed) |

## Background structure changes

- Before: far(0.2) + **mid strip(0.5)** + **near strip(0.8)** + ground(1.0) + 11 props +
  **fg strip(1.12)**.
- After: far(0.2) + horizon-fog + **discrete structures(0.5): 2 buildings + water tower** +
  ground(1.0) + light pools + **3 vehicle props** + fog + scene grade; foreground = rain.

## Readability improvements

- No swiss-cheese holes / halos / dirty crop edges — objects are clean solid silhouettes.
- Fewer, larger, cleaner elements (11 props → 3; 2 shredded strips → 2 clean buildings +
  1 tower); no collage / cutout-dump look.
- Removed the noisy foreground debris strip that cluttered the play plane in front of the
  player → player and zombies read clearly against the background.

## Verification

- `node --check` on all JS: **OK**.
- Real browser (this session's own dev server), Level 01 in-game: clean cohesive scene —
  discrete buildings + water tower over the far skyline, bus/car/police as clean silhouettes
  on the wet road, subtle rain/fog. **0 console errors.**
- Viewport invariant (RENDERING_RULES) intact: desktop 1280×720 stage fills 100% at 16:9;
  mobile landscape 812×375 stage 667×375, 100% height, 16:9. No tiny-centred-box regression.

## Repaired maps

- **Map 1 — Level 01 Quarantine Street (theme 0, days 1–5): REPAIRED** as above.
- **Maps 2–5 (Quick Mart / Zombie Alley / Fortified Checkpoint / Infection Nest):** source
  packs exist locally (gitignored) but are **not** implemented in the engine yet — out of
  scope for this pass. The rebuilt silhouette pipeline is written to extend to them next.

## Safety confirmation

- **No files outside `PROJECT_ROOT` (`C:\Claude Munka\ZombieGame`) were read, moved, or
  deleted.** All audit, quarantine, and cleanup actions happened strictly inside the
  project folder. Rejected assets were **moved** to a project-local quarantine, not deleted.
