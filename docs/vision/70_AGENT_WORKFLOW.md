# Agent Workflow

Standard flow for every task (whether run directly or via an agent role):

1. **Read `CLAUDE.md`** (project rules).
2. **Read the relevant docs** for the task:
   - `docs/vision/10_PRODUCT_VISION.md`, `20_NON_NEGOTIABLE_RULES.md`,
     `30_STYLE_GUIDE.md`, `40_DECISIONS.md` (direction),
   - `docs/asset_pipeline/*` (assets), `docs/qa/VISUAL_QA_CHECKLIST.md` (QA),
   - `docs/STATUS.md` (current state).
3. **Define scope** — write down exactly what will change and what will not.
4. **Do only the scoped task** — small, reviewable steps; no unrelated rewrites.
5. **Run checks** — `node --check` on changed JS, visual QA, 0 console errors,
   viewport-gate, save integrity.
6. **Write handoff** — summary, files changed, tests, what was not changed,
   open questions, next step.
7. **Update changelog** — append to `CHANGELOG_AI.md`; update `docs/STATUS.md`.
8. **Suggest next step**.

## Agent hand-offs
- `zombie-vision-keeper` gates direction before and after.
- `zombie-asset-prompt-agent` produces prompts + asset metadata.
- `zombie-code-implementer` implements in small steps.
- `zombie-visual-qa-agent` audits the visual result.
- `zombie-gameplay-designer` proposes MVP-compatible gameplay.

## Guardrails
- If a task contradicts the vision or non-negotiable rules, **stop and report**.
- No dependency install, no force push, no full rewrite without approval.
