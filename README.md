# Booking Calendar (Self-Hosted)

Booking Calendar is a self-hosted PWA designed for single-admin appointment management. It runs on your own server, keeps your data under your control, and supports a complete booking flow using shareable booking links.

This project is specifically optimized for self-hosted deployments:

- API and web app are served from a single process.
- File-based database storage (SQLite/sql.js style) makes backup and migration simple.
- Email notifications are sent using your own SMTP configuration.
- It can be safely exposed to the internet behind a reverse proxy.

## Key Features

- Admin panel for slots, appointments, and booking links
- Public booking page for guests
- Double-booking prevention with slot overlap checks
- Email notifications with `.ics` calendar attachments
- Token-based cancellation links in email
- Installable PWA (mobile and desktop)
- IP-based rate limiting
- Asynchronous email sending, so booking responses are not blocked

## Tech Stack

- Frontend: React + TypeScript + Base Web, Vite
- Backend: Bun native HTTP server, OOP layers (Controller/Service/Repository)
- Database: TypeORM + `sqljs` (file-based persistence)
- Email: Nodemailer + Handlebars HTML templates + ICS attachments

## Architecture

In production, `bun run start` serves both backend API and frontend static assets.

- API prefix: `/api/...`
- Frontend: served from `src/client/dist`
- Auth: Bearer token
- Persistence: file path configured by `DB_PATH`

## Quick Start

```bash
# 1) Install dependencies
bun install
cd src/client && bun install && cd ../..

# 2) Configure environment
cp .env.example .env

# 3) Edit .env values
# - BASE_URL
# - JWT_SECRET
# - SMTP_*
# - ADMIN_USERNAME / ADMIN_PASSWORD
# - VAPID_* (for push notifications)

# 4) Build frontend
cd src/client && bun run build && cd ../..

# 5) Start app (API + frontend)
bun run start
```

By default, the app runs on `http://localhost:3000`.

## Docker Quick Start

1. **Configure Environment**:

   ```bash
   cp .env.example .env
   # Edit .env and set your values (SMTP, ADMIN credentials, etc.)
   ```

2. **Run with Docker Compose**:

   ```bash
   docker-compose up -d --build
   ```

3. **Access the App**:
   Open `http://localhost:3000`.

**Note:** The database is persisted in the `./data` directory. If you change `VITE_*` variables in `.env`, you must rebuild the image (`docker-compose up -d --build`).

If you change `VITE_VAPID_PUBLIC_KEY`, it is also a `VITE_*` build-time variable and requires image rebuild.

## Development Mode

```bash
# Terminal 1: backend (watch)
bun run dev:server

# Terminal 2: frontend (Vite dev)
bun run dev:client
```

## Environment Variables

The table below matches `.env.example`.

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend port | `3000` |
| `HOST` | Backend bind address | `0.0.0.0` |
| `BASE_URL` | Public base URL (critical for email links) | `https://book.example.com` |
| `ADMIN_USERNAME` | Initial admin username | `admin` |
| `ADMIN_PASSWORD` | Initial admin password | `strong-password` |
| `JWT_SECRET` | JWT signing secret (must be strong and long) | `change-me` |
| `SMTP_HOST` | SMTP server hostname | `smtp.example.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `noreply@example.com` |
| `SMTP_PASS` | SMTP password | `...` |
| `SMTP_FROM` | Sender address | `Booking <noreply@example.com>` |
| `DB_PATH` | Database file path | `./data/booking.db` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in ms | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `30` |
| `VITE_VAPID_PUBLIC_KEY` | Public VAPID key used by browser push subscription (build-time) | `BEl...` |
| `VAPID_PRIVATE_KEY` | Private VAPID key used by server to send Web Push | `2Vw...` |
| `VITE_PUBLIC_URL` | Canonical/public app URL used for SEO tags | `https://book.example.com` |
| `VITE_SEO_LANG` | HTML `lang` value | `en` |
| `VITE_SEO_TITLE` | SEO page title | `Booking Calendar` |
| `VITE_SEO_DESCRIPTION` | SEO meta description | `Personal booking calendar` |
| `VITE_SEO_KEYWORDS` | SEO meta keywords | `booking,calendar,appointments,self-hosted` |
| `VITE_SEO_AUTHOR` | SEO author metadata | `Booking Calendar` |
| `VITE_SEO_OG_TYPE` | Open Graph type | `website` |
| `VITE_SEO_TWITTER_CARD` | Twitter card type | `summary` |

Notes:

- If `BASE_URL` is wrong, cancellation links in emails will be wrong.
- Never keep default `JWT_SECRET` or `ADMIN_PASSWORD` in production.
- `VITE_VAPID_PUBLIC_KEY` is build-time (frontend bundle). Rebuild client/image after changing it.
- `VAPID_PRIVATE_KEY` is runtime env var used by the backend push sender.

## Web Push (VAPID)

VAPID keys are used for browser push notifications:

- `VITE_VAPID_PUBLIC_KEY`: sent to browser to create push subscription.
- `VAPID_PRIVATE_KEY`: stays on server; signs push payload requests.

Generate keys:

```bash
bun run generate-vapid-keys
```

This creates `vapid-keys.txt` with ready-to-copy `.env` lines:

