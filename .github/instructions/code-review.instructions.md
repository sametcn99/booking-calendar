---
description: "Use when reviewing pull requests, diffs, refactors, or bug-fix patches in booking-calendar. Focus on defects, regressions, risks, and missing tests first."
---

# Code Review Guidelines

## Primary Focus

- Prioritize correctness, security, data integrity, behavior regressions, and missing tests.
- Prefer high-signal findings over style-only commentary.
- Keep architecture boundaries intact: `controller -> service -> repository`.

## Findings Format

- List findings ordered by severity.
- Include file path and line references for each finding.
- Explain user impact and suggest a concrete fix.
- If no findings, state that explicitly and mention residual risks.

## Project-Specific Checks

- API response shape remains `{ success, data?, error? }`.
- User-facing backend messages use i18n keys via `t("...")`.
- Route order in `src/server/index.ts` does not cause dynamic-route shadowing.
- Write paths with overlap/race risk use `AppDataSource.transaction`.
- New `VITE_*` behavior changes include rebuild awareness.
