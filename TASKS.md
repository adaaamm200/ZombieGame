# ZombieGame / Zombi Krónika — Tasks

## Current Priority
**M0 — Project memory and agent system setup.**

## Next Suggested Task
**Integrate the owner-provided premium UI kit** in `assets/references/ui_kit_v1/`
(see its `README.md` for the full mapping + processing plan). A consolidated,
de-duplicated set of individually composed icons/elements — NO sheet slicing needed:
- `menu/` (8 octagons: continue/campaign/scavenge/armory/lab/**shop**/settings/back)
  → `assets/ui/m-*.png`
- `markers/` (6: completed/current/boss/loot/danger/**locked**) → `assets/ui/s-*.png`
- `elements/` (coin, supply_crate, DAY banner+plaque, danger meter, XP) — keep aspect,
  coin → `ic-coin`; others deferred to a board/briefing polish pass
- `logo/` (full 16:9 + wide) → replace `assets/ui/logo.png`

All sources are 1254×1254 RGB with a flat light (~242–254) background: make transparent
(edge flood-fill, preserve inner highlights), pad to 256 at ~70%, output over the
`assets/ui/*.png`. No CSS change needed (object-fit: contain). Then screenshot-verify,
bump sw.js cache, update STATUS + CHANGELOG. **Now shop + all markers ARE provided.**

_Done previously: memory/agent system (M0), visual QA audit, the rendered icon-clipping
+ back-button-sizing fix, and organizing the ui_kit_v1 sources (this step)._

## Do Not Do Yet
- sprite implementation
- gameplay rewrite
- balance rewrite
- new asset generation inside Claude
- full campaign expansion
- keycard / blueprint system

---

See [`docs/vision/50_ROADMAP.md`](docs/vision/50_ROADMAP.md) for milestones and
[`docs/STATUS.md`](docs/STATUS.md) for the live status log.
