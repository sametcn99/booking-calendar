# Endpoint Checklist

Use this checklist when adding or modifying backend endpoints.

- Route added in `src/server/index.ts` with safe declaration order.
- Controller method parses request and maps HTTP response only.
- Service contains business logic and orchestration.
- Repository handles DB access and query details.
- Response shape is `{ success, data?, error? }`.
- User-facing messages use `t("...")` keys.
- Transaction added for race-sensitive write paths.
- Follow-up frontend/API wiring updated if needed.
- Run `bun run check`.
