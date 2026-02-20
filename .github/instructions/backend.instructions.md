---
description: "Use when editing Bun API backend files, controllers, services, repositories, entities, or config in src/server. Enforces layered architecture, response shape, i18n keys, and transactional safety."
applyTo: "src/server/**/*.ts, scripts/**/*.ts"
---

# Backend Guidelines

- Keep request parsing and HTTP response mapping in controllers.
- Keep business rules in services.
- Keep persistence and SQL concerns in repositories.
- Preserve `controller -> service -> repository` flow.
- Keep API responses in `{ success, data?, error? }` shape.
- Use `t("...")` keys for user-facing messages, do not hardcode strings.
- For create/update flows with overlap or race risks, use `AppDataSource.transaction`.
- Keep mail and push notifications asynchronous; do not block the API response.
- Add new environment reads through `src/server/config.ts`; do not introduce `dotenv`.
- In `src/server/index.ts`, place specific routes before generic dynamic routes.

## Validation Checklist

- Run `bun run check` after substantial backend changes.
- If you touched i18n keys, also run `bun run check:i18n`.
