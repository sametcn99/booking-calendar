---
description: "Use when editing React frontend pages, components, contexts, client i18n, or Vite config under src/client."
applyTo: "src/client/src/**/*.ts, src/client/src/**/*.tsx, src/client/src/**/*.css, src/client/vite.config.ts"
---

# Frontend Guidelines

- Follow existing React + TypeScript patterns with focused components.
- Preserve context-driven state boundaries (`AuthContext`, `I18nContext`, `ThemeContext`).
- Keep user-facing copy in translation files (`src/client/src/i18n/*.json`) and use key-based lookups.
- Keep API access centralized in `src/client/src/api.ts` unless there is an established exception.
- Prefer extending existing page/component patterns before introducing new abstractions.
- Preserve PWA behavior and service-worker assumptions when changing app bootstrapping.
- Treat `VITE_*` values as build-time variables; if behavior depends on them, mention rebuild impact.

## Validation Checklist

- Run `bun run check` from repo root after substantial frontend changes.
- For frontend-only smoke checks, run `cd src/client && bun run build`.
