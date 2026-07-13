# DO NOT DO — ZombieChronicles guardrails

> Hard constraints and anti-patterns. Read before any map/art/gameplay work.
> Companion to [`ART_PIPELINE.md`](ART_PIPELINE.md) and [`CURRENT_ROADMAP.md`](CURRENT_ROADMAP.md).

## Right now (this phase) — do NOT
- ❌ Generate new assets.
- ❌ Start weapon/armory/shop implementation.
- ❌ Start player-character overhaul.
- ❌ Start zombie overhaul.
- ❌ Process Levels 02–05 all at once (one level at a time, on approval).
- ❌ Overhaul the UI/HUD (only fix fullscreen/stage/alignment if needed).

## Art / map — do NOT
- ❌ Use automatic dark/black background removal (flood-fill / hard threshold). It shreds dark
  art. Use the per-column silhouette method instead.
- ❌ Use concept boards / overview sheets as production assets.
- ❌ Reintroduce rejected assets (they live in `_rejected_assets/`).
- ❌ Increase prop clutter — prefer fewer, larger, cleaner structures.
- ❌ Tile random cropped mid/near/foreground cutout strips as full parallax layers.
- ❌ Add PNG full-screen fog/rain overlays (atmosphere is procedural).
- ❌ Add a noisy foreground debris strip.

## Design / systems — do NOT
- ❌ Add more currencies (1 currency only).
- ❌ Add perks.
- ❌ Add ground weapon pickups (weapons are Armory-only).
- ❌ Add COD-style gunsmith / attachments / loadouts / weapon rarity loot.
- ❌ Include weapons in match pickups.
- ❌ Overcomplicate weapon upgrades (mainly damage; optionally fire rate / reload / mag).

## Viewport / fullscreen — do NOT
- ❌ Revert gameplay to a fixed 16:9 pillarboxed `#stage` box.
- ❌ "Fix" wide screens by zooming/cropping gameplay.
- ✅ Keep the accepted v41 direction: **dynamic `VIEW_W` with fixed internal height** (wider
  screens show more world horizontally; UI stays screen-space).

## Safety — do NOT
- ❌ Touch, read, move, or delete anything outside the project root
  (`C:\Claude Munka\ZombieGame`).
- ❌ Permanently delete files — move to `_rejected_assets/` and log in
  `_deleted_asset_logs/` (project-local only).
- ❌ Remove the align-debug overlay (`G` key) — keep it, off by default.
- ❌ Install dependencies, add a build step/framework, or force-push.

## The correct direction (for reference)
"**Zombie Diary-style simple mobile gameplay, but visually much more polished and premium.**"
NOT Call of Duty, NOT a loot shooter, NOT 3D, NOT a tactical/perk/gunsmith/multi-currency game.
