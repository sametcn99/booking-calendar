# Localization (i18n)

Booking Calendar currently supports multiple languages to provide a better user experience for international users.

## Supported Languages

- 🇬🇧 **English (en):** Full support for client and server.
- 🇹🇷 **Turkish (tr):** Full support for client and server.

## How it Works

The system uses a unified internationalization approach:

- **Client-side:** React-based translation system using the browser's language preference or user settings.
- **Server-side:** Dynamic translations for emails, push notifications, and system messages based on the environment configuration or entity preferences.

## Changing Language

To change the default language of the application, update the environment variable in your `.env` file:

```env
# Default language (en or tr)
APP_LOCALE=en
```

## Contributing to Translations

We welcome contributions for new languages! Translation files are located in:

- **Server:** `src/server/i18n/*.json`
- **Client:** `src/client/src/i18n/*.json`

Each file contains key-value pairs. To add a new language:
1. Copy `en.json`.
2. Rename it to your locale (e.g., `de.json`, `fr.json`).
3. Translate the values.
4. Add the new locale to the i18n initialization in `src/server/i18n/index.ts`.
