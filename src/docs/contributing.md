# Contributing Guide

Welcome and thank you for your interest in contributing to **Booking Calendar**! This project is built by the community for the community.

## Development Setup

To get started with development, follow these steps:

1. **Install Dependencies:**

   ```bash
   bun install
   cd src/client && bun install && cd ../..
   ```

2. **Run in Development Mode:**

   ```bash
   # Terminal 1: Backend
   bun run dev:server

   # Terminal 2: Frontend
   bun run dev:client
   ```

3. **Verify Quality:**
   ```bash
   bun check
   ```

## Project Structure

- `src/server`: Bun backend (Controllers, Services, Repositories).
- `src/client`: React frontend (Vite, Base Web).
- `src/docs`: VitePress documentation (this site).

## Workflow Principles

- **Focus & Atomic:** Keep your changes specific and small.
- **Consistency:** Follow existing code patterns and architectural layers.
- **Localization:** Every user-facing string must be translatable.
- **Backward Compatibility:** Maintain API stability unless discussed and documented.

## Localization (i18n)

Every bit of text in the UI and server responses must be localized.

- **Frontend:** `src/client/src/i18n/en.json` and `tr.json`.
- **Backend:** `src/server/i18n/en.json` and `tr.json`.
- **Schema:** Update `src/client/src/i18n/schema.json` when adding new frontend keys.

## Pull Requests

When submitting a PR:

- Describe the changes and the "why".
- Include screenshots for UI changes.
- Ensure `bun check` passes.
- Maintain clear commit messages (e.g., `feat:`, `fix:`, `i18n:`).

::: tip NEW LANGUAGES
We warmly welcome new language contributions! See the full [Contributing Guide](https://github.com/sametcn99/booking-calendar/blob/main/CONTRIBUTING.md) on GitHub for detailed instructions on adding a new language.
:::
