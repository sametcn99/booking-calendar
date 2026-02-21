# Docker Deployment Guide

Deploying Booking Calendar with Docker is the most reliable method for production environments. It ensures that all dependencies (Bun, SQLite, etc.) are version-locked and isolated.

## Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- Basic knowledge of terminal/SSH.

---

## 1. Using Pre-built Images (Recommended)

The easiest way to run Booking Calendar is by using the pre-built images from our GitHub Container Registry. This avoids the need to build the image locally and ensures you're running a verified version.

### Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
services:
  app:
    image: ghcr.io/sametcn99/booking-calendar:latest
    container_name: booking-calendar
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - PORT=3000
      - DATABASE_PATH=/app/data/database.sqlite
      # See Section 3 (Environment Variables) for more configuration variables
```

Run the application:

```bash
docker compose up -d
```

### Docker Run

If you prefer using a single command:

```bash
docker run -d \
  --name booking-calendar \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e DATABASE_PATH=/app/data/database.sqlite \
  ghcr.io/sametcn99/booking-calendar:latest
```

---

## 2. Manual Build (Custom Setup)

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

## 3. Environment Variables

For a complete list of all available settings, refer to the [Environment Variables](./environment-variables.md) documentation.

In Docker, variables are categorized into two types:

### Build-time Variables (`VITE_`)

These are baked into the frontend bundle during the build process. If you change these, **you must rebuild the image** (e.g., `docker compose up -d --build`).

- **`VITE_SEO_TITLE`**: Customizes the brand name/title in the browser.
- **`VITE_PUBLIC_URL`**: The base URL of your deployment (e.g., `https://book.example.com`).
- **`VITE_VAPID_PUBLIC_KEY`**: Public key for Web Push notifications.

### Runtime Variables

These can be updated by simply restarting the container.

- **`ADMIN_PASSWORD`**: Required to access the management dashboard.
- **`JWT_SECRET`**: Used for session security. Should be a long random string.
- **`SMTP_*`**: Parameters for your email provider (host, port, user, pass).
- **`DB_PATH`**: Internal path to the database (default: `/app/data/booking.db`).

### Full Configuration Example

A production-ready `docker-compose.yml` with all common variables:

```yaml
services:
  app:
    image: ghcr.io/sametcn99/booking-calendar:latest
    container_name: booking-calendar
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      # --- CORE SETTINGS ---
      - PORT=3000
      - BASE_URL=https://booking.example.com
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=choose_a_strong_password
      - JWT_SECRET=random_long_string_here

      # --- DATABASE ---
      - DB_PATH=/app/data/booking.db

      # --- EMAIL (SMTP) ---
      - SMTP_HOST=smtp.mailtrap.io
      - SMTP_PORT=587
      - SMTP_USER=your_username
      - SMTP_PASS=your_password
      - SMTP_FROM="Booking <noreply@example.com>"

      # --- WEB PUSH (Optional) ---
      - VITE_VAPID_PUBLIC_KEY=your_public_vapid_key
      - VAPID_PRIVATE_KEY=your_private_vapid_key

      # --- SEO (Build-time) ---
      - VITE_SEO_TITLE="Premium Booking Service"
      - VITE_SEO_DESCRIPTION="Book your appointment online easily."
```

::: tip USING A .ENV FILE
Instead of listing all variables in `docker-compose.yml`, you can create a `.env` file in the same directory and use `env_file`:

```yaml
services:
  app:
    # ...
    env_file: .env
```

:::

---

## 4. Persistent Data (Volumes)

Booking Calendar uses a Docker Volume to ensure your database and settings are not lost when the container is updated or removed.

In `docker-compose.yml`:

```yaml
volumes:
  - booking_data:/app/data
```

The SQLite database is stored in `/app/data/booking.db` inside the container, which maps to a managed volume on your host.

---

## 5. Deploying on Coolify

Booking Calendar is optimized for **Coolify**. The `docker-compose.yml` uses `${VAR:-default}` syntax which Coolify automatically parses.

1. **New Resource**: Create a "Docker Compose" project.
2. **Repository**: Paste the Booking Calendar GitHub URL.
3. **Environment**: Coolify will present a UI for all variables. Fill in your `BASE_URL` and secrets.
4. **Deploy**: Click deploy. Coolify handles the multi-stage build automatically.

---

## 6. Reverse Proxy & SSL

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

## 7. Maintenance Commands

| Command                                          | Description                   |
| :----------------------------------------------- | :---------------------------- |
| `docker compose logs -f app`                     | Follow logs in real-time.     |
| `docker compose stop`                            | Stop the application.         |
| `docker compose pull && docker compose up -d`    | Update to the latest version. |
| `docker exec -it booking-calendar-app-1 /bin/sh` | Access the container shell.   |

---

## 8. Troubleshooting

### Container keeps restarting

Check the logs: `docker compose logs app`. Usually, this is due to an invalid `.env` value or the port `3000` being used by another app.

### Emails not sending

Ensure `SMTP_HOST` and `SMTP_PORT` are correct. Many VPS providers block port `25`; use `587` or `465` with TLS/SSL.

### Public page shows old SEO info

SEO variables are **Build-time**. You must run `docker compose up -d --build` after changing any `VITE_*` variables in your `.env`.
