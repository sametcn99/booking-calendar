# Getting Started

Welcome to the **Booking Calendar** documentation! This guide will help you get your self-hosted booking system up and running in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh/) (latest version)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

## Quick Start (Local)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sametcn99/booking-calendar.git
   cd booking-calendar
   ```

2. **Install dependencies:**

   ```bash
   bun install
   cd src/client && bun install && cd ../..
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your `BASE_URL`, `JWT_SECRET`, and admin credentials.

4. **Build the frontend:**

   ```bash
   cd src/client && bun run build && cd ../..
   ```

5. **Start the application:**

   ```bash
   bun run start
   ```

The app will be available at `http://localhost:3000`.

## Docker Quick Start (Recommended)

For a production-ready setup, use Docker Compose:

1. **Configure Environment:**
   Set up your `.env` file as described above.

2. **Run with Docker:**

   ```bash
   docker-compose up -d --build
   ```

3. **Access the App:**
   Open `http://localhost:3000` in your browser.

::: tip PRO TIP
Always set a strong `JWT_SECRET` and `ADMIN_PASSWORD` before exposing your instance to the internet.
:::

## Next Steps

- [Configure Environment Variables](./environment-variables)
- [Set up Web Push Notifications](./web-push)
- [Configure Email Notifications](./email-system)
