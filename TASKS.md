# ZombieGame / Zombi Krónika — Tasks

## Current Priority
**M0 — Project memory and agent system setup.**

## Next Suggested Task
**Integrate the owner-provided premium menu icons** in
`assets/references/menu_icons_v1/` (see its `README.md`). 7 ready-made, individually
composed icons (continue/campaign/scavenge/armory/lab/settings/back) — NO sheet
slicing needed. They are 1254×1254 RGB with a flat light (~244–254) background:
make the background transparent (edge flood-fill, preserve inner metallic
highlights), pad onto a 256×256 canvas at ~70%, and output over
`assets/ui/m-continue.png … m-back.png`. Then screenshot-verify main menu + board
nav + armory/lab/settings back, bump sw.js cache, update STATUS + CHANGELOG.
(Shop icon not provided yet — keep existing `m-shop.png`.)

_Done previously: memory/agent system (M0), visual QA audit, and the rendered
icon-clipping + back-button-sizing fix._

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