```env
VITE_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

Then:

1. Copy values into `.env`.
2. Rebuild frontend/client image because `VITE_VAPID_PUBLIC_KEY` is embedded at build time.
3. Restart app/container so backend reads `VAPID_PRIVATE_KEY`.

## Self-Hosted Production Setup Guide

### 1) Build

```bash
bun install
cd src/client && bun install && bun run build && cd ../..
```

### 2) Configure `.env`

- For better security, use `HOST=127.0.0.1` and expose via reverse proxy.
- Set `BASE_URL` to your public domain.
- Verify SMTP credentials and delivery.

### 3) Run as a Service (systemd example)

`/etc/systemd/system/booking-calendar.service`:

```ini
[Unit]
Description=Booking Calendar
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/booking-calendar
ExecStart=/usr/bin/bun run start
Restart=always
RestartSec=5
User=www-data
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable booking-calendar
sudo systemctl start booking-calendar
sudo systemctl status booking-calendar
```

### 4) Reverse Proxy (Nginx example)

```nginx
server {
    listen 80;
    server_name book.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

After that, add TLS using Let's Encrypt (`certbot`).

## Security Checklist

- Change default admin credentials.
- Use a long, random `JWT_SECRET`.
- Serve publicly only behind HTTPS.
- Restrict firewall rules to required ports (`80/443`).
- Tighten file permissions for `.env` and `DB_PATH`.
- Create regular backups.

## Backup and Restore

Because persistence is file-based, backup is straightforward.

- Primary backup target: file configured by `DB_PATH`
- Recommendation: daily automated backups, copied to separate disk/object storage

Example:

```bash
cp ./data/booking.db ./backups/booking-$(date +%F).db
```

For restore: stop service, replace DB file with backup, start service again.

## Email System

Email bodies are rendered from Handlebars templates under `src/server/mail/templates`:

- `booking-confirmation.hbs`
- `admin-notification.hbs`
- `cancellation-notification.hbs`

Template variables are provided in `src/server/mail/MailService.ts` context objects.

## API Endpoints

Interactive API reference is available via Scalar:

- Docs UI: `/docs`
- OpenAPI spec: `/openapi.json`

### Public

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Admin login |
| `GET` | `/api/settings/language` | Get active language setting |
| `GET` | `/api/public/book/:token` | Validate booking token |
| `GET` | `/api/public/book/:token/slots` | Get available slots |
| `POST` | `/api/public/book/:token/appointments` | Create appointment |
| `GET` | `/api/public/calendar` | View shared calendar (if enabled) |
| `GET` | `/api/public/appointments/cancel/:token` | Cancel appointment by token |

### Admin (Bearer token required)

| Method | Path | Description |
|---|---|---|
| `PATCH` | `/api/admin/auth/change-password` | Change password |
| `GET` | `/api/admin/slots` | List slots |
| `POST` | `/api/admin/slots` | Create slot |
| `PATCH` | `/api/admin/slots/:id` | Toggle slot active/inactive |
| `PATCH` | `/api/admin/slots/:id/name` | Rename slot |
| `DELETE` | `/api/admin/slots/:id` | Delete slot |
| `GET` | `/api/admin/appointments` | List appointments |
| `DELETE` | `/api/admin/appointments/:id` | Delete appointment |
| `PATCH` | `/api/admin/appointments/:id/cancel` | Cancel appointment |
| `GET` | `/api/admin/links` | List booking links |
| `POST` | `/api/admin/links` | Create booking link |
| `DELETE` | `/api/admin/links/:id` | Delete booking link |
| `GET` | `/api/admin/settings/admin-email` | Get admin email setting |
| `GET` | `/api/admin/settings/calendar-sharing` | Get calendar sharing status |
| `PUT` | `/api/admin/settings/calendar-sharing` | Set calendar sharing status |
| `PUT` | `/api/admin/settings/language` | Change application language |
| `GET` | `/api/admin/planner` | List planner events |
| `POST` | `/api/admin/planner` | Create planner event |
| `PATCH` | `/api/admin/planner/:id` | Update planner event |
| `DELETE` | `/api/admin/planner/:id` | Delete planner event |
| `POST` | `/api/admin/push/subscribe` | Subscribe to push notifications |
| `PUT` | `/api/admin/settings/language` | Change application language |

## Project Structure

```
.
├── src/
│   ├── server/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── entities/
│   │   ├── db/
│   │   ├── mail/
│   │   │   ├── MailService.ts
│   │   │   ├── ics.ts
│   │   │   └── templates/
│   │   └── middleware/
│   └── client/
│       └── src/
├── data/
├── .env.example
└── package.json
```

## Troubleshooting

### Emails are not sent

- Check all `SMTP_*` values.
- Confirm SMTP TLS/port requirements.
- Validate `SMTP_FROM` format.

### Cancellation link points to wrong domain

- Set `BASE_URL` to your production domain.

### Frontend loads but API fails

- Check reverse proxy forwarding rules for `/`.
- Verify backend service status (`systemctl status`).

## Usage Note

This repository is designed for personal/self-hosted use. If you need team workflows or multi-tenant support, you should extend auth/roles, auditing, background jobs, and data strategy accordingly.
