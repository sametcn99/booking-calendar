# Email System

Booking Calendar uses a robust email notification system to keep both admins and guests informed throughout the booking lifecycle.

## Technology Stack

- **Nodemailer:** Handles SMTP transport.
- **Handlebars:** Renders HTML email templates.
- **node-ics:** Generates calendar attachments (`.ics`).

## Configuration

Email settings are managed through environment variables:

| Variable    | Description                                         |
| ----------- | --------------------------------------------------- |
| `SMTP_HOST` | The hostname of your SMTP server.                   |
| `SMTP_PORT` | Port (usually `587` for STARTTLS or `465` for SSL). |
| `SMTP_USER` | Username for authentication.                        |
| `SMTP_PASS` | Password for authentication.                        |
| `SMTP_FROM` | The address that will appear in the "From" field.   |

## Email Templates

Templates are located in `src/server/mail/templates` and are written using Handlebars (`.hbs`):

1. **`booking-confirmation.hbs`:** Sent to the guest after they request a slot.
2. **`admin-notification.hbs`:** Sent to the admin when a new booking is requested.
3. **`cancellation-notification.hbs`:** Sent when an appointment is cancelled.

## Calendar Integration

Every confirmation email includes an **ICS attachment**. When opened, it allows the guest to add the appointment directly to their calendar app (Google, Apple, Outlook, etc.).

## Token-based Cancellations

Standard emails include a secure, token-based link that allows guests to cancel their appointment without needing to log in. This token is verified by the backend to ensure authorization.

::: tip TROUBLESHOOTING
If emails are not being sent:

- Verify your SMTP credentials.
- Check if your server firewall allows outgoing connections on the SMTP port.
- Ensure the `BASE_URL` is correctly set in `.env`, as it's used to generate links inside the emails.
  :::
