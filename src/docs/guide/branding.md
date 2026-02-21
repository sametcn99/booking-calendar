# Branding and Customization

Booking Calendar allows you to customize the look and feel of your instance to match your professional brand.

## Customizing Logos

To change the logos used in the PWA and documentation:

1. Replace the files in `src/client/public/`:
   - `favicon.ico`
   - `apple-touch-icon.png`
   - `android-chrome-192x192.png`
   - `android-chrome-512x512.png`
2. Rebuild the application to apply changes.

## Site Title and Metadata

You can customize the site title and SEO description via environment variables in your `.env`:

```env
VITE_SEO_TITLE=My Professional Booking
VITE_SEO_DESCRIPTION=Book an appointment with me today.
VITE_SEO_AUTHOR=John Doe
```

## Theme Colors

The primary theme color is controlled via CSS variables and `.env` settings for the PWA manifest:

- **Client Styling:** You can modify the `Base Web` theme configuration in the client code if you need deep color changes.
- **PWA Theme Color:** Update the `theme-color` meta tag in `src/client/index.html` or through the environment if supported.

## Localization

If you want to use a specific language for your brand, set `APP_LOCALE` in your `.env`. See the [Localization](./localization) guide for more details.
