# Contributing Guide

Thank you for contributing to Booking Calendar.
This document explains how to contribute new features and how to add new translations in a safe, consistent way.

## Table of Contents

1. [Scope and Principles](#1-scope-and-principles)
2. [Development Setup](#2-development-setup)
3. [Project Structure at a Glance](#3-project-structure-at-a-glance)
4. [Feature Contribution Workflow](#4-feature-contribution-workflow)
5. [Implementation Standards](#5-implementation-standards)
6. [Validation Checklist Before PR](#6-validation-checklist-before-pr)
7. [Translation Contribution Workflow](#7-translation-contribution-workflow)
8. [Translation Quality Rules](#8-translation-quality-rules)
9. [Commit and Pull Request Guidelines](#9-commit-and-pull-request-guidelines)

## 1. Scope and Principles

This project is a self-hosted booking system with:

- Bun backend (`src/server`)
- React + Vite frontend (`src/client`)
- Multi-language support (currently English and Turkish, but open to and welcoming new languages)

When contributing:

- Keep changes focused and atomic.
- Prefer consistency with existing patterns over introducing a new style.
- Update localization for user-facing text.
- Keep API behavior backward-compatible unless intentionally changed and documented.

## 2. Development Setup

From repository root:

```bash
bun install
cd src/client && bun install && cd ../..
```

Run in development:

```bash
bun run dev:server
bun run dev:client
```

Quick quality check:

```bash
bun check
```

Notes:

- `bun check` runs Biome and may apply formatting fixes.
- Frontend is under `src/client`, backend is under `src/server`.

## 3. Project Structure at a Glance

- `src/server/controllers`: HTTP-level handling, request/response shaping
- `src/server/services`: business logic and validation
- `src/server/repositories`: data access abstraction
- `src/server/entities`: TypeORM entities
- `src/server/i18n`: backend translation files
- `src/client/src/pages`: route-level UI pages
- `src/client/src/components`: reusable UI components
- `src/client/src/i18n`: frontend translation files and schema
- `src/client/src/api.ts`: frontend API client layer

## 4. Feature Contribution Workflow

### Step 1: Plan the feature boundaries

Before coding, define:

- User-visible behavior
- API changes (if any)
- Data model changes (if any)
- Required localization keys

### Step 2: Create backend changes first (if needed)

Typical flow:

1. Add or update entity in `src/server/entities`
2. Add repository methods in `src/server/repositories`
3. Add service logic in `src/server/services`
4. Add controller methods in `src/server/controllers`
5. Register routes in `src/server/index.ts`

Guidelines:

- Keep validation in service layer.
- Return consistent JSON response shapes.
- Use existing error handling style and i18n keys.

### Step 3: Add frontend integration

Typical flow:

1. Add API client methods in `src/client/src/api.ts`
2. Create or update hooks in page-level `hooks/`
3. Build UI components in page-level `components/`
4. Wire route in `src/client/src/App.tsx`
5. If needed, add menu entry in `src/client/src/components/AdminLayout.tsx`

Guidelines:

- Keep API calls inside hooks/services, not deeply scattered in presentational components.
- Reuse existing components and UX patterns where possible.
- Handle loading, error, and empty states explicitly.

### Step 4: Add localization keys before finishing

Any user-facing string must be translatable.

- Frontend keys go to `src/client/src/i18n/en.json` and `src/client/src/i18n/tr.json`.
- Backend message keys go to `src/server/i18n/en.json` and `src/server/i18n/tr.json`.

### Step 5: Validate end-to-end

Test the full scenario from UI to API:

- Create/update/delete paths
- Error paths
- Permission boundaries
- Public routes vs protected routes

## 5. Implementation Standards

- Follow existing naming conventions and folder layout.
- Keep TypeScript types explicit for API responses and core data shapes.
- Avoid unrelated refactors in the same PR.
- Prefer small, readable functions over large mixed-responsibility blocks.
- Preserve existing language and i18n key style (`section.keyName`).

## 6. Validation Checklist Before PR

Run these checks from repo root:

```bash
bun check
```

Recommended additional checks:

- Frontend typecheck/build:

```bash
cd src/client
bunx tsc --noEmit
bun run build
```

- Root typecheck (if applicable in your change set):

```bash
cd ../..
bunx tsc --noEmit
```

Manual verification checklist:

- No broken admin routes
- No broken public booking flow
- No missing translation text
- No obvious console/runtime errors

## 7. Translation Contribution Workflow

This section is required reading if your contribution introduces new text.

### 7.1 Frontend translations

Files:

- `src/client/src/i18n/en.json`
- `src/client/src/i18n/tr.json`
- `src/client/src/i18n/schema.json`

Process:

1. Add new key in `en.json`.
2. Add the same key path in `tr.json`.
3. Update `schema.json`:
   - Add key under the correct section in `properties`
   - Add key to that section's `required` array
4. Use key via `t("section.key")` in React code.

Example:

```json
{
  "planner": {
    "newHint": "New helper text"
  }
}
```

Then add Turkish equivalent under the same path.

### 7.2 Backend translations

Files:

- `src/server/i18n/en.json`
- `src/server/i18n/tr.json`

Process:

1. Add key to both language files with the same structure.
2. Use key through server i18n helper (for example `t("planner.fieldsRequired")`).
3. Ensure error and validation messages are localized.

### 7.3 Rules for adding new keys

- Never add a key only in one language.
- Keep key names semantic and stable.
- Prefer grouping by domain (`planner`, `settings`, `booking`, etc.).
- Do not reuse a misleading key just because text is similar.

### 7.4 Common translation pitfalls

- Missing schema updates in `src/client/src/i18n/schema.json`
- Mismatched key path between `en.json` and `tr.json`
- Using hard-coded strings in components
- Server errors returned as raw English text without i18n key

### 7.5 Adding a new language

This project is open to and welcomes new language contributions. If you would like to add a new language:

1. Create new JSON translation files in:
   - `src/client/i18n/[lang_code].json`
   - `src/server/i18n/[lang_code].json`
2. Follow the existing structure from `en.json`.
3. Register the new language in `src/server/i18n/index.ts` and `src/client/src/context/I18nContext.tsx`.
4. Ensure the new language is added to the language selection UI and server-side validation.

## 8. Translation Quality Rules

- English should be clear and neutral.
- Turkish should be natural and context-accurate.
- Avoid machine-like literal translations for action labels.
- Keep placeholders and variable semantics aligned between languages.
- Preserve punctuation and casing consistency where applicable.

## 9. Commit and Pull Request Guidelines

### Commit suggestions

Use small, focused commits, for example:

- `feat(planner): add event edit modal`
- `fix(booking): prevent slot overlap race`
- `i18n(settings): add calendar sharing labels`

### Pull request content

Include:

- What changed
- Why it changed
- API or data model impact
- UI screenshots (if UI changed)
- Test/validation notes
- Translation keys added

A strong PR is easy to review, easy to test, and easy to roll back.
