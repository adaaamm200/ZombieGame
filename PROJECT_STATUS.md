# PROJECT STATUS — ZombieChronicles / Zombi Krónika

> Consolidation checkpoint. Read this first, then [`CURRENT_ROADMAP.md`](CURRENT_ROADMAP.md),
> [`ART_PIPELINE.md`](ART_PIPELINE.md), [`DO_NOT_DO.md`](DO_NOT_DO.md),
> [`ACCEPTANCE_TESTS.md`](ACCEPTANCE_TESTS.md). Live running log stays in
> [`docs/STATUS.md`](docs/STATUS.md).

- **Date:** 2026-07-13
- **Current build:** `v41` / SW cache `zk-v41` (verified in `js/const.js` + `sw.js`)
- **Current focus:** Level 01 stability verified → proceed to **Level 02 only** (on approval).
- **Direction:** *Zombie Diary-style simple mobile 2D side-scroller, visually much more
  premium.* NOT COD, NOT a loot shooter, NOT 3D, NOT a perk/gunsmith/multi-currency game.

## Core constraints (final unless explicitly changed)
- **1 currency only.** No premium/essence/third currency.
- **No perks. No ground weapon loot. No COD gunsmith/attachments/loadouts.**
- Weapons: **bought + upgraded in the Armory** (upgrade = mainly damage; optionally fire
  rate / reload / magazine). Keep simple.
- Shop = simple consumables only: grenade, medkit/health, ammo pack, armor, simple utility
  (e.g. slow trap).
- Match pickups: money, ammo, grenade, medkit, armor, simple utility — **never weapons.**

## System status

| System | State | Notes |
|---|---|---|
| Core creative direction | ✅ Locked | "upgraded Zombie Diary, not COD" |
| Fullscreen / viewport / mobile fit | ✅ Stable (v41) | Dynamic `VIEW_W`, fixed `VIEW_H=270`, no side bars — **verified** |
| Level 01 background pipeline | ✅ Stable (v38) | Silhouette pipeline; golden reference model |
| Atmosphere system | ✅ Stable (v39) | Procedural depth-banded fog + thin rain |
| Align-debug overlay | ✅ Present (v40) | `G` key, off by default — keep |
| Asset audit / quarantine workflow | ✅ Established | `_rejected_assets/` (project-local, gitignored) |
| Level 02–05 backgrounds | 🔶 Not integrated | Source packs exist (gitignored); not wired |
| Main menu / UI | 🔶 Partial | Works; not final polish |
| HUD | 🔶 Partial | Functional; not matched to premium bg yet |
| Armory / Shop | 🔶 Direction set | Not (re)implemented in this pass |
| Weapon visual direction | 🔶 Direction set | Asset pack exists; do NOT implement yet |
| Player character sprite | 🔴 Weak | Placeholder-ish; overhaul later |
| Zombie sprites | 🔴 Weak | Placeholder-ish; overhaul later |
| Combat VFX | 🔶 Partial | Basic muzzle/tracer/impact exist |
| Balance | 🔴 Early | Not tuned for the new content |

Legend: ✅ stable · 🔶 partial/direction-set · 🔴 weak/not-done.

## Done / partial / not-done
- **Done (acceptable direction):** creative direction, 1-currency weapon rule, no-perk/no-loot
  rule, Level 01 map cleanup pipeline, procedural atmosphere, asset audit+quarantine workflow,
  project-local safety rule, v41 dynamic fullscreen gameplay.
- **Partial:** Level 01 final state, viewport/fullscreen handling, map asset pipeline, weapon
  asset direction, armory/shop visual direction, HUD visual direction.
- **Not done:** Level 02–05 integration, final character sprites, final zombie sprites, weapon/
  shop implementation, HUD polish, combat VFX integration, balancing, full QA, doc consolidation
  (this checkpoint addresses the last item).

## Approximate completion (owner estimate, carried from checkpoint)
Core gameplay 60–70% · Fullscreen/viewport 70% (v41 verified) · Level 01 bg pipeline 80–90%
(v41 verified) · Level 02–05 bg 25–35% · Atmosphere 80% · Menu/UI 50–60% · HUD 35–45% ·
Armory/Shop 50% · Weapon visual 65% · Character 20–30% · Zombies 25–35% · Combat VFX 35–45% ·
Balance 20–30% · Docs/structure 50–60% (raised by this checkpoint).

**Overall:** working base with a developing visual overhaul. The need now is **controlled
integration**, not more uncontrolled asset generation.

## v41 fullscreen verification (measured 2026-07-13, real browser, Level 01)
| Viewport | VIEW_W | Buffer | Stage | Side bar | Fill | Ground |
|---|---|---|---|---|---|---|
| Desktop 1280×720 (16:9) | 480 | 960×540 | 1280×720 | 0 | 100% | 85.9% |
| Wide 1760×820 (2.15:1) | 580 | 1160×540 | 1760×819 | 0 | 100% | — |
| Mobile landscape 812×375 | 584 | 1168×540 | 811×375 | ~0 | 100% | 85.9% |
| Ultrawide 2400×800 (3:1) | 702 (clamp 2.6) | 1404×540 | 2080×800 | 160/side (controlled) | 100% h | — |

Dynamic `VIEW_W` active, `VIEW_H` fixed at 270, **no side bars** in the normal range, player
feet on the ground baseline, **0 console errors**. See
[`_asset_audit_reports/level_01_final_status.md`](_asset_audit_reports/level_01_final_status.md).

## Remaining risks
- Extreme ultrawide (>2.6:1) keeps a small controlled pillarbox by design (perf/balance guard).
- Wider `VIEW_W` shows more world → zombies spawn slightly further off-screen (negligible; watch
  during balance).
- Level 02–05 source packs are unaudited; treat as raw source, not production assets.
- Player/zombie sprites still lag the upgraded backgrounds (planned later, not now).

## Next task
Per [`CURRENT_ROADMAP.md`](CURRENT_ROADMAP.md): Level 01 / v41 verified → **Level 02 only**,
using the Level 01 pipeline and rules, then wait for approval before Level 03.
