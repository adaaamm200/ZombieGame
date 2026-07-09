# MAP ASSET CLEANUP LOG

**Date:** 2026-07-09
**Action type:** MOVE to project-local quarantine (no permanent deletion).
**Boundary confirmation:** every path below is inside `PROJECT_ROOT`
(`C:\Claude Munka\ZombieGame`). Nothing outside the project folder was read, moved,
or deleted.

All rejected assets were **moved** (not deleted) into `_rejected_assets/level_01/`,
mirroring their original subpath, so they can be restored instantly if needed.

| Original path | Moved to | Reason |
|---|---|---|
| `assets/maps/level_01/mid.png` | `_rejected_assets/level_01/mid.png` | Shredded buildings (flood-fill swiss-cheese) + tiled collage |
| `assets/maps/level_01/near.png` | `_rejected_assets/level_01/near.png` | Disconnected pole/tower cutouts tiled as layer = floating collage |
| `assets/maps/level_01/fg.png` | `_rejected_assets/level_01/fg.png` | Debris strip shredded; foreground noise hurts readability |
| `assets/maps/level_01/props/bus.png` | `_rejected_assets/level_01/props/bus.png` | Wheel halos / ragged edges (old output; re-masked fresh) |
| `assets/maps/level_01/props/car.png` | `_rejected_assets/level_01/props/car.png` | Wheel halos / ragged edges (old output; re-masked fresh) |
| `assets/maps/level_01/props/suv.png` | `_rejected_assets/level_01/props/suv.png` | Wheel halos; near-duplicate of car |
| `assets/maps/level_01/props/barrel.png` | `_rejected_assets/level_01/props/barrel.png` | Unreadable near-black blob |
| `assets/maps/level_01/props/trash.png` | `_rejected_assets/level_01/props/trash.png` | Shredded noise, broken alpha |
| `assets/maps/level_01/props/xbarricade.png` | `_rejected_assets/level_01/props/xbarricade.png` | Illegible sliver, broken |
| `assets/maps/level_01/props/barrier.png` | `_rejected_assets/level_01/props/barrier.png` | Low value; favour fewer/bigger elements |

**Permanently deleted:** none.

**Remaining in `assets/maps/level_01/` after cleanup:**
`far.png`, `ground.png`, `props/police.png`, `fx/fog.png`, `fx/lightpool.png`,
`fx/rain.png` — plus the freshly regenerated clean layers written in Phase 3
(`bld_a.png`, `bld_b.png`, `watertower.png`, re-masked `props/bus.png`, `props/car.png`).
