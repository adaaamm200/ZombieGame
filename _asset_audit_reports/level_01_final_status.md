# LEVEL 01 — FINAL STATUS REPORT

- **Date:** 2026-07-13
- **Build:** `v41` / SW cache `zk-v41`
- **Level:** 01 "Quarantine Street" (theme 0 = campaign days 1–5) — the only HD map wired into
  the engine and the **golden reference** for Levels 02–05.

## Verdict: STABLE ✅ (approved as reference)

## v41 fullscreen behavior — VERIFIED
Measured in a real browser (2026-07-13), Level 01 running:

| Viewport | VIEW_W | Buffer | Stage | Side bar | Fill | Ground |
|---|---|---|---|---|---|---|
| Desktop 1280×720 (16:9) | 480 | 960×540 | 1280×720 | **0** | 100% | 85.9% |
| Wide 1760×820 (2.15:1) | 580 | 1160×540 | 1760×819 | **0** | 100% | — |
| Mobile landscape 812×375 | 584 | 1168×540 | 811×375 | **~0** | 100% | 85.9% |
| Ultrawide 2400×800 (3:1) | 702 (clamp 2.6) | 1404×540 | 2080×800 | 160/side* | 100% h | — |

\* Controlled, intended pillarbox only above 2.6:1 (perf/balance guard).

- **Old side black bars gone?** Yes — 16:9, 2.15:1 and mobile landscape all show side bar 0 and
  100% fill (mobile landscape was 73px/side before v41).
- **Dynamic VIEW_W active?** Yes — 480 → 580 → 584 → 702 as aspect widens; `VIEW_H` fixed at 270.
- **Wide screens show more world (not stretched)?** Yes — buffer width scales with VIEW_W; art
  is not distorted.
- **Alignment stable?** Yes — player feet on the ground baseline (~86%) at every viewport;
  verified with the `G`-key align overlay (stage frame, ground line, foot marker).
- **UI screen-space?** Yes — HUD + touch controls sit at the screen edges, no drift.
- **Console errors?** None.

## Files changed since this became the reference
- Level 01 background pipeline (v38): `tools/prepare-map-layers.js` (silhouette cleanup),
  `js/sprites.js` (clean layer model + `drawStructures`).
- Atmosphere (v39): `js/sprites.js` (`drawFogBand` + `drawAtmoRain`), `js/const.js`
  (`C.atmosphere`).
- Align-debug overlay (v40): `js/game.js` (`drawAlignDebug` + `dbg.align`), `js/main.js`
  (`G` key). Off by default.
- Fullscreen fit (v41): `js/main.js` (`fit()` dynamic `VIEW_W`), `js/const.js` (`VIEW_W` note).
- This checkpoint (docs only): `PROJECT_STATUS.md`, `CURRENT_ROADMAP.md`, `ART_PIPELINE.md`,
  `DO_NOT_DO.md`, `ACCEPTANCE_TESTS.md`, this report.

## Atmosphere — still working
Procedural depth-banded fog + thin rain; default `intensity: 'subtle'`; scene sharp/readable;
`off` / `subtle` / `strong` and `enabled:false` all render cleanly. No PNG fog/rain overlay.

## Assets
- **Kept:** `far.png`, `ground.png`, `props/police.png`, `fx/lightpool.png`.
- **Regenerated clean (silhouette):** `bld_a.png`, `bld_b.png`, `watertower.png`,
  `props/bus.png`, `props/car.png`.
- **Rejected → quarantine** (`_rejected_assets/level_01/`, moved not deleted): `mid.png`,
  `near.png`, `fg.png`, `fx/fog.png`, `fx/rain.png`, and noisy props (suv/barrel/trash/
  xbarricade/barrier). **Rejected assets stayed rejected** — none reintroduced.
- Composition follows the clean layer model (fewer/larger/cleaner structures).

## Safety confirmation
- No files outside `PROJECT_ROOT` (`C:\Claude Munka\ZombieGame`) were touched.
- No permanent deletions; rejected assets are in project-local quarantine and logged in
  `_deleted_asset_logs/cleanup_log.md`.

## Conclusion
Level 01 and the v41 fullscreen behavior are **stable and verified**. This map is the reference
model. Cleared to proceed to **Level 02 only** (on approval), per
[`CURRENT_ROADMAP.md`](../CURRENT_ROADMAP.md).
