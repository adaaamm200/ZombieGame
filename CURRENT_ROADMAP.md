# CURRENT ROADMAP — ZombieChronicles

> Strict task order. Do not skip steps or open parallel workstreams. Companion to
> [`PROJECT_STATUS.md`](PROJECT_STATUS.md) and [`DO_NOT_DO.md`](DO_NOT_DO.md).
> This supersedes the older milestone plan in [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md)
> for near-term ordering (the vision in MASTER_PLAN still holds).

## Guiding principle
The main need now is **controlled integration and pipeline discipline**, not more asset
generation. One workstream at a time. Verify + report + wait for approval between levels.

## IMMEDIATE ORDER (near-term)

### TASK 1 — Project status documentation ✅ (this checkpoint)
Create/maintain: `PROJECT_STATUS.md`, `CURRENT_ROADMAP.md`, `ART_PIPELINE.md`, `DO_NOT_DO.md`,
`ACCEPTANCE_TESTS.md`, and `_asset_audit_reports/level_01_final_status.md`.

### TASK 2 — Verify v41 fullscreen behavior ✅ (verified 2026-07-13)
Confirm build/cache `v41`/`zk-v41`; dynamic `VIEW_W`, fixed internal height 270; no side bars;
wide screens show more world (not stretched); player feet on ground; UI screen-space;
0 console errors. Checked desktop 1280×720, wide 1760×820, mobile landscape 812×375. See
[`ACCEPTANCE_TESTS.md`](ACCEPTANCE_TESTS.md).

### TASK 3 — Level 01 final approval report ✅
`_asset_audit_reports/level_01_final_status.md` (v41 verified, side bars gone, dynamic VIEW_W
active, alignment stable, atmosphere works, rejected assets stayed rejected, nothing outside
project touched).

### TASK 4 — Level 02 ONLY (next, on approval)
Do **not** process 02–05 together. Level 02 workflow:
1. Audit the Level 02 (Quick Mart) source pack.
2. Reject bad assets → `_rejected_assets/level_02/` (move, don't delete).
3. Use the **same silhouette/clean pipeline** ([`ART_PIPELINE.md`](ART_PIPELINE.md)):
   no dark-background removal, no tiled cutout strips, fewer/larger/cleaner structures.
4. Same procedural atmosphere; preserve v41 dynamic `VIEW_W` fullscreen behavior.
5. Verify alignment + fullscreen ([`ACCEPTANCE_TESTS.md`](ACCEPTANCE_TESTS.md)).
6. Report; **wait for approval** before Level 03.

### TASK 5 — Levels 03 → 04 → 05, one by one (each on approval)
Each level: audit report · rejected list · kept list · changed files · screenshot/test status ·
console-error status · alignment confirmation · v41 fullscreen confirmation.

## RECOMMENDED ROADMAP (after Levels 01–05 backgrounds are stable)

### Phase A — Player character
One clean main-character sprite system: idle / run / shoot / reload / hurt / death; consistent
scale; optional rim light; must match the upgraded backgrounds.

### Phase B — Zombies
Start with **3 types only**: basic walker, runner, tank/brute. Later: toxic/spitter,
exploder/bloater, crawler, boss.

### Phase C — Weapon / Armory / Shop
One-currency weapon config; weapon list; selected-weapon panel; upgrade levels 1–10 (mainly
damage; optional fire rate / reload / mag); simple shop consumables; match pickups (no weapons);
HUD connection. No perks, no gunsmith, no loadouts.

### Phase D — Combat juice
Muzzle flash, tracer, hit spark, explosion, enemy hit reaction, subtle screen shake, pickup
animation.

### Phase E — Balance / polish
Zombie HP, weapon prices, upgrade prices, shop prices, rewards, wave difficulty, ammo economy.

## Do NOT start now
New assets, weapon implementation, character overhaul, zombie overhaul, UI overhaul, or Levels
02–05 in bulk. See [`DO_NOT_DO.md`](DO_NOT_DO.md).
