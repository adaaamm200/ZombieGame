# Visual QA Checklist

Use for every visual/UI/asset change. Verdict per section: PASS / FAIL / NEEDS FIX.

## 1. Viewport / canvas
- [ ] Stage fills the 16:9 area; not a tiny centered box.
- [ ] No oversized black frame; no broken scaling (canvas vs HUD vs touch aligned).
- [ ] Verified: desktop 16:9, ultrawide, mobile landscape.
- [ ] Camera zoom is not used to "fix" a small canvas.

## 2. Campaign board
- [ ] Not a generic roadmap / node chain.
- [ ] Illustrated / premium board with hotspot overlay.
- [ ] Day banner centered and premium; HUD readable.
- [ ] Mission markers readable; boss threatening; scavenge clear; locked readable.

## 3. Icon crop / centering
- [ ] Every icon fully visible (nothing cut).
- [ ] Centered with uniform padding; consistent optical size.
- [ ] No sheet-crop / background-position artifacts.
- [ ] Separate padded PNG per icon; object-fit: contain.

> **Icon crop PASS only counts if the icon is fully visible in the ACTUAL RENDERED
> UI container, not only in the source PNG.** Check for clipping caused by
> `clip-path`, `mask`, `overflow: hidden`, `object-fit`, container size and inner
> image scale. Verify on a screenshot of the real screen, not just the asset file.
>
> **Prefer a smaller inner icon scale with full visibility over large icons that touch
> or exceed the badge boundary.** Rough targets: the inner icon should be ~68–75% of
> its container so it never touches the badge/hexagon/octagon edge. Never let an `.aic`
> image render at its natural (e.g. 256px) size uncontrolled.

## 4. UI quality
- [ ] No old green UI dominance (green only ready/success/health).
- [ ] Correct color roles (gold action, red danger, purple loot, blue utility).
- [ ] Buttons premium, high-contrast, readable; consistent across screens.

## 5. Assets
- [ ] Background: 16:9, no UI/text, clear play lane.
- [ ] Character/zombie: transparent bg, consistent baseline.
- [ ] Correct target folder + naming; filename-without-extension provided.

## 6. Gameplay visual
- [ ] Player and enemies clearly visible.
- [ ] Touch controls do not overlap the character / key play area.
- [ ] HUD readable; feedback (ammo/reload/hit) visible.

## Fail conditions (any one = FAIL)
- Tiny centered canvas / shrunk viewport.
- Roadmap-feel campaign board.
- Cut / misaligned / inconsistent icons.
- Old green prototype UI dominance.
- Premium artwork replaced by cheap CSS.
- Touch controls covering the character / important gameplay.
