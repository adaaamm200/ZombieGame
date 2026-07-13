# ART PIPELINE — ZombieChronicles maps & atmosphere

> The proven, reference approach for Level 01. Reuse it verbatim for Levels 02–05.
> Companion to [`DO_NOT_DO.md`](DO_NOT_DO.md). Tool: `tools/prepare-map-layers.js`.

## Hard lessons (why this pipeline exists)
- **A. Concept sheets are not production assets.** Some generated images are direction only.
  Audit before use.
- **B. Automatic dark/black background removal is dangerous.** The art is dark; black/dark
  areas ARE part of buildings, vehicles, zombie bodies, wheels, shadows, inner detail,
  silhouettes. Global dark-threshold/flood-fill removal shreds them ("swiss cheese" holes,
  ragged edges, halos). **Never use global dark-background removal again.**
- **C. Too many small props → messy collage.** Use **fewer, larger, cleaner, cohesive**
  structures.
- **D. Tiled cutout strips → visible repetition/collage.** Do not tile random cropped
  mid/near/foreground strips as full parallax layers.

## Cleanup method — per-column SILHOUETTE fill (replaces dark-bg removal)
For a discrete object (building, vehicle, tower) painted on a near-black background:
1. Sample the background colour from the border.
2. **Per column**, find the top-most and bottom-most *confident* object pixels
   (`luminance > bg + delta`) and fill the whole vertical span solid. This ignores interior
   darkness entirely → a clean, solid, halo-free silhouette (no interior holes).
3. `featherAlpha()` — 3×3 alpha blur for smooth edges.
4. `trim()` — crop to the alpha bounding box.
5. For a multi-object strip: crop to the chosen object's x-range (skip hollow ruins that let
   sky through — they cannot be masked cleanly).

Result: solid, cleanly-edged discrete structures. No flood-fill, no threshold cut, no halos.

## Clean layer model (draw order)
1. **Far skyline** (opaque, downscaled; tiled at low parallax ~0.2) — one cohesive painted city.
2. **Far / horizon mist** (procedural — see atmosphere).
3. **Discrete midground structures** — a FEW cleanly-masked buildings/towers placed at chosen
   world-x, parallax ~0.5. **Not** a tiled cutout strip.
4. **Ground** — one clean continuous playable strip (opaque, tiled at parallax 1.0). Defines the
   visual baseline; player/zombie feet stand on it.
5. **Light pool** — localized warm streetlamp glow on the ground (subtle).
6. **Limited vehicle props** — 2–3 clean silhouettes, well spaced (behind entities).
7. **Subtle procedural atmosphere** — foreground mist (near-invisible) + thin rain (front).

`drawForeground` must NOT use a noisy foreground debris strip. Foreground = subtle rain +
near-invisible mist only.

## Atmosphere (procedural, no PNG overlays)
No full-screen haze, no PNG fog/rain sheets. Depth-banded procedural fog puffs (far stronger →
mid faint → foreground almost invisible) + thin, sparse, moving rain streaks. Config in
`js/const.js` `C.atmosphere` (default `intensity: 'subtle'`):

```
atmosphere: { enabled, intensity('off'|'subtle'|'strong'|number),
  fogEnabled, fogFarAlpha:0.10, fogMidAlpha:0.05, fogForegroundAlpha:0.02,
  rainEnabled, rainAlpha:0.12, rainDensity:0.35, rainSpeed:1.0, lightPools:true }
```
Runtime: `ZD.C.atmosphere.intensity = 'off'|'subtle'|'strong'` or `.enabled = false`. Keep
default **subtle**; do NOT add a Settings UI for this yet.

## Asset rules
- Use only clean assets that improve readability and cohesion.
- Reject/move bad assets → project-local `_rejected_assets/<level>/` (**move, don't delete**).
- Never delete files outside the project; never touch anything outside project root.
- Runtime map assets live under `assets/maps/<level>/`. Large source packs live under
  `assets/references/maps/` and stay **gitignored** (local reference, not deployed).
- Every level: write an audit report under `_asset_audit_reports/` (kept / rejected / moved /
  layers created / alignment + atmosphere status).

## Per-level checklist (Levels 02–05)
1. Audit source pack → kept/rejected list.
2. Quarantine rejected → `_rejected_assets/<level>/`.
3. Silhouette-clean the chosen few structures + ground + far skyline.
4. Wire the clean layer model + sparse props + procedural atmosphere.
5. Preserve v41 dynamic `VIEW_W` fullscreen; verify alignment ([`ACCEPTANCE_TESTS.md`](ACCEPTANCE_TESTS.md)).
6. `node --check` all JS, bump `ZD.BUILD` + `sw.js` cache, update `docs/STATUS.md` + `CHANGELOG_AI.md`.
7. Report; wait for approval.
