---
description: "Refactor booking-calendar code safely while preserving behavior and layer boundaries."
argument-hint: "target-file-or-feature and refactor goal"
agent: "agent"
---

Refactor the requested target with behavior preservation as the top priority.

Checklist:

- Keep architecture boundaries intact.
- Do not change external API contract unless explicitly requested.
- Keep i18n keys stable unless migration is included.
- Minimize file churn.
- Run or suggest appropriate validation commands.

Return:

1. Risk summary
2. Concrete edits made
3. Behavior parity notes
4. Validation status
