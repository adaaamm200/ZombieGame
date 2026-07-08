# Non-Negotiable Rules

These rules override convenience. If a task conflicts with them, **stop and flag it**.

## Rendering / viewport
1. The canvas / viewport must **never** shrink into a tiny, centered box.
2. Stage / map / campaign screens must **fill the available area** (16:9 stage;
   see [`../RENDERING_RULES.md`](../RENDERING_RULES.md)). Re-check after every
   gameplay/UI/map/ammo/boss/shop/graphics change.

## Campaign board
3. The Day 1 map / campaign board must **not** be a generic roadmap or 1–40 node chain.
4. It should read as an **illustrated / pseudo-isometric / premium mobile game board**
   with a hotspot overlay.

## Reference images
5. Reference images **take priority** over improvised cheap UI.
6. If a reference is a concrete board/background asset, **use it as an actual asset**,
   not just as inspiration.
7. Do not replace premium artwork with cheap CSS approximations.

## Assets
8. Every generated asset **must** have a **filename without extension**.
9. Every asset must have a **target folder** and an implementation home.
10. Icons must be **centered, padded, consistent, production-ready** — safe padded
    icon box, not a fragile sheet crop. If auto-crop is unreliable, use a bigger
    safe padded box; do not over-engineer a centroid explanation.

## Process
11. No full source rewrite without explicit approval.
12. Work in small, reviewable, safe steps.
13. Check `git status` before work; summarize changed files after.
14. Zero-dependency; no bundler / framework / package manager.
15. If anything contradicts the vision, **stop and report** instead of guessing.
