# ACCEPTANCE TESTS — ZombieChronicles

> The checks every map/viewport change must pass before it is considered stable.
> Companion to [`ART_PIPELINE.md`](ART_PIPELINE.md). Baseline recorded for build v41.

## How to run
1. Start the dev server (preview `zombie-dev`, or `node tools/server.js`) → open in a browser.
2. Enter Level 01 (campaign day 1). In console you can force it:
   `ZD.game.start(1)` then hide menus for a clean look.
3. Toggle the alignment overlay with the **`G`** key (or `ZD.game.dbg.align = true`).
4. Resize the viewport to each target and read the metrics / look at the overlay.
5. `node --check` on all JS files; confirm **0 console errors**.

## A) v41 fullscreen / viewport — MUST pass
- [ ] Build/cache is `v41` / `zk-v41` (`ZD.BUILD`, `sw.js VERSION`).
- [ ] Internal height is fixed: `VIEW_H === 270`; canvas buffer height `540`.
- [ ] `VIEW_W` is **dynamic** with viewport aspect (clamped ~1.6–2.6 × height); buffer width
      `= VIEW_W * RS`.
- [ ] Gameplay `#stage` fills the viewport — **no side black bars** in the normal aspect range.
- [ ] Wider-than-16:9 shows **more world horizontally** (not stretched/zoomed art).
- [ ] Player feet align with the ground baseline (~86%); props sit on the ground.
- [ ] HUD + touch controls stay screen-space (at the screen edges), no drift.
- [ ] 0 console errors.

## B) Map composition — MUST pass
- [ ] No swiss-cheese holes, halos, or dirty crop edges on structures/props.
- [ ] No tiled cutout-strip repetition / collage look.
- [ ] Fewer, larger, cleaner structures; limited props.
- [ ] Far skyline cohesive; ground continuous; discrete midground structures.
- [ ] No rejected assets reintroduced.

## C) Atmosphere — MUST pass
- [ ] Procedural fog (depth-banded) + thin rain; **no** full-screen PNG haze.
- [ ] Default `intensity: 'subtle'`; scene stays sharp/readable (not washed out).
- [ ] `off` / `subtle` / `strong` all render without errors; `enabled:false` = fully clean.

## D) Safety — MUST pass
- [ ] No files outside project root touched.
- [ ] Rejected assets moved to `_rejected_assets/` (not deleted); logged.

## Verified baseline — build v41 (2026-07-13, real browser, Level 01)
| Viewport | Aspect | VIEW_W | Buffer | Stage | Side bar | Fill | Ground |
|---|---|---|---|---|---|---|---|
| 1280×720 | 1.78 | 480 | 960×540 | 1280×720 | 0 | 100% | 85.9% |
| 1760×820 | 2.15 | 580 | 1160×540 | 1760×819 | 0 | 100% | — |
| 812×375 (mobile landscape) | 2.16 | 584 | 1168×540 | 811×375 | ~0 | 100% | 85.9% |
| 2400×800 (ultrawide) | 3.00 | 702 (clamp 2.6) | 1404×540 | 2080×800 | 160/side* | 100% h | — |

\* Controlled, intended pillarbox above 2.6:1 (perf/balance guard). All: dynamic VIEW_W active,
VIEW_H fixed 270, player on ground line, **0 console errors**. Result: **PASS**.

## Per-level report template (Levels 02–05)
For each new level, produce `_asset_audit_reports/level_0X_final_status.md` with:
kept assets · rejected/moved assets · layers created · alignment verified (A) · atmosphere
applied (C) · screenshot/test status · console-error status · v41 fullscreen confirmed (A) ·
safety confirmed (D).
