---
description: "Review booking-calendar code changes and report findings by severity with file/line references."
argument-hint: "scope (files/commit/pr) and optional focus areas"
agent: "agent"
---

Review the requested code changes with a bug-risk mindset.

Requirements:

- Findings first, ordered by severity.
- Include concrete file references and impacted behavior.
- Highlight missing tests or validation gaps.
- Keep project-specific checks in mind (layer boundaries, response shape, i18n keys, route order, transaction safety).
- Add a brief summary only after findings.

Output format:

1. Findings
2. Open questions or assumptions
3. Brief summary
