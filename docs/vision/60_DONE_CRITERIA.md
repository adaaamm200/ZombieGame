# Done Criteria

## Visual done
- Fills the 16:9 stage; no tiny centered box; no big black frame.
- Matches the reference mood and the [`30_STYLE_GUIDE.md`](30_STYLE_GUIDE.md).
- No old green UI remnants (green only for ready/success/health).
- Icons centered, padded, uniform, not cut, not misaligned.
- Campaign board is illustrated/premium, not a generic roadmap.
- Verified on desktop 16:9, ultrawide and mobile landscape.

## Asset done
- Separate file, correct target folder, agreed naming (no accents/spaces).
- Correct format and canvas; centered content with safe padding.
- Backgrounds: 16:9, no UI, no text, clear play lane.
- Characters/zombies: transparent background, consistent baseline.
- Comes with filename-without-extension + usage + implementation + QA notes.

## Code done
- Small, focused, reviewable change; no unrelated rewrites.
- `node --check` passes on all changed JS.
- 0 console errors; save export/import intact.
- `sw.js` cache bumped if any client-side asset/file changed.
- Existing behavior preserved unless the task required a change.

## QA & handoff
- Visual QA performed (screenshots / DOM checks where relevant).
- `docs/STATUS.md` updated; `CHANGELOG_AI.md` entry appended.
- Handoff: summary, files changed, tests, what was not changed, open questions,
  next step.
