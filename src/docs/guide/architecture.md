# Architecture

Booking Calendar is designed with a focus on simplicity, performance, and ease of self-hosting.

## Unified Process

In production, the application runs as a single process. The Bun server serves both the **REST API** and the **Frontend Static Assets**.

- **API Prefix:** `/api/`
- **Frontend Dir:** `src/client/dist`

## Directory Structure

```text
├── src
│   ├── client          # React frontend (Vite)
│   ├── server          # Bun backend
│   │   ├── controllers # Request handlers
│   │   ├── services    # Business logic
│   │   ├── repositories # Data access
│   │   ├── entities    # TypeORM definitions
│   │   └── mail        # Handlebars templates
│   └── docs            # VitePress documentation
├── data                # SQLite database storage
└── docker-compose.yml  # Production deployment
```

## Data Persistence

The system uses **TypeORM** with **SQLite** (via `sqljs` or native driver). This allows for file-based storage, making the database portable and easy to back up without complex database management systems.

## Asynchronous Tasks

Notifications and heavy tasks are handled asynchronously. For example, email sending is non-blocking, ensuring that the user receives an immediate response after booking while the email is sent in the background.

## Security Layers

1. **JWT Auth:** Token-based authentication for the admin panel.
2. **Rate Limiting:** Protects endpoints from brute-force and spam.
3. **HMAC Signing:** Ensures integrity and authenticity of webhooks.
4. **CORS:** Configured to restrict access as needed.
