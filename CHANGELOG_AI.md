# ZombieGame / Zombi Krónika — AI Changelog

Append one entry per completed work phase. Newest on top.

Entry format:

```
### YYYY-MM-DD — Short title
- Goal:
- Files changed:
- What changed:
- Tests run:
- Visual QA:
- What was not changed:
- Open questions:
- Next recommended step:
```

---

### 2026-07-23 — Vector glyph icon system replaces muddy PNGs and pixel icons
- Goal: the icons were the weakest remaining link — generated `m-*.png` badges read as mud
  at 44px, and the lab still drew crude procedural canvas pixel icons.
- Root cause: js/icons.js already held a decent inline-SVG set, but `AIMG()` always preferred
  the PNG asset so the SVGs never rendered; the lab bypassed the system entirely.
- Files changed: js/icons.js (5 new upgrade glyphs + armory redrawn), js/ui.js (lab and menu
  now emit glyphs; back/gear buttons too), css/style.css (glyph sizing, recessed icon well,
  per-upgrade category tints), sw.js/index.html (v69), docs/STATUS.md.
- What changed: icons are now vector, inherit `currentColor` so one file serves every category
  colour, and are drawn as solid silhouettes with a dark inner detail so they survive at 30px.
  Lab upgrades are colour-coded (hp red, regen green, dmg gold, crit orange, speed blue,
  gren olive, luck purple). The board's hotspot hexagons and large generated buttons were
  deliberately left alone since the user considers the board good.
- Tests run: node --check on js (OK), zero load errors, sw bumped zk-v69.
- Visual QA: every screen rendered headless, plus 4x zoom strips of the icon wells. Five real
  defects were caught only by zooming in and fixed: unreadable boot-based speed icon (now a
  double chevron), clover leaves merging into a blob (added dark separator outlines), cluttered
  regen cross, shapeless armory weapon (now a clean pistol silhouette), and a stale
  `.menu-btn .mb-ic svg` fallback rule that forced its own accent colour onto the glyph so the
  play icon stayed green on the gold plate.
- What was not changed: gameplay, board artwork/buttons/hotspots, weapon sprites, fonts.
- Open questions: the board's left nav still uses generated PNGs, so its settings cog now
  differs from the new vector cog in the top-right — migrate the nav too, or leave it?
- Next recommended step: player movement feel (accel/decel/momentum) — still one instant
  velocity line at js/game.js:645. `ZD.sprites.upgIcon()` is now dead code (task spawned).

### 2026-07-23 — UI unification: typography, metal-plate buttons, atmosphere
- Goal: user reported the whole UI feels cheap, every screen looks different, the main menu
  is still the v1 green neon, no effects, "like a 1990s pixel game".
- Root causes (measured, not vibes): every string rendered in Courier New (a 1955 typewriter
  face); `.menu-btn` was a flat box with a 2px neon border defaulting to the legacy `#7ddb4f`;
  four separate visual languages coexisted (neon menu card / generated board PNG / steel
  plaque shop / green HUD chip); no atmosphere layer at all.
