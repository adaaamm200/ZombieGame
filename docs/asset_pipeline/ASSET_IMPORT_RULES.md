# Asset Import Rules

## Concept vs production
- **Concept / reference asset**: a style/mood sheet or mockup. Used as a guide.
  Lives in `assets/references/`. Not shipped directly as gameplay art.
- **Production asset**: a clean, final, correctly-formatted file used in-game.

## Production background
- **16:9** aspect ratio.
- **No UI**, **no text** baked in.
- **Clear play lane** (the horizontal band where the player and enemies move).

## Character / zombie
- **Transparent background** (RGBA).
- **Consistent baseline** (feet on a common ground line across frames).
- Consistent scale across a set.

## Icon
- **Centered**, **padded**, **safe box** (uniform canvas, e.g. 256×256).
- **No bad crop** — full icon visible, nothing cut, consistent optical size.
- Display with `object-fit: contain` in a fixed container; no sheet
  `background-position` hacks.

## Sprite sheet
- **Fixed frame size**; consistent rows/columns.
- **No labels baked into the sprite** (labels only on the reference/overview sheet).
- Document frame count, frame size and row meaning in the implementation brief.

## Slicing from a reference sheet
- If an icon/marker comes from a big sheet, slice it into a **separate PNG** with a
  safe padded box; do not render it live from the sheet with an offset.
- Keep the whole framed icon if the frame + glow define the style.
