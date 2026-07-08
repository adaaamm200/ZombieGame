# Image Asset Prompt Template

Use this template for every generated image asset. Fill every field.

```
Asset goal:
Game context:
Style:
Asset type:
Must include:
Must avoid:
Technical requirements:

Filename without extension:
Target folder:
Recommended format:
Asset type:
Usage:
Implementation notes:
QA notes:
```

## Field notes
- **Style:** pull from [`../vision/30_STYLE_GUIDE.md`](../vision/30_STYLE_GUIDE.md)
  (dark, gritty, premium, military/survivor; correct color roles).
- **Must avoid:** copyrighted assets, baked-in UI/text (for backgrounds), wrong aspect,
  cut/off-center content (for icons), inconsistent baseline (for characters).
- **Technical requirements:** aspect (16:9 for backgrounds), transparent background
  (characters/zombies), safe padded canvas (icons), fixed frame size (sprite sheets).
- **Filename without extension:** follow
  [`../asset_pipeline/ASSET_NAMING.md`](../asset_pipeline/ASSET_NAMING.md).
- **Recommended format:** usually `png` (transparent) or `png`/`webp` for backgrounds.
- **Implementation notes:** where/how it plugs into the code (element, container, CSS).
- **QA notes:** what the visual-QA agent should verify
  ([`../qa/VISUAL_QA_CHECKLIST.md`](../qa/VISUAL_QA_CHECKLIST.md)).

## Example (icon)
```
Asset goal: Premium campaign board boss marker.
Game context: Day 1 campaign board hotspot, over a dark city artwork.
Style: dark metal hexagon, red danger accent, threatening horned skull, subtle glow.
Asset type: UI marker icon (hexagon).
Must include: full hexagon frame, centered skull, red glow.
Must avoid: baked text, off-center glyph, cut horns, dark square halo.
Technical requirements: 256x256 canvas, transparent padding, ~24px safe padding, centered.

Filename without extension: marker_boss_v1
Target folder: assets/ui/
Recommended format: png
Asset type: ui-marker-icon
Usage: board hotspot boss emblem (object-fit: contain in the hexagon emblem)
Implementation notes: swap into the boss hotspot emblem; keep object-fit: contain.
QA notes: centered, nothing cut, uniform size vs other markers, no dark square on city bg.
```
