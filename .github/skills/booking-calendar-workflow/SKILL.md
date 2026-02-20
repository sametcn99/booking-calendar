---
name: booking-calendar-workflow
description: "End-to-end implementation workflow for booking-calendar. Use for backend/frontend feature delivery, safe refactors, route updates, and validation with project conventions."
argument-hint: "Describe feature or refactor target"
user-invocable: true
---

# Booking Calendar Workflow

## When To Use

- Implementing a new API endpoint and its client integration.
- Updating appointment, booking-link, slot, planner, or community-event flows.
- Performing safe refactors with architectural guardrails.
- Applying project conventions quickly before code changes.

## Procedure

1. Identify area and boundaries.

- Backend: `controller -> service -> repository`.
- Frontend: pages/components/context/i18n patterns.

2. Plan minimal file changes.

- Prefer focused edits and keep public contracts stable unless requested.

3. Implement with guardrails.

- Backend rules: [backend instruction](../../instructions/backend.instructions.md)
- Frontend rules: [frontend instruction](../../instructions/frontend.instructions.md)
- Routing and data safety: [routing-db instruction](../../instructions/database-and-routing.instructions.md)

4. Use templates/checklists.

- Endpoint checklist: [asset](./assets/endpoint-checklist.md)
- Validation checklist: [reference](./references/validation-checklist.md)

5. Validate and report.

- Run `bun run check` for substantial changes.
- Report edited files, risk notes, and any missing tests.

## Output Expectations

- Clear list of changed files.
- Behavior impact summary.
- Validation status and residual risk.
