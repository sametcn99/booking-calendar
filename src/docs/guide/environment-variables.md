# Configuration

The application is configured using environment variables. Create a `.env` file in the root directory based on `.env.example`.

## Core Settings

| Variable         | Description                               | Default                 |
| ---------------- | ----------------------------------------- | ----------------------- |
| `PORT`           | Backend port                              | `3000`                  |
| `BASE_URL`       | Public base URL (crucial for email links) | `http://localhost:3000` |
| `ADMIN_USERNAME` | Initial admin username                    | `admin`                 |
| `ADMIN_PASSWORD` | Initial admin password                    | -                       |
| `JWT_SECRET`     | Secret for signing auth tokens            | -                       |

## Database

| Variable  | Description                      | Default             |
| --------- | -------------------------------- | ------------------- |
| `DB_PATH` | Path to the SQLite database file | `./data/booking.db` |

## Email (SMTP)

| Variable    | Description                                        |
| ----------- | -------------------------------------------------- |
| `SMTP_HOST` | SMTP server hostname                               |
| `SMTP_PORT` | SMTP port (e.g., 587)                              |
| `SMTP_USER` | SMTP username                                      |
| `SMTP_PASS` | SMTP password                                      |
| `SMTP_FROM` | Sender address (e.g., `Name <noreply@domain.com>`) |

## Web Push (VAPID)

| Variable                | Description             |
| ----------------------- | ----------------------- |
| `VITE_VAPID_PUBLIC_KEY` | Public key (build-time) |
| `VAPID_PRIVATE_KEY`     | Private key (runtime)   |

## Rate Limiting

| Variable                  | Description             | Default |
| ------------------------- | ----------------------- | ------- |
| `RATE_LIMIT_WINDOW_MS`    | Window in milliseconds  | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `30`    |

## SEO Metadata (Build-time)

| Variable               | Description             |
| ---------------------- | ----------------------- |
| `VITE_SEO_TITLE`       | Page title              |
| `VITE_SEO_DESCRIPTION` | Meta description        |
| `VITE_SEO_LANG`        | HTML language attribute |

::: warning REBUILD REQUIRED
Variables starting with `VITE_` are embedded into the frontend bundle at build time. If you change them, you **must** rebuild the frontend or the Docker image.
:::
