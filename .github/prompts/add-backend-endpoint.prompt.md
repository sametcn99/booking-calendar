---
description: "Add a new backend API endpoint in booking-calendar with controller/service/repository layering and consistent response shape."
argument-hint: "method path auth-required(y/n) brief-behavior"
agent: "agent"
---

Implement a new backend endpoint for this repository using the provided arguments.

Requirements:

- Follow `controller -> service -> repository` boundaries.
- Keep API response shape `{ success, data?, error? }`.
- Use i18n keys (`t(\"...\")`) for user-facing errors/messages.
- If the write path can race or overlap, use `AppDataSource.transaction`.
- Place route declarations in `src/server/index.ts` in safe order (specific before generic).

Expected output:

1. Edited files list
2. Why each file changed
3. Any new i18n keys added
4. Validation commands to run (`bun run check`)
