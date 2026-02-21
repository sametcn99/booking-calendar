# Contributing Guide

Welcome to the **Booking Calendar** contributor's guide! We are thrilled that you're interested in helping us build the world's best self-hosted booking system.

This guide provides a deep dive into our development standards, architectural patterns, and the contribution workflow.

---

## Core Technologies

Before contributing, it's helpful to be familiar with our stack:

- **Runtime**: [Bun](https://bun.sh/) (Fast all-in-one JavaScript runtime)
- **Backend**: TypeScript, [TypeORM](https://typeorm.io/) (SQLite persistence)
- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Base Web](https://baseweb.design/) (UI Framework)
- **Styling**: Styletron (CSS-in-JS used by Base Web)
- **Linting/Formatting**: [Biome](https://biomejs.dev/) (Speedy alternative to ESLint/Prettier)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Architectural Layers

We follow a strict **Layered Architecture** to keep the code testable and maintainable.

### Backend (`src/server`)

1. **Entities**: Database schemas using TypeORM decorators.
2. **Repositories**: Concrete data access logic (SQL queries go here).
3. **Services**: Core business logic, validation, and orchestration.
4. **Controllers**: Request validation and response shaping.

### Frontend (`src/client`)

1. **Contexts**: Global state (Auth, Theme, i18n).
2. **Hooks**: Encapsulated logic and API calls (usually one hook per page).
3. **Components**: UI pieces (Atomic design philosophy).
4. **Pages**: Route-level containers that glue everything together.

---

## Development Workflow

### 1. Environment Setup

Clone the repo and install dependencies for both the root and the client:

```bash
bun install
cd src/client && bun install && cd ../..
```

### 2. Local Development

We recommend running the server and client in separate terminals:

```bash
# Backend (Server)
bun run dev:server

# Frontend (Vite)
bun run dev:client
```

### 3. Quality Control

Always run the quality bridge before committing:

```bash
bun check
```

This command runs Biome to format and lint your code. It will automatically fix most formatting issues.

---

## Localization (i18n)

We take internationalization seriously. **Hard-coded strings are not allowed.**

### Workflow for New Text

1. **Add to English**: Update `src/client/src/i18n/en.json` (Frontend) or `src/server/i18n/en.json` (Backend).
2. **Add to Turkish**: Provide the equivalent in `tr.json`.
3. **Update Schema**: (Frontend only) Update `src/client/src/i18n/schema.json` to include the new key. This ensures type-safety and prevents missing translations.

### Adding a New Language

We welcome new languages!

- Create `[lang_code].json` in the respective i18n folders.
- Register the language in `I18nContext.tsx` and the server's i18n index.

---

## Testing Standards

- **Manual Verification**: Before PR, verify the feature works in both Light and Dark modes.
- **Type Safety**: Ensure `bunx tsc --noEmit` passes in both the root and `src/client` directories.
- **API Stability**: If you change an API response, ensure the frontend `api.ts` client is updated accordingly.

---

## Commit Guidelines

We follow conventional commits to keep a clean history:

- `feat:` for new features.
- `fix:` for bug fixes.
- `docs:` for documentation changes.
- `i18n:` for translation updates.
- `refactor:` for code changes that neither fix a bug nor add a feature.

**Example**: `feat(settings): add webhook test button`

---

## Pull Request Process

1. **Issue First**: For large changes, please open an issue to discuss the approach.
2. **Branching**: Use descriptive branch names like `feature/your-feature` or `fix/issue-id`.
3. **Documentation**: If you're adding a new page or feature, update the relevant döküman in `src/docs`.
4. **Screenshots**: If your PR involves UI changes, please attach "Before/After" screenshots.

Thank you for making **Booking Calendar** better for everyone!
