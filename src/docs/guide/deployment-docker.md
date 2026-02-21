# Docker Deployment

Docker is the recommended way to deploy Booking Calendar for production use. It bundles the API, frontend, and environment into a single, predictable unit.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Setup Guide

### 1. Prepare Environment

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Ensure you set:

- `BASE_URL`: Your public domain (e.g., `https://book.yourdomain.com`)
- `ADMIN_PASSWORD`: A secure password.
- `JWT_SECRET`: A long, random string.
- `SMTP_*`: Your mail server credentials.

### 2. Launch Containers

Run the following command to build and start the application in detached mode:

```bash
docker compose up -d --build
```

### 3. Verify Health

Check if the containers are running correctly:

```bash
docker compose ps
```

Monitor the logs for any errors:

```bash
docker compose logs -f server
```

## Volumes & Persistence

The `docker-compose.yml` file maps the `./data` directory on your host to the container. This ensures your SQLite database and configuration persist across container restarts and updates.

## Updating

To update to the latest version, pull the changes and rebuild:

```bash
git pull
docker compose up -d --build
```

## Reverse Proxy (Nginx/Traefik)

It is highly recommended to run Booking Calendar behind a reverse proxy like **Nginx Proxy Manager**, **Traefik**, or **Caddy** to handle SSL (HTTPS) termination.

### Example Nginx Snippet

```nginx
server {
    listen 443 ssl;
    server_name book.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
