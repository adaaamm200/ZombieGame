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
