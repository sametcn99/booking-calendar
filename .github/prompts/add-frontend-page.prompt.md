---
description: "Create or update a frontend page in booking-calendar with existing context, i18n, and API usage conventions."
argument-hint: "route/page-name short-feature-description"
agent: "agent"
---

Implement the requested frontend page or page update.

Requirements:

- Reuse existing component/context patterns.
- Keep user-facing copy in client i18n JSON files.
- Use centralized API helpers in `src/client/src/api.ts` where possible.
- Keep desktop and mobile usability in mind.
- Preserve existing visual language and avoid unrelated design-system drift.
- For admin list pages, align header/action layout with existing `Appointments`, `Links`, and `Events` pages.
- Prefer modal-based create/edit forms on admin pages unless an inline form is explicitly requested.

Expected output:

1. Edited files list
2. Added/updated translation keys
3. Notes on route wiring if applicable
4. Validation commands to run (`bun run check` or `cd src/client && bun run build`)
