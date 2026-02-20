# Validation Checklist

- Install deps in both roots when needed:
  - `bun install`
  - `cd src/client && bun install`
- Run project validation:
  - `bun run check`
- Frontend-focused validation:
  - `cd src/client && bun run build`
- i18n consistency after key changes:
  - `bun run check:i18n`
- Confirm route order safety in `src/server/index.ts` when adding dynamic paths.
- Confirm user-facing messages are i18n-key based.
