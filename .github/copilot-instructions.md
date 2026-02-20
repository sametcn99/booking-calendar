# Project Guidelines

## Code Style

- Use TypeScript with strict typing and avoid `any` unless there is a clear boundary (for example, external payload parsing).
- Follow Biome formatting and linting conventions from `biome.json`: tabs for indentation and double quotes in JavaScript/TypeScript.
- Keep imports organized (Biome organize imports is enabled) and prefer small, focused functions.
- Keep server-side i18n messages in translation files and use `t("...")` keys instead of hardcoded user-facing strings.

## Architecture

- This is a Bun-first monorepo-style setup with two package roots: workspace root (server) and `src/client` (frontend).
- Backend uses layered OOP boundaries:
  - Controllers in `src/server/controllers`: HTTP request/response handling.
  - Services in `src/server/services`: business logic and orchestration.
  - Repositories in `src/server/repositories`: TypeORM data access.
  - Entities in `src/server/entities`: schema definitions.
- API server is implemented with `Bun.serve()` and manual route matching in `src/server/index.ts` (no Express/Fastify).
- Frontend is React + Vite in `src/client`, with shared app state through contexts in `src/client/src/context`.

## Build And Validate

- Install dependencies in both package roots:
  - `bun install`
  - `cd src/client && bun install`
- Development:
  - `bun run dev:server`
  - `bun run dev:client`
  - `bun run dev`
- Build:
  - `bun run build` (builds client via `build:client`)
- Validation:
  - `bun run check` (Biome + `tsc --noEmit` + i18n checks)
  - `bun run check:i18n` (translation consistency)
- Production run:
  - `bun run start`

## Conventions

- Keep API responses consistent with existing shape: `success`, optional `data`, optional `error`.
- Preserve controller -> service -> repository flow; avoid pushing business logic into controllers.
- For write paths with race/overlap risk, use transactions (`AppDataSource.transaction`) as existing appointment logic does.
- Keep email and push notifications asynchronous so API responses are not blocked by delivery failures.
- Respect route declaration order in `src/server/index.ts`; generic dynamic routes can shadow specific routes.
- Read environment values through `src/server/config.ts` conventions. Do not assume `dotenv`; this project uses a custom `.env` loader.
- Treat `VITE_*` variables as build-time client variables. Rebuild frontend when they change.
- No dedicated automated test suite is configured yet. Always run `bun run check` before finishing substantial code changes.

## Key References

- `README.md` for deployment, env, and operational guidance.
- `src/server/index.ts` for routing and middleware flow.
- `src/server/services/AppointmentService.ts` for service orchestration patterns.
- `src/server/repositories/AppointmentRepository.ts` for repository query patterns.
