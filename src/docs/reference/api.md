# API Endpoints

Booking Calendar provides a comprehensive REST API for integration and custom extensions.

## Interactive Documentation

The application includes a built-in interactive API reference powered by **Scalar**.

- **Docs UI:** `/docs`
- **OpenAPI Spec:** `/openapi.json`

You can access these directly from your running instance to explore available endpoints, request parameters, and response schemas.

## Authentication

Admin-restricted endpoints require a Bearer Token in the `Authorization` header.

```text
Authorization: Bearer <your-jwt-token>
```

You can obtain a token by authenticating with the `/api/auth/login` endpoint using your admin credentials.

## Public Endpoints

These endpoints can be accessed without authentication (though they are still protected by rate limiting).

- `GET /api/public/slots`: List available booking slots.
- `POST /api/public/appointments`: Create a new appointment request.
- `GET /api/public/appointments/:id`: Get details of a public appointment.

## Personal tags

These endpoints require an administrator session and return the current administrator's tag snapshot under `data`. Each tag includes its `id`, `name`, `color`, and usage `count`. Each assignment includes `tagId`, `kind`, and `itemId`.

| Method and path                          | Request                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `GET /api/admin/tags`                    | List tags and assignments.                                                       |
| `POST /api/admin/tags`                   | Create with `name`, optional `color`, and optional `items` to assign atomically. |
| `PATCH /api/admin/tags/{id}`             | Set `name`, `color`, or both.                                                    |
| `DELETE /api/admin/tags/{id}`            | Delete the tag and its assignments.                                              |
| `PATCH /api/admin/tags/{id}/assignments` | Send `action` (`apply` or `remove`) and `items`.                                 |

An item has a numeric `itemId` and a `kind` of `appointment`, `community`, or `planner`. Each batch supports up to 100 items. Tag names are trimmed and unique for the signed-in administrator, regardless of case.

## Base URL

All API requests should be prefixed with `/api/`.

Example: `GET https://book.yourdomain.com/api/public/slots`

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Success.
- `400 Bad Request`: Validation error or invalid input.
- `401 Unauthorized`: Authentication failed or missing.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Server-side failure.
