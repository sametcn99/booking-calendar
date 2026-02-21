# Docker Deployment Guide

Deploying Booking Calendar with Docker is the most reliable method for production environments. It ensures that all dependencies (Bun, SQLite, etc.) are version-locked and isolated.

## Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- Basic knowledge of terminal/SSH.

---

## 1. Fast Track (Standard Setup)

### Prepare Environment

Clone the repository and create your configuration:

```bash
git clone https://github.com/sametcn99/booking-calendar.git
cd booking-calendar
cp .env.example .env
```

Edit the `.env` file and set your critical variables (see [important variables](#3-environment-variables) below).

### Build and Start

Run the following command to build the production image and start the container:

```bash
docker compose up -d --build
```

The application will be accessible at `http://localhost:3000` (or the port you defined).

---

## 2. Understanding variables

There are two types of variables in Booking Calendar's Docker setup:

### Build-time Variables (`VITE_`)

These are embedded into the static JavaScript bundle during the build process. If you change these, **you must rebuild the image**.

- `VITE_SEO_TITLE`: Change the title of the public site.
- `VITE_PUBLIC_URL`: Critical for assets and PWA manifests.
- `VITE_VAPID_PUBLIC_KEY`: Used for Web Push notifications.

### Runtime Variables

These can be changed at any time by restarting the container.

- `ADMIN_PASSWORD`: Your entry to the dashboard.
- `SMTP_*`: Your mail server details.
- `DB_PATH`: Location of the SQLite file (defaults to `/app/data/booking.db`).

---

## 3. Persistent Data (Volumes)

Booking Calendar uses a Docker Volume to ensure your database and settings are not lost when the container is updated or removed.

In `docker-compose.yml`:

```yaml
volumes:
  - booking_data:/app/data
```

The SQLite database is stored in `/app/data/booking.db` inside the container, which maps to a managed volume on your host.

---

## 4. Deploying on Coolify

Booking Calendar is optimized for **Coolify**. The `docker-compose.yml` uses `${VAR:-default}` syntax which Coolify automatically parses.

1. **New Resource**: Create a "Docker Compose" project.
2. **Repository**: Paste the Booking Calendar GitHub URL.
3. **Environment**: Coolify will present a UI for all variables. Fill in your `BASE_URL` and secrets.
4. **Deploy**: Click deploy. Coolify handles the multi-stage build automatically.

---

## 5. Reverse Proxy & SSL

For production, you **must** use HTTPS. We recommend:

### Using Nginx Proxy Manager

1. Set the forward hostname to `app` (if in the same network) or the Host IP.
2. Set the port to `3000`.
3. Enable "Websockets Support" and "Block Common Exploits".
4. Generate an SSL certificate (Let's Encrypt).

### Using Traefik (Labels)

If you use Traefik, add these labels to your `docker-compose.yml`:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.booking.rule=Host(`book.yourdomain.com`)"
  - "traefik.http.services.booking.loadbalancer.server.port=3000"
```

---

## 6. Maintenance Commands

| Command                                          | Description                   |
| :----------------------------------------------- | :---------------------------- |
| `docker compose logs -f app`                     | Follow logs in real-time.     |
| `docker compose stop`                            | Stop the application.         |
| `docker compose pull && docker compose up -d`    | Update to the latest version. |
| `docker exec -it booking-calendar-app-1 /bin/sh` | Access the container shell.   |

---

## 7. Troubleshooting

### Container keeps restarting

Check the logs: `docker compose logs app`. Usually, this is due to an invalid `.env` value or the port `3000` being used by another app.

### Emails not sending

Ensure `SMTP_HOST` and `SMTP_PORT` are correct. Many VPS providers block port `25`; use `587` or `465` with TLS/SSL.

### Public page shows old SEO info

SEO variables are **Build-time**. You must run `docker compose up -d --build` after changing any `VITE_*` variables in your `.env`.