- Files changed: css/fonts.css (new), assets/fonts/* (new, SIL OFL woff2 + licenses),
  css/style.css, js/ui.js, js/main.js, index.html, sw.js, docs/STATUS.md.
- What changed: (1) real game typography via local @font-face, `--font-ui`/`--font-display`,
  Oswald as default — both `latin` AND `latin-ext` subsets shipped so Hungarian ő/ű render;
  (2) one metal-plate button system shared by `.plate/.btn/.tab/.menu-btn` — chamfer clip-path
  + concentric inset-shadow rings + drop-shadow glow, no pseudo-elements so real text stays on
  top; variants primary/danger/ok/ghost; (3) legacy green retired except where it means
  ready/success (equipped, purchase flash, done/next, win, HP); (4) `.scr-fx` atmosphere layer
  (drifting embers + SVG-turbulence grain + vignette), position:fixed so it survives scrolling.
- Tests run: node --check on all js + sw (OK), zero load errors, sw bumped zk-v65.
- Visual QA: every screen rendered headless and inspected — title, board, armory (3 tabs +
  scrolled), lab, settings, modals. Two real defects were caught this way and fixed: the first
  atmosphere pass washed the painted backdrop milky (grain opacity 0.5 + vignette both in
  soft-light → 0.09 overlay + separate box-shadow vignette), and staggered entrance animations
  made headless shots drop random buttons (fixed properly by honouring prefers-reduced-motion).
- What was not changed: gameplay, board artwork and its generated PNG buttons (user considers
  those good), part-rig, sprites.
- Open questions: the icons are now the weakest link — `assets/ui/m-*.png` read as mud at 44px
  and the lab still uses crude procedural pixel icons; SVG would fix both at zero credit cost.
- Next recommended step: replace the icon set with vector icons, then revisit player movement
  (accel/decel) which is still a single instant-velocity line in game.js.

### 2026-07-22 — Menu overhaul "B": armory/lab/settings in board mood
- Goal: user picked option "B" (full package) — the flat shop/lab/settings screens must adopt
  the campaign-board mood: painted backdrop + worn metal plaques + premium tabs + HD weapon icons.
- Files changed: css/style.css, js/ui.js, js/sprites.js, js/main.js, tools/qa_seed.html (new),
  assets/sprites/weapons/clean/w2_vipera.png + w8_ion.png (cleaned), sw.js + index.html (v61),
  docs/STATUS.md.
- What changed: painted main-menu artwork as CSS background of #s-armory/#s-lab/#s-settings
  (scrim + gold/blue category glow); reusable steel-plaque design tokens (--steel-face,
  --plaque-inset, --rvt rivets); cards/tabs/h2/modalbox/settings-panel/loadout as riveted
  brushed-metal plaques with category accent (gold=armory, blue=lab); stat bars green→amber;
  lab pips blue + 2-column wide cards; weaponIconSrc() serves the clean painted weapon PNGs to
  shop/loadout/HUD chip (procedural icon is fallback only); checkerboard-pattern detector +
  island removal cleaned baked residue from w2_vipera and w8_ion (canvas size preserved for
  WGUN_CFG grip ratios).
- Tests run: node --check on all js (OK), 0 console errors, sw bumped zk-v61.
- Visual QA: headless-Chrome screenshots of every view (armory weapons/ammo/survivors tabs,
  scrolled rows, lab, settings, owned/equipped states) via new dev hash-hook
  (#screen[@scrollTop][@tab]) + tools/qa_seed.html seeded save; residue zoom-verified.
- What was not changed: gameplay, board/title screens, HUD logic, part-rig, other 6 weapon sprites.
- Open questions: remaining faint dark "wear" specks on vipera icon (reads as grunge — OK?);
  baked "ION LEZER / ZOMBI KRONIKA" decal text on w8_ion (reads as tech branding at icon size).
- Next recommended step: crawler rig decision or missions 4-5 maps; power-ups still untouched.

### 2026-07-13 — Prop fix L1/L2: half-vehicle (clipped lower body) + swap cheap van
- Goal: user reported L1 police car "only half visible" and L2 vehicle "cheap, half a car, wrong
  size, doesn't fit".
- Root cause: the silhouette confidence threshold (confLo = bgMax+18) was too high for vehicles
  with a DARK lower body → the wheels/lower doors (below threshold) were clipped → "half a car".
  (car/bus have brighter bottoms, so they stayed whole.)
- Fix (v49): vehicle-prop delta 18 → 7 (lower confLo) so the dark lower body is included = full
  vehicle. L2: swapped the murky van_wreck for the cleaner car_sedan_wreck (props/car.png). L1:
  police/car/bus regenerated with full silhouettes.
- Files: tools/prepare-map-layers.js (delta 7 for L1/L2 vehicle props; L2 van→sedan), js/sprites.js
  (L2 props van→car), sw.js (zk-v49, van→car precache), js/const.js (v49). Removed level_02/props/
  van.png.
- Verified (canvas export): L1 police = full car (lightbar + wheels) on the ground line; L2 = full
  sedan on the ground. node --check OK; 0 console errors.

### 2026-07-13 — Level 03 "car in the ground" fix: dark trench + redundant props removed
- Goal: after v47 the user said "still not good — cars in the ground". Diagnosed via canvas
  export (the screenshot tool times out on the animated canvas, so I exported a canvas region to
  PNG and inspected it). On Level 03 the painted far scene, cropped to the upper 64%, brought its
  baked-in dark alley floor down to the contact line → a dark "trench" band at GROUND_Y that the
  cropped car props' lower half sank into.
- Fix (v48): (1) far-scene crop 0.64 → 0.57 — only sky+walls+neon down to the wall-floor line,
  no baked floor → no dark trench; the wall base sits at GROUND_Y and the brightened wet asphalt
  is the clean play floor. (2) Removed Level 03 cropped props (car, fence) — the painted scene
  already has parked cars/dumpsters baked in; the dark-on-dark cropped props just sank. Stronger
  ground brightening.
- Files: tools/prepare-map-layers.js (doLevel03 crop + no props), js/sprites.js (loadMap(2)
  props:[]), sw.js (zk-v48, L3 precache trimmed), js/const.js (v48).
- Verified (canvas export): soldier stands cleanly on the wet asphalt, no trench, no sinking/
  floating props, rich alley backdrop. node --check OK; 0 console errors.
- Diagnosis for other maps: after the v47 ground fix, props/structures are GEOMETRICALLY on
  GROUND_Y (measured: each prop image's content reaches its bottom, drawn at GY+1). Any residual
  "float/sink" feel is contrast (dark prop vs dark ground/background), a polish item, not a
  geometry bug.

### 2026-07-13 — Prop-sinking fix: ground surface = GROUND_Y (all maps)
- Goal: user reported props (cars) "in the ground" and asked to check all maps.
- Root cause: the ground strip was drawn with its TOP edge at logical 224 (tileLayer bottomY=
  VIEW_H, height 46 → top 224), but props/structures/player stand on the GROUND_Y=234 contact
  line. So the visible floor surface sat 10px ABOVE the contact line → wide flat props (cars)
  looked embedded. Narrow player hid it, but it was systemic across all three maps.
- Fix (js/sprites.js): new drawGround() anchors the ground's TOP edge at GROUND_Y (natural
  height, extends to/below screen bottom, clipped). Wired into both the HD branch and the
  procedural branch → props/structures/player now stand on the visible ground surface.
- Tests run: node --check OK; 0 console errors; all three maps render; ground top now at buffer
  row 464 (GROUND_Y) instead of 429. Visual confirmation left to the user (screenshot tool times
  out on the animated canvas in this env).
- What was NOT changed: gameplay/GROUND_Y/collision/assets; only the ground draw position.
  BUILD v46→v47.

### 2026-07-13 — Level 03 TURBO: painted alley scene + brightness (alive, not dark)
- Goal: the first Level 03 looked cheap/dark/lifeless ("gagyi, homályos, pixeles, nagyon sötét,
  semmi élet"). Rebuild it with life and brightness.
- Root cause: dark cropped silhouette buildings + low-res dark far layer, and all neon/glow
  effects were rejected → no life.
- Fix: use the FULL painted alley scene (00_reference/full_original_map3.png — the clean
  painting, NOT the annotated concept board) as the rich, living far backdrop (neon BAR/LIQUOR,
  green toxic glow, warm streetlamp, wet reflections, distant city — all baked in), run through a
  new brighten() (gamma-lift + saturation), cropped to the upper 64% (walls/neon/distance, no
  baked floor). Plus a brightened wet-asphalt ground + 2 brightened props (car, fence). Dropped
  the dark bar_building/wall_a/door/dumpster crops and the low-res far_background.
- Files: tools/prepare-map-layers.js (brighten() + rewritten doLevel03()), js/sprites.js
  (loadMap(2, {struct:[], props:['car','fence']})), sw.js (zk-v46, precache trimmed to
  far/ground/car/fence), js/const.js (BUILD v46). Location binding (location 2 = mission 3)
  unchanged.
- Tests run: node --check all JS (OK). Real browser (level 3): avg on-screen brightness ~99–101
  (was ~76), 100% non-black; desktop 1280×720 VIEW_W 480, mobile 812×375 VIEW_W 584 sideGap 0,
  100% fill; 0 console errors. far.png visually verified: rich lit alley (neon/glow/steam/
  reflections).
- Note: full_original_map3 is the clean painted scene (legit environment art), distinct from the
  annotated concept_asset_board (still reference-only).
- What was NOT changed: gameplay/balance/other maps; Level 04 not started; nothing outside
  PROJECT_ROOT touched.

### 2026-07-13 — Level 03 "Zombie Alley" build (location 2 = mission 3 every day)
- Goal: build Level 03 only, same clean pipeline. No Level 04; no gameplay/system changes.
- Files: tools/prepare-map-layers.js (cropRect() fractional 2D crop + doLevel03() + CLI "3"),
  js/const.js (LOCATIONS[2].map=2 → Zombie Alley now HD; BUILD v45), js/sprites.js
  (loadMap(2, 'assets/maps/level_03/')), sw.js (zk-v45 + 7 precache). New runtime
  assets/maps/level_03/. Reports: _asset_audit_reports/level_03_map_audit_report.md +
  _rejected_assets/level_03/REJECTED_MANIFEST.md.
- Assets: KEEP far (ruined-city skyline) + ground (wet asphalt) opaque; silhouette-clean (2D crop
  from palette sheets) bar_building (BAR corner) + wall_a; props car + fence (chain-link) + door
  (green-glow). This pack is mostly palette sheets, so discrete elements isolated via cropRect.
  Rejected: 07_effects/* PNG fog/rain/neon/smoke overlays, 04_foreground/* + foreground strip
  (noisy), concept boards, source sheets, animated frames, spare prop sets; dumpster/barrel
  dropped (crops caught neighbours). No dark-bg removal, no tiled cutout strips, no PNG fog/rain.
- Tests run: node --check all JS (OK). Real browser (level 3 = location 2): HD alley renders;
  desktop 1280×720 VIEW_W 480 (94% non-black), mobile 812×375 VIEW_W 584 sideGap 0 (95%, ground
  85.9%); 7/7 assets HTTP 200; 0 console errors. Dynamic VIEW_W + location binding intact.
- What was NOT changed: gameplay/balance/other assets; Level 04 not started; nothing outside
  PROJECT_ROOT touched.
- Next: STOP — await approval before Level 04.

### 2026-07-13 — Location-based map binding: map = mission slot, not day (days have no name)
- Goal (owner decision): days are just numbers (DAY 1/2…), the NAMING belongs to the LOCATION.
  Bind the map to the in-day mission slot (1..5), same 5 locations every day (rising difficulty)
  → Quick Mart is Day 1 mission 2, reachable/testable immediately.
- Files: js/const.js (LOCATIONS[5] + locationFor/mapKeyFor/locationName; themeFor now returns the
  location's procedural THEMES fallback index, not the map key), js/sprites.js (drawBackground/
  drawForeground use MAPS[C.mapKeyFor(level)]), js/ui.js (board plaque shows "DAY N" with the name
  hidden; hotspots + briefing show the location name; briefing subtitle "DAY x · Mission m/5"),
  js/i18n.js (loc.0..4 EN+HU), js/const.js + sw.js (v44/zk-v44).
- Location→map: 1=Quarantine Street (HD level_01), 2=Quick Mart (HD level_02), 3=Zombie Alley,
  4=Fortified Checkpoint, 5=Infection Nest (3–5 procedural fallback until built).
- Tests run: node --check all JS (OK). Real browser: Day 1 mission 1→Quarantine (mapKey0),
  2→Quick Mart (mapKey1, renders, lit facade), 3→Zombie Alley (procedural); board "DAY 1" no
  name; hotspot labels = location names; briefing shows location title + "DAY 1 · Mission 1/5";
  0 console errors.
- What was NOT changed: gameplay/balance/assets; only theme/map selection + naming. Level 03
  not started. Nothing outside PROJECT_ROOT touched.

### 2026-07-13 — Day board fix: reflects progress + day navigation (Quick Mart reachable)
- Goal: the campaign board was hardcoded to Day 1 (renderBoard() set curDay=1; HUD showed "DAY 1")
  so it never advanced, progress wasn't reflected, and the new Quick Mart map (theme 1 = Day 2)
  couldn't be reached from the menu. User chose to keep the day-based board.
- Files: js/ui.js (board logic), css/style.css (nav arrows), js/const.js + sw.js (v43/zk-v43).
- What changed: renderBoard() now draws the VIEWED curDay (not fixed 1); refresh_stages() sets
  curDay=currentDay() on entry (real current day from save). Added prev/next day navigation
  (‹ › metal buttons flanking the DAY plaque) to browse any UNLOCKED day (1..currentDay), with
  disabled edge states. Hotspots map to that day's 5 missions (C.levelOf(curDay,slot)); states
  (done/current/locked/boss) come from real progress. Shared generic board artwork (no per-day
  image) — labels/states change per day.
- Tests run: node --check all JS (OK). Real browser (simulated unlocked=6): board opens on
  DAY 2 — ELHAGYOTT LABOR (level 6 current, 7–10 locked); ‹ → DAY 1 — QUARANTINE STREET (all
  done); launching Day 2 level 6 → theme 1 → Quick Mart renders (99% non-black, lit facade);
  0 console errors.
- Known (consequence of the day-based model, NOT fixed — that's the "option C" restructure):
  theme cycles per day (0,1,2,…) so a day's NAME may not match its rendered environment
  (Day 2 is named "Elhagyott Labor" but shows Quick Mart). Can be aligned on request.
- What was NOT changed: maps/assets/atmosphere/gameplay/weapons/shop/character/zombies; only the
  board UI. Nothing outside PROJECT_ROOT touched.
- Next: user verifies board + Quick Mart in normal play; optional day-name↔map alignment.

### 2026-07-13 — Level 02 "Quick Mart" build (theme 1), same clean pipeline
- Goal: implement Level 02 ONLY, using the verified Level 01 pipeline. No Level 03; no weapon/
  shop/character/zombie/HUD/gameplay changes.
- Files: tools/prepare-map-layers.js (added doLevel02() + emitOpaque() + CLI dispatch `2`;
  Level 01 path untouched), js/sprites.js (loadMaps → loadMap(1, 'assets/maps/level_02/')),
  sw.js (zk-v42 + 8 precache entries), js/const.js (BUILD v42). New runtime assets under
  assets/maps/level_02/. Reports: _asset_audit_reports/level_02_map_audit_report.md,
  _rejected_assets/level_02/REJECTED_MANIFEST.md.
- Assets: KEEP far (skyline) + ground (wet asphalt) opaque; silhouette-clean facade (Quick Mart
  storefront, hero) + power_pole + props van/gas_pump/dumpster/gas_sign. Rejected: 06_effects/*
  PNG fog/rain/effect overlays, 05_foreground/* noisy debris strips, concept boards, redundant
  facade parts/sheets, extra props (kept sparse). No dark-bg removal, no tiled cutout strips, no
  PNG fog/rain. Clean layer model + procedural atmosphere; v41 dynamic VIEW_W preserved.
- Integration: drawBackground/drawStructures/drawFog*/camera are generic per-theme — unchanged;
  Level 02 loads into theme 1 (campaign days 6–10).
