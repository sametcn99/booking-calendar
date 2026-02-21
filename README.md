# Booking Calendar (Self-Hosted)

Booking Calendar is a self-hosted PWA designed for single-admin appointment management. It runs on your own server, keeps your data under your control, and supports a complete booking flow using shareable booking links.

---

## 🚀 Live Documentation

For detailed guides, API references, and deployment instructions, please visit our documentation site:

👉 **[booking-calendar-docs.vercel.app](https://booking-calendar-docs.vercel.app/)**

---

## Key Features

- **Admin Control**: Full dashboard for managing slots, appointments, and unique booking links.
- **Guest Experience**: Streamlined public booking page with mobile-first design.
- **Conflict Prevention**: Built-in double-booking prevention with intelligent slot overlap checks.
- **Smart Notifications**:
  - Email alerts with `.ics` calendar attachments for instant syncing.
  - Token-based one-click cancellation links for guests.
  - Real-time Web Push notifications for administrators.
- **Advanced Sharing**: Public appointment detail pages with persistent shareable links.
- **Community Events**: Support for community-driven events with public approval workflows.
- **Integrations**:
  - **Webhooks**: HMAC-signed notifications for Discord, Slack, or custom automations.
  - **iCal Export**: Export your entire schedule or specific ranges to external calendars.
- **Performance & Security**:
  - **Native PWA**: Installable on both mobile and desktop.
  - **Rate Limiting**: IP-based protection against brute-force and spam.
  - **Async Processing**: Asynchronous email delivery to ensure zero-latency booking responses.
  - **Privacy**: Self-hosted SQLite persistence — your data never leaves your server.

## Quick Links

- [Getting Started](https://booking-calendar-docs.vercel.app/guide/getting-started)
- [Docker Deployment Guide](https://booking-calendar-docs.vercel.app/guide/deployment-docker)
- [Environment Variables](https://booking-calendar-docs.vercel.app/guide/configuration)
- [Contributing Guide](https://booking-calendar-docs.vercel.app/contributing)

## Tech Stack

- **Frontend**: React 19, TypeScript, Base Web, Vite.
- **Backend**: Bun native HTTP server, Layered Architecture.
- **Database**: TypeORM + SQLite (file-based persistence).
- **Notifications**: Nodemailer, Web Push (VAPID), Webhooks.

## License

Released under the GPL 3.0 License.
