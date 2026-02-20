---
description: "Use when changing route declarations, path patterns, request matching, database schema, entities, or repositories."
---

# Database And Routing Guardrails

- Route matching is manual in `src/server/index.ts`; declaration order can change behavior.
- Register narrow/static paths before dynamic `:param` routes.
- Keep entity and repository changes synchronized and type-safe.
- Prefer additive schema changes compatible with existing runtime data.
- Use repository methods from services instead of querying DataSource directly in controllers.
- Keep slug and token behavior stable for public links and cancellation flows.