- Tests run: node --check all JS (OK). Real browser level 6 (theme 1): HD Quick Mart scene renders
  (skyline + lit facade + ground + props; verified by deterministic frame render + pixel sampling
  since the screenshot tool times out on the animated canvas). Viewports: 1280×720 VIEW_W 480,
  1760×820 VIEW_W 580 (sideGap 0), 812×375 VIEW_W 584 (sideGap 0) — all 100% fill, ground 85.9%,
  dynamic VIEW_W active; 8/8 assets HTTP 200; 0 console errors.
- What was NOT changed: Level 01 assets/pipeline, atmosphere system, weapons/shop/character/
  zombies/HUD/gameplay; no rejected Level 01 asset reintroduced; nothing outside PROJECT_ROOT.
- Next: STOP — await approval before Level 03.

### 2026-07-09 — Gameplay fills the viewport: dynamic field-of-view width (no side bars)
- Goal: user reported gameplay was NOT fullscreen (black bars left/right) while the menu was.
  Root cause: menus (#screens) fill the full viewport, but gameplay (#cv/#hud/#controls) lived
  in the #stage FIXED 16:9 box → pillarbox on any viewport wider than 16:9.
- Fix (user picked "wider field of view"): js/main.js fit() now keeps logical HEIGHT fixed
  (VIEW_H=270) and derives logical WIDTH (C.VIEW_W) from the viewport aspect (clamped 1.6–2.6),
  updating the canvas buffer width (cv.width=VIEW_W*RS). Gameplay fills the viewport like the
  menu; a side-scroller shows MORE level width on wide screens — no crop, no distortion; HUD/
  controls sit at the screen edges. Vertical framing (GROUND_Y ~86%) and balance unchanged.
  All modules read C.VIEW_W at runtime (camera clamp, spawn, HUD centering, banners) so they
  auto-adjust. Extreme aspect (>2.6:1 or <1.6:1) keeps a minimal controlled letterbox so the
  in-canvas HUD never gets cropped.
- Files: js/main.js (fit dynamic VIEW_W), js/const.js (VIEW_W note + BUILD v41), sw.js (zk-v41).
- Tests run: node --check all JS (OK). Real browser Level 01 measured: 16:9 1280×720 → VIEW_W
  480 fills 100%; 1760×820 (2.15:1) → VIEW_W 580, sideGap 0, fills 100% (the reported case);
  mobile landscape 812×375 → VIEW_W 584, sideGap 0, fills 100% (was 73px bars/side); ultrawide
  2400×800 (3:1) → clamped 2.6, controlled 160px/side. Player on ground line, HUD/controls at
  edges, atmosphere OK; 0 console errors.
- What was NOT changed: map art / silhouette pipeline / atmosphere / assets / gameplay balance;
  no rejected asset reintroduced; nothing outside PROJECT_ROOT touched.
- Next: user confirms fullscreen gameplay on their device; then Level 02 only (per their gating).

### 2026-07-09 — Level 01 alignment verify + align-debug overlay (no offset bug found)
- Goal: user reported the stage/background "shifted again" before doing maps 02–05; fix Level
  01 alignment first.
- Investigation: fit()/stage-centering/camera transform are UNCHANGED since the map work.
  Measured every viewport — stage is pixel-perfect: desktop 1280×720 = 100% 16:9 at 0,0; mobile
  landscape 812×375 = 667×375 centered (73px pillarbox/side, unavoidable for 16:9 on 2.16:1);
  ultrawide 1600×600 = 1067×600 centered, 100% height. Ground baseline at 86% everywhere;
  canvas (objectFit:fill, inset:0) fills the stage exactly. No real offset bug: background,
  ground and player share one coordinate system; player feet sit on the ground baseline.
- Files: js/game.js (drawAlignDebug + dbg.align + debugToggleAlign, exported), js/main.js
  ('G' key toggle), js/const.js + sw.js (v40/zk-v40).
- New align-debug overlay (OFF by default; 'G' key or ZD.game.dbg.align=true): stage frame +
  center cross + magenta ground baseline + yellow player-feet marker + camera/render-buffer/
  stage/viewport sizes — so the user can verify on their own device where (if) it shifts.
- Likely user-side cause: stale cached old build, or the known preview screenshot capture
  artifact — not a layout bug. The cache bump (v40) + built-in SW auto-reload addresses it.
- Tests run: node --check all JS (OK). Real browser Level 01 with overlay: feet on ground line,
  structures on ground, HUD/controls screen-fixed (safe-area inset), horizontal-only parallax;
  0 console errors; atmosphere still works.
- What was NOT changed: map art, silhouette pipeline, atmosphere, assets; no rejected asset
  reintroduced; nothing outside PROJECT_ROOT touched.
- Next: user to confirm Level 01 is stable on their device (G-key overlay); then Level 02 only.

### 2026-07-09 — Atmosphere refine: procedural depth-banded fog + thin rain (no wash-out)
- Goal: The fog/rain overlay looked cheap — a full-screen filter that washed out the scene,
  lowered contrast and hurt readability of player/zombies/props/ground. Refine ONLY the
  atmosphere; keep the cleaned layer pipeline and composition; do not reintroduce rejected
  assets or add clutter.
- Files: js/sprites.js (drawFogBand + drawAtmoRain procedural; HD drawBackground + drawForeground
  rewired; stopped loading fog/rain PNGs), js/const.js (new C.atmosphere config + BUILD v39),
  sw.js (zk-v39, dropped fog/rain from precache), _rejected_assets/level_01/fx/ (fog/rain PNGs
  quarantined), _deleted_asset_logs/cleanup_log.md.
- What changed: replaced the additive full-width fog.png + rain.png overlays (and the 0.34
  horizon gradient) with a procedural system: fog is drawn as a few soft drifting puffs in 3
  DEPTH BANDS (far stronger → mid faint → foreground almost invisible), never full-screen;
  rain is thin, sparse, deterministic, moving short diagonal streaks (no cloud PNG). Streetlamp
  lightpool PNG kept (localized warm ground glow), lowered.
- Config + toggles (C.atmosphere): enabled (atmosphereEnabled) + intensity (atmosphereIntensity:
  'off' | 'subtle' | 'strong' | numeric multiplier) + per-depth fog alphas (0.10/0.05/0.02) +
  rain (alpha 0.12 / density 0.35 / speed 1.0) + lightPools. Default intensity = SUBTLE.
- Tests run: node --check all JS (OK). Real browser Level 01, all 3 modes: off = fully clean;
  subtle (default) = faint mood, artwork sharp/readable (soldier/tower/QUICK MART/ground crisp,
  no wash); strong = visible rain streaks + more horizon mist, still readable. 0 console errors.
  Viewport invariant intact (desktop 1280×720 = 100% 16:9).
- What was NOT changed: map composition / layer pipeline / cleaned assets / gameplay; no rejected
  asset reintroduced; nothing outside PROJECT_ROOT touched.
- Next: (optional) expose atmosphere toggle in Settings UI; extend to levels 02–05 when wired.

### 2026-07-09 — Map audit + repair: kill the collage/"swiss-cheese" background
- Goal: The Level 01 background looked fragmented, collage-like, patchy around props, with
  black-halo/dirty crop edges. Full audit, quarantine bad assets, rebuild a clean layered map.
- Files: tools/prepare-map-layers.js (rewritten), js/sprites.js (clean layer model +
  drawStructures), js/const.js + sw.js (v38/zk-v38 + precache list), .gitignore, plus
  _asset_audit_reports/{map_asset_audit_report.md,.json,final_map_repair_summary.md} and
  _deleted_asset_logs/cleanup_log.md. Assets: added bld_a/bld_b/watertower + re-masked
  bus/car/police under assets/maps/level_01/; moved mid/near/fg + noisy props to
  _rejected_assets/ (quarantine, gitignored).
- Root cause: (1) removeDarkBg() flood-fill on a hard near-black threshold flooded THROUGH
  hollow ruins / dark-on-dark vehicles → swiss-cheese holes, ragged fringe, wheel halos;
  (2) mid/near cutout strips were tiled full-width as parallax layers → repeating floating
  collage.
- Fix: new per-column SILHOUETTE fill (fill the vertical span between confident object
  pixels → solid, halo-free silhouette) + alpha feather + trim. Composition simplified to a
  few DISCRETE cleanly-masked midground structures (2 buildings + water tower, not tiled),
  ground kept, foreground debris strip removed, props cut 11→3. Middle hollow ruin excluded
  (sky shows through it).
- Tests run: node --check all JS (OK). Real browser (own dev server), Level 01: clean
  cohesive scene — discrete buildings + water tower over the far skyline, bus/car/police as
  clean silhouettes on the wet road, subtle rain/fog; 0 console errors. Viewport invariant
  intact (desktop 16:9 full, mobile landscape 812×375 → 667×375 16:9 full).
- What was NOT changed: gameplay/movement/shooting/zombies; far.png + ground.png + fx kept
  as-is; procedural fallback themes untouched; nothing outside PROJECT_ROOT touched (rejected
  assets moved to a project-local quarantine, none deleted).
- Next: extend the silhouette pipeline to levels 02–05 (currently source-only, gitignored).

### 2026-07-09 — Level 01 map build-out: HD props, effects, foreground (fuller scene)
- Goal: The Level 01 slice was too bare ("chunky", missing parts). Add HD street props,
  atmospheric effects and a foreground layer so the level reads as a full premium scene.
- Files: tools/prepare-map-layers.js (props + fx + foreground processing), assets/maps/level_01/
  {props/*, fx/*, fg.png}, js/sprites.js (prop placement + additive fx overlays + drawForeground),
  js/game.js (drawForeground call after entities), js/const.js + sw.js (v37/zk-v37 + precache).
- What changed:
  - Tool: generalized dark-flood-fill (all-edge for props; low threshold so dark-on-dark
    vehicles survive — NOT naive black cut, per README) + label crop for effect sheets +
    downscale. Produced runtime props (bus/car/suv/police/barrier/barrel/xbarricade/trash),
    fx (rain/fog/lightpool, labels cropped), and foreground debris (fg.png). ~1.9MB runtime.
  - Runtime: HD prop placement list (deterministic street dressing) drawn behind entities with
    soft shadows; additive overlays (streetlamp light pools on the ground, drifting fog);
    new drawForeground (drifting rain + foreground debris strip, drawn in front of entities in
    VIEW space). Procedural fallback preserved for non-HD themes.
- Tests run: node --check all JS (OK). Real-Chrome localhost level 1: HD buildings (QUICK MART)
  + wrecked car on the wet road + foreground debris + subtle rain, with HD zombies (spitter
  spitting) + firing soldier — a full, cinematic premium scene; 0 console errors.
- What was NOT changed: gameplay/movement/shooting/zombies. Source 97MB stays gitignored (local).
- Next: fine-tune prop density/placement + fire glow at rubble; then levels 02–05 (process +
  map campaign days → environments, Day 5 → infection nest arena).

### 2026-07-09 — Map asset audit + Level 01 HD parallax background (first vertical slice)
- Goal: Audit the newly added map materials and report what's needed for a full playable level;
  then (per user decisions) start the Level 01 "Quarantine Street" vertical slice — HD parallax
  background replacing the procedural one, using the existing movement/shooting/zombies.
- Analysis/organization: extracted+unified the 5 level asset packs into
  assets/references/maps/levels/ (233 files, ~97MB source; gitignored — LOCAL reference only,
  not deployed). Wrote docs/MAP_ASSETS_AUDIT.md (inventory, engine state, gap analysis, plan).
  Key finding: the engine ALREADY has a parallax system (tileLayer cam+parallax: far/mid/near/
  ground); only the layer source was procedural.
- Implementation (first slice): tools/prepare-map-layers.js (zero-dep) processes the HD source
  strips into small runtime layers (assets/maps/level_01/ far/mid/near/ground): far+ground
  opaque + downscaled; mid/near = top-edge DARK-flood-fill sky removal (keeps dark building
  detail — NOT naive black threshold, per the pack README). sprites.js: HD map loader (MAPS by
  theme) + drawBackground HD branch (uses the existing tileLayer for parallax) + drawBgOverlay
  refactor (scene grade shared). main.js loads maps at startup. HD applies to theme 0 (street =
  Day 1); procedural stays as fallback for other themes.
- Tests run: node --check all JS (OK). Real-Chrome localhost, forced level 1: HD ruined
  buildings (QUICK MART) + post-apoc road render in-game behind the HD zombies/soldier — a large
  visual upgrade over the procedural pixel bg; 0 console errors. Source 97MB → runtime ~1.2MB.
- What was NOT changed: gameplay/movement/shooting/zombies (reused as-is); themes 1–2 (lab/ruins)
  still procedural until levels 02–05 are processed. Props/effects/foreground not yet wired.
- Next: wire HD props (bus/cars/barriers) into decorFor with feet anchor+shadow; effect overlays
  (fog/fire/police-light/toxic/rain) from 07_effects; foreground (5th depth) layer; then process
  levels 02–05 and map campaign days → environments (Day 5 → infection nest arena).

### 2026-07-09 — Visual integration pass: HD player, shadows, grading, dark scene
- Goal: The new HD enemy sprites looked "pasted on" next to the pixel-art player / flat
  background, with debug rectangles showing. Make the in-game scene cohere as an HD painted
  2D shooter. (No menu work.)
- Files: js/enemy_sprites.js (soft radial shadows, scene color-grade, per-enemy size/brightness/
  anim variation, + HD PLAYER load & render), js/sprites.js (drawBackground cinematic dim/haze/
  ground-contact/vignette overlay; drawPlayer routes to HD soldier), js/game.js (per-enemy
  visual variation fields), tools/prepare-player-sprite.js (new projection slicer), assets/
  player/* (player_sheet.png + player_atlas.json), js/const.js + sw.js (v34/zk-v34 + precache).
  Source in assets/references/CHARACTER/.
- What changed:
  - HD PLAYER (Option B): sliced the provided soldier sheet (projection: rows→columns) →
    walk/run/shoot(+muzzle)/aim/hurt/death frames. New drawPlayer renders the HD soldier
    feet-anchored, state-switched (idle=aim, move=walk cycle, fire=shoot, death=lying), with
    shadow, grade and hit-flash. Existing player logic/hitbox/muzzle untouched; the game's
    muzzle flash still fires at the gun tip. Falls back to the procedural player if unloaded.
    (Tradeoff: the soldier's rifle is baked in, so per-weapon visuals are not shown — TODO.)
  - Debug hitboxes are OFF by default (dbg.hitbox=false; toggle with H). No rectangles in
    normal play (verified).
  - Enemy shadows: soft radial (dark-blue core → transparent), per-type sizes.
  - Scene integration: cinematic dim + atmospheric haze + ground-contact darkening + vignette
    drawn on the BACKGROUND (before entities) so HD characters pop and embed in the scene.
  - Enemy color grade: ctx.filter brightness/contrast/saturate per draw (subtle darken/
    desaturate so cutouts stop looking pasted). Per-enemy size ±7%, brightness ±, anim-rate ±
    so a row of the same type no longer looks like one frame copy-pasted.
  - Feet anchoring reaffirmed (enemy.x/y = ground contact); sizes calibrated for ZOOM=1.75.
- Tests run: node --check all JS (OK). Real-Chrome localhost free run: hasPlayer=true, enemy
  ready=true, hitbox default false; captured the HD soldier firing (muzzle flash) on a dark
  vignetted street with walker/brute/spitter grounded and no debug rectangles; 0 console errors.
- What was NOT changed: gameplay/balance/economy/save; menu/UI (parked). Per-weapon player
  visuals deferred (baked rifle for now). ctx.filter used for grading — watch mobile perf; can
  swap to overlay-tint if needed.
- Next: device play-test; optionally per-weapon overlay on the HD player, richer spitter/boss
  VFX from the extracted atlas frames, and an HD gameplay background.

### 2026-07-09 — Integrate new enemy sprite sheets into gameplay (7 types)
- Goal: Replace the procedurally-drawn in-game zombies with the new multi-pose sprite sheets,
  visible and playable, with per-type animation states, grounded feet, tuned hitboxes, and a
  debug spawn system. Priority pivot away from menu/UI polish.
- Files: tools/prepare-enemy-sprites.js (new slicer), assets/enemies/* (7 cleaned sheets +
  enemy_atlas.json), js/enemy_sprites.js (new image sprite layer), index.html (script),
  js/main.js (loader + debug keys 1-7/H), js/sprites.js (drawZombie routes to sprites,
  procedural fallback), js/game.js (anim state machine, bloater burst, debug spawn+hitbox
  overlay), js/const.js (bloater type + spawn table + hitbox sizes tuned to sprites), sw.js
  (precache + zk-v33). Sources kept in assets/references/zombies/.
- What changed:
  - Slicer (zero-dep): edge flood-fill LIGHT-bg removal (keeps dark silhouettes — NOT black
    threshold), half-res, explicit grid slice (3x2 / 2x3 / boss 3x3) + per-cell content trim →
    clean transparent sheets + atlas (frame rects + feet anchor). All 6/6 (boss 9/9) frames
    detected; verified via debug overlays.
  - Runtime enemy sprite layer: loads sheets+atlas; per-type config (target height, state→frame
    lists, frame timing, shadow); feet-anchored draw (bottom-center at GROUND_Y), facing flip,
    hit-flash tint, enrage tint, HP bar, elite ground ring, shadow. Falls back to procedural if
    assets fail (no crash).
  - Enemy roles mapped to sprites: walker=Basic Walker, runner=Runner, crawler=Crawler,
    spitter=Toxic Spitter, brute=Tank/Brute, boss=Infected Nest, + NEW bloater=Volatile Bloater
    (proximity warning → area burst; also bursts when shot; code-driven orange VFX + AoE).
  - Animation state machine in the enemy update: idle/move/attack/hit/warning/defeated + boss
    states (attack/summon/rage); flags set from gameplay (moving, attackingAnim, warnT,
    bossState) and stepped each frame.
  - Hitbox tuning: def.w/def.h resized to match the larger sprites (gameplay balance hp/dmg/
    speed UNCHANGED — only the collision box follows the art). Sizes calibrated for ZOOM=1.75.
  - Debug: keys 1-7 spawn walker/runner/tank/spitter/bloater/crawler/boss near the player; H
    toggles a hitbox overlay. ZD.game.debugSpawn/debugToggleHitbox exposed.
- Tests run: node --check all JS (OK). Real-Chrome on localhost, free run: enemy sheets load
  (ready=true, has() true for all 7); static + live renders confirmed walker/runner/spitter
  (spitting)/bloater/brute/boss render with the new art, feet grounded at the ground line,
  hitboxes aligned to bodies, spitter attack animation visible; 0 console errors.
- What was NOT changed: campaign/economy/save/weapon balance; the spit projectile still uses
  the existing procedural blob (the extracted 'projectile'/'eruption'/'icon' atlas frames are
  available for later use). Menu/UI parked as requested.
- Open questions: (1) exact per-type scale/hitbox fine-tuning is eyeball-calibrated — adjust
  after playing on device. (2) Use extracted spitter 'projectile' + boss 'attack_projectile'/
  'summon' VFX frames for richer effects? (3) crawler low-profile hitbox feel OK?
- Next: play-test on device via debug keys, fine-tune scale/hitbox/anim timing; optionally wire
  the extracted projectile/summon VFX frames.

### 2026-07-09 — Fix footer overlap + network-first SW (stop stale cache)
- Goal: Two real bugs confirmed via REAL Chrome on the live site: (1) the fixed footer
  "For personal use only. | build vXX" had a near-transparent gradient bg → it visually
  overlapped/blended into the last menu card (Lab). (2) The SW was cache-first for HTML/CSS/JS
  → new deploys got stuck (user kept seeing an old cached build → "nothing changed", "fullscreen
  broken again" — they were looking at pre-fullscreen cached code).
- Files changed: sw.js (network-first shell + zk-v31), css/style.css (solid footer bar + more
  bottom padding), js/const.js (v31), docs.
- What changed:
  - SW fetch: app-shell (navigation + .html/.css/.js/.webmanifest) is now NETWORK-FIRST
    (fetch → update cache → fall back to cache offline); images/other assets stay cache-first.
    This makes a fresh deploy load immediately and permanently fixes the stale-cache class of bug.
  - Footer: solid opaque bar (#06090d) + top hairline + shadow instead of a transparent
    gradient, so it reads as a real footer and never blends into a card. .title-inner
    padding-bottom 36→52px so the last card clears the footer when scrolled to the bottom.
- Tests run: node --check (OK). REAL Chrome on live site confirmed: board is fully fullscreen
  (edge-to-edge bg, left nav plaques with no halos, SHOP CTA, START RUN) and menu is fullscreen
  with premium cards — i.e. v30 already works live; the user's device is on stale cache (now
  addressed by network-first). Footer fix verified post-deploy.
- What was not changed: gameplay/economy/save/data; board/menu layout (already correct).
- Next recommended step: user hard-reloads once on the phone to pick up v31; from then on
  network-first keeps it current automatically.

### 2026-07-09 — Finalize UI per handoff pack (fixed footer, premium cards, clamp robustness)
- Goal: Finalize the Zombi Krónika UI against the owner-provided handoff pack
  (assets/references/zombi_kronika_ui_handoff_pack/): true fixed legal footer, bigger premium
  menu cards, unified components (pause/modal/armory/lab/briefing), and clamp()/safe-area
  robustness. Do NOT swap game data (weapons/upgrades) — keep existing gameplay working.
- Files changed: css/style.css, js/i18n.js (menu.note EN/HU), js/ui.js (footer HTML +
  separator), js/const.js (v30), sw.js (zk-v30), docs/STATUS.md, CHANGELOG_AI.md. Handoff pack
  added under assets/references/.
- What changed:
  - FOOTER BUG FIX (the pack's #1 required fix): "For personal use only. | build vXX" was
    position:absolute inside the scrollable .title-screen → it drifted on scroll. Now
    position:fixed; bottom:0; z-index:45 (viewport-relative since #screens is untransformed),
    plain-mono with a "|" separator. Verified: footer bottom == viewport bottom (390==390) and
    constant across scrollTop 0↔max (no drift). i18n menu.note → "For personal use only." /
    "Kizárólag magáncélra.".
  - Premium menu cards: .menu-btn min-height clamp(84px,12.5vh,116px) + clamp padding/icon/
    title/subtitle/arrow → ~106px tall cards (spec ≥100px).
  - Unified components + Pause: .screen.modal stronger dim/blur (blur 6px, rgba .8) + vertical
    center; modal CTA buttons min-height clamp(58px,9vh,66px) (excluding inline list buttons/
    arrows). Pause RESUME(gold)+QUIT(red) 58px centered; loadout START(gold) 55px + BACK(ghost).
  - Robustness: clamp()/min()/max() on footer, menu cards, board nav (clamp(96,11vw,122)),
    SHOP (clamp(42,7.5vh,54)), mission CTA (clamp(54,9vh,70)).
  - Left campaign nav (no circular halo), SHOP + FIGHT BOSS premium CTAs already done in v29.
- Tests run: node --check all changed JS (OK); browser DOM metrics @844×390: footer fixed at
  bottom + scroll-independent, menu card 106px, pause buttons 58px, board nav/shop/CTA sized;
  gameplay regression menu→scavenge→loadout(START 55px)→game running, fire reachable; armory
  8 weapon cards + 2 tabs + coin + back 48px, lab 7 upgrade cards — existing functionality
  intact. 0 console errors.
- Visual QA: preview screenshot tool still compresses output to a small region (known
  environmental issue) — verified via DOM metrics (authoritative); compressed shot still shows
  the 6 accent menu cards + faint "For personal use only. | build v30" footer.
- What was not changed: gameplay, economy, save, campaign logic, weapon/upgrade DATA (the
  pack's data JSONs were treated as reference only — game keeps const.js data). No sprites.
- Open questions: (1) Pack references portrait mockups; game is landscape-locked (rotate-note)
  — the menu adapts as a scrollable landscape card stack, acceptable? (2) Pack proposes a
  profile HUD (name/level/XP) + Events/Daily Reward dock — not added (would invent systems the
  game doesn't have); keep coin+gear HUD?
- Next recommended step: user confirms on the phone (build v30, fixed footer on scroll, big
  cards, pause). Optional later: profile HUD / bottom dock if those systems are added.

### 2026-07-09 — Finalize fullscreen UI and integrate generated button assets
- Goal: Lock down the UI surface — integrate the user's ChatGPT-generated PNG buttons 1:1
  (the PNG IS the button, no more CSS button styling), modern fullscreen mobile layout with
  safe-area/Dynamic Island support, left board nav to the screen edge + bigger, build label
  fixed at the bottom (not inside the scrolling menu).
- Files changed: tools/prepare-button-assets-v1.js (new), assets/ui/buttons/*.png (9 new),
  js/ui.js (BIMG helper + board nav/shop/back/close + mission CTA as image buttons + fixed
  footer), index.html (#screens moved out of #stage; footer note), css/style.css (fullscreen
  #screens, board-frame full-bleed 16:9, nav/shop/CTA/close/back image styles, .app-footer,
  --sat), js/const.js (v29), sw.js (zk-v29 + button precache), docs/STATUS.md, CHANGELOG_AI.md.
- What changed:
  - 9 generated button PNGs processed via a zero-dep tool (edge flood-fill bg removal +
    trim + aspect-preserving resize + safe padding → RGBA): btn_campaign_board / scavenge_board
    / settings_board (vertical nav cards), btn_shop_cta, btn_start_run, btn_replay,
    btn_fight_boss (red), btn_back, btn_close. 3D metal/texture/glow/label preserved 1:1.
  - Board left nav, SHOP, board-back, briefing-close and the mission CTA now render the
    generated PNG (object-fit: contain, transparent wrapper, no CSS frame/double-glow).
    Mission CTA by state: current/scavenge → START RUN, completed → REPLAY, boss → FIGHT BOSS.
  - Fullscreen: #screens moved OUT of the 16:9 #stage → menu/board/shop fill the whole
    viewport (position:fixed; pointer-events:none, .screen pointer-events:auto); gameplay
    (canvas+HUD+touch) stays in #stage at 16:9 (rendering invariant preserved). Board bg is a
    16:9 board-frame (full width, vertically margin:auto centered — not transform, since the
    .screen entrance animation would clobber it) → full-bleed on wider-than-16:9 phones, no
    side black bars, hotspot % still land on painted locations. Added --sat safe-area-top.
  - Left nav aligned to the screen edge (left: max(12px, safe-area-left)), bigger cards
    (desktop 118px wide → ~162px tall; mobile 60px). Build label + "personal use" moved to a
    fixed .app-footer (position:absolute; bottom:0; safe-area; pointer-events:none).
- Tests run: node --check all JS (OK); browser DOM metrics: board full 1280×720, mobile
  812×375 full-bleed (frame 812×457, 0 side bars), ultrawide 1600×600 full-bleed; nav x12/
  118×162, shop 110×50, back 46×46, CTA 175×66; all button assets load (0 broken images);
  CTA states start_run/replay/fight_boss correct; footer at bottom with "build v29"; gameplay
  regression: 16:9 stage preserved (667×375 @ 812), touch buttons reachable. 0 console errors.
- Visual QA: preview screenshot tool still compresses output into a small region this session
  (known environmental issue) — verified via DOM metrics + asset-file Read + object-fit
  guarantee (authoritative). The compressed shot still confirms the 3 vertical nav cards at the
  left edge, SHOP top-right, briefing with red CTA.
- What was not changed: gameplay, economy, save, campaign logic, weapon stats, map background
  content, sprites. No new sprites/characters. The assets/references/CHARACTER/ folder (user's
  character refs) left untouched/untracked.
- Open questions: (1) On very short landscape phones the lowest nav card (SETTINGS) tucks
  behind the bottom briefing sheet — acceptable? (SETTINGS also reachable via the top gear.)
- Next recommended step: user confirms on the actual phone (fullscreen, safe-area, buttons);
  then optional board/briefing element polish (DAY banner/plaque, danger meter, XP, supply crate).

### 2026-07-09 — Add main-menu build version badge
- Goal: Let the user confirm at a glance whether the fresh build actually loaded (cache issues).
- Files changed: js/const.js (ZD.BUILD), js/ui.js (badge element + text), css/style.css
  (.build-badge), sw.js (zk-v28), docs.
- What changed: `ZD.BUILD` constant shown in the main-menu bottom-right corner ("build v28").
  If the active SW cache version differs from the loaded build, the badge appends "· cache vXX"
  so a stale cache is visible. NOTE: bump ZD.BUILD together with sw.js VERSION on every release.
- Tests run: node --check (OK); DOM check (badge text "build v28", positioned corner); 0 console errors.
- What was not changed: gameplay/assets/save/UI composition.
- Next recommended step: user confirms the badge reads v28 on the phone (fresh version loaded).

### 2026-07-09 — Enlarge board nav buttons and make action buttons 3D-metallic
- Goal (zombie-code-implementer, focused CSS-only pass): make the board left nav buttons
  bigger/clearer/more premium, and make the mission action buttons match the premium 3D
  metallic icon language.
- Files changed: css/style.css, sw.js (zk-v27), docs/STATUS.md, CHANGELOG_AI.md.
- What changed:
  - Left nav cards: card 96→110px, icon 80→92px (desktop; mobile icon 44→50px). Label now
    on a dedicated metallic caption plate (gradient + bevel highlight + inner shadow + border),
    11px, centered/readable. Active = gold caption + subtle gold icon glow (no full fill).
  - Mission action buttons (.sp-start + n-boss/n-free, .btn.primary, .btn.danger): 3D metallic
    treatment — embossed top gloss (::before), 4-stop gradient, 3D bottom edge (0 6px 0),
    depth shadow + outer glow + inset top highlight + inner bottom shadow; press = translateY.
    Gold for normal actions (START/INDULÁS/REPLAY/START RUN), red for boss (FIGHT BOSS).
- Tests run: node --check all JS (OK); DOM metrics + computed styles: nav card 110×123/icon 92,
  caption metallic+bevel; START button 4+ layer 3D shadow + gradient + ::before; panel states
  current→START/boss→FIGHT BOSS(red)/scavenge→START RUN/completed→REPLAY; nav clears hotspots
  on desktop/mobile/ultrawide; 16:9 preserved; 0 console errors. Solved purely in CSS.
  NOTE: preview screenshot tool stuck this session (environmental) — CSS-only change verified
  via DOM computed-style + size metrics (authoritative for styling).
- What was not changed: gameplay, map, mission flow, assets, save, other UI.
- Next recommended step: fresh-session screenshot confirmation of the premium buttons; then
  the board/briefing elements polish pass (DAY banner/plaque, danger meter, XP, supply crate).

### 2026-07-09 — Make service worker updates reliable (fix stale icons)
- Goal: Fix "the game doesn't update even after 100 reloads" — the cache-first SW kept
  serving old assets despite version bumps.
- Files changed: sw.js (install cache:reload + per-asset tolerance, zk-v26), js/main.js
  (updateViaCache:none + auto-reload on SW takeover), docs/STATUS.md, CHANGELOG_AI.md.
- What changed:
  - sw.js install now fetches each precache asset with `cache: 'reload'` (bypasses the
    browser HTTP cache → genuinely fresh assets on version bump); one missing file no
    longer aborts the whole install.
  - main.js registers with `updateViaCache:'none'` + `reg.update()` and reloads once when
    a NEW SW takes control (guarded so no reload on first visit / no loop).
- Tests run: node --check all JS (OK); fresh registration creates zk-v26 with 40 entries,
  cached bytes match on-disk files (logo 447676, m-continue 77663), controller active,
  0 console errors.
- User action for the currently-stuck state: load the site, wait ~3s for the new SW to
  install+activate, then reload once. Updates auto-apply from then on.
- What was not changed: gameplay, assets, UI composition — only the SW/update mechanism.
- Next recommended step: user confirms icons now update live; then the board/briefing
  elements polish pass.

### 2026-07-09 — Polish board nav cards and shop CTA composition
- Goal: Recompose the board left nav (Campaign/Scavenge/Settings) and top-right SHOP so
  the 3D UI-kit assets are the visual (big icon + dark label plaque / horizontal CTA),
  not a small icon in an old yellow-fill button.
- Files changed: css/style.css, js/ui.js (1 line: shop icon class), sw.js (zk-v25),
  docs/STATUS.md, CHANGELOG_AI.md.
- What changed:
  - Left nav → vertical premium 3D cards: 80px asset icon (44px mobile), separate
    dark-metal label plaque, active = gold label + subtle gold icon glow (removed the
    full gold-fill "paca"); no double frame/glow, no clip.
  - SHOP → horizontal CTA: dark metal + gold border, 46px 3D cart asset + gold "SHOP"
    label (was a tiny icon in a gold-fill button).
- Tests run: node --check all JS (OK); desktop board screenshot (premium cards + shop CTA);
  DOM metrics (nav 96px/icon 80px, shop icon 46px, nav clears hotspots); mobile 812×375
  (44px icons, clears hotspots) and ultrawide 16:9; regression: menu icons + armory back
  (64×48) OK; 0 console errors.
- Visual QA: PASS (desktop screenshot + DOM). Note: preview stage-size flaky between
  captures (tooling); DOM is authoritative.
- What was not changed: gameplay, map background, hotspot positions, mission/campaign
  logic, economy, save, in-game HUD/controls, menu/marker assets.
- Open questions: on 375px mobile the briefing bottom-sheet can overlap the lowest nav
  card (SETTINGS) — inherent space constraint; SETTINGS is also in the topbar gear.
- Next recommended step: fresh-session full screenshot QA, then the board/briefing
  `elements/` polish pass (DAY banner/plaque, danger meter, XP, supply crate).

### 2026-07-09 — Integrate premium UI kit icons and logo
- Goal: Integrate the owner-provided premium UI kit (ui_kit_v1) 1:1 — menu icons,
  board markers, coin and logo — preserving the 3D metal/glow look, no CSS redraw.
- Files changed: tools/prepare-ui-kit-v1.js (new), css/style.css, sw.js (zk-v24),
  assets/ui/m-*.png (8), assets/ui/s-*.png (6), assets/ui/ic-coin.png,
  assets/ui/logo.png, docs/STATUS.md, CHANGELOG_AI.md, ui_kit_v1/README.md.
- What changed:
  - New deterministic prep tool: edge flood-fill removes the flat light background
    (keeps inner highlights/text/glow, no white halo), trims, pads to 256×256 at ~70%
    (logo kept aspect, transparent, 760×387). 3D look preserved 1:1 — no slicing, no redraw.
  - Replaced menu (m-*), marker (s-*), coin (ic-coin) and logo assets with the processed
    ui_kit sources. m-shop now a real cart; s-locked is an octagon (owner asset).
  - CSS: removed the doubled accent glow on menu/marker icons (asset carries its own glow,
    CSS only adds a subtle depth shadow); removed `mix-blend-mode: lighten` on the logo
    (now a transparent horizontal lockup) and resized it; kept `.aic` max caps + 26px back icon.
- Tests run: node --check all JS (OK); direct asset-file verification (logo, m-continue,
  s-boss, ic-coin = perfect 1:1 transparent, centered, no halo/clip); DOM metrics (all 15
  icons 256×256 loaded, correct render sizes, no blowup, back 64×48); 0 console errors.
  NOTE: the preview screenshot tool was stuck this session (environmental, not code) —
  verification relied on asset-file Read + DOM metrics + the object-fit:contain guarantee.
- Visual QA: PASS (asset-file + DOM level). In-context screenshots deferred to next session
  if a fresh preview cooperates.
- What was not changed: gameplay, stats, economy, save, HUD layout, board background,
  in-game control icons (ic-fire/ammo/swap/grenade/pause); the ui_kit `elements/`
  (banners/plaques/meter/crate) were left for a later board/briefing polish pass.
- Open questions: s-locked is octagon-shaped among hexagon markers — keep or request a
  hexagon locked variant?
- Next recommended step: fresh-session screenshot QA of the integrated icons, then the
  board/briefing `elements/` polish pass (DAY banner/plaque, danger meter, XP, supply crate).

### 2026-07-08 — Fix rendered icon clipping and back button sizing
- Goal: Make icons fully visible in the ACTUAL rendered UI (not just the source PNG),
  and fix the oversized Armory/Lab/Settings back button.
- Files changed: css/style.css, tools/crop.js, assets/ui/m-*.png + s-*.png (regenerated),
  sw.js (cache zk-v23), docs/qa/VISUAL_QA_CHECKLIST.md, docs/STATUS.md, CHANGELOG_AI.md.
- What changed:
  - Back button: added `.btn .aic-btn, .backbtn .aic-btn { width:26px; height:26px }` and
    `.aic { max-width:100%; max-height:100% }` — no more 256px natural-size blowup
    (button was 294×278, now 64×48 with a 26px icon).
  - Icon inner scale: crop.js TARGET 238→200 so each padded icon fills ~70% of the 256
    canvas → clear margin, never touches the badge/hexagon/octagon edge in the rendered UI.
    Menu octagons + board state hexagons regenerated.
  - QA checklist: added the rule that icon PASS requires full visibility in the rendered
    UI container, and to prefer a smaller inner scale over edge-touching icons.
- Tests run: node --check all JS (OK); screenshots of main menu, board, armory, settings,
  in-game HUD, mobile board; DOM metrics for back-button and viewport; 0 console errors.
- Visual QA: PASS — icons fully visible with clear margin; back button fixed; no regression.
- What was not changed: gameplay, weapon/enemy stats, economy, save, campaign progress,
  board background, sprites, in-game control icons (ic-*).
- Open questions: minor green remnants (weapon stat bars, "STAGE 1" banner, lang toggle)
  left for an optional polish round.
- Next recommended step: optional green-remnant polish, or proceed to M2 (day board system).

### 2026-07-08 — Project memory and agent system setup
- Goal: Create persistent project memory, agent definitions, asset pipeline documentation and visual QA rules.
- Files changed: CLAUDE.md (extended), AGENTS.md, TASKS.md, CHANGELOG_AI.md,
  docs/vision/* (8 files), docs/asset_pipeline/* (2), docs/prompts/* (1),
  docs/qa/* (1), docs/references/README.md, .claude/agents/* (5).
- What changed: Documentation, agent role cards and workflow only.
- Tests run: none needed (no JS changed).
- Visual QA: n/a (no visual change).
- Gameplay changes: none.
- Asset implementation changes: none.
- What was not changed: game logic, UI/CSS, sprites, assets, save system, sw.js.
- Open questions: none.
- Next recommended step: Day 1 campaign board and icon crop visual audit.
