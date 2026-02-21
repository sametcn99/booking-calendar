# Manual Installation Guide

If you prefer not to use Docker, you can install and run Booking Calendar manually on your server using Bun.

## Step 1: Clone and Install

```bash
git clone https://github.com/sametcn99/booking-calendar.git
cd booking-calendar
bun install
```

## Step 2: Client Build

```bash
cd src/client
bun install
bun run build
cd ../..
```

## Step 3: Environment Configuration

Copy the example environment file and edit it with your settings:

```bash
cp .env.example .env
nano .env
```

Ensure you set the following correctly:
- `BASE_URL`: Your public domain (e.g., `https://booking.example.com`)
- `PORT`: Usually `3000`
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: Your login credentials
- `JWT_SECRET`: A long random string

## Step 4: Running with a Process Manager

We recommend using **PM2** to keep the application running in the background.

```bash
# Install PM2 globally
bun add -g pm2

# Start the application
pm2 start src/server/index.ts --name booking-calendar --interpreter bun
```

## Step 5: Reverse Proxy (Nginx)

To serve your application over HTTPS, use a reverse proxy like Nginx.

```nginx
server {
    listen 80;
    server_name booking.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Static Files Note

Make sure the server can serve static files from `src/client/dist`. The Bun server handles this automatically if `BASE_URL` is set correctly.
