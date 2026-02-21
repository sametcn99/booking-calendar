# Webhook Notifications

Booking Calendar can mirror all notification events to an external webhook endpoint. This allows you to integrate your booking system with services like Discord, Slack, or custom automation workflows.

## Configuration

Navigate to **Settings -> Webhook Notifications** in the admin panel to:

1. Enable/Disable webhook delivery.
2. Set your **Webhook URL** (must be `https` in production).
3. Set a **Signing Secret** (minimum 16 characters).
4. Send a test event to verify connectivity.

## Delivery Headers

Every webhook request includes the following security and metadata headers:

| Header                          | Description                                     |
| ------------------------------- | ----------------------------------------------- |
| `X-BookingCalendar-Signature`   | HMAC SHA-256 signature (`sha256=<hmac>`)        |
| `X-BookingCalendar-Timestamp`   | Unix timestamp of the event                     |
| `X-BookingCalendar-Event`       | Name of the event (e.g., `appointment.created`) |
| `X-BookingCalendar-Delivery-Id` | Unique UUID for the delivery                    |

## Security Verification

To ensure that a webhook was sent by your Booking Calendar instance, you should verify the signature.

### Signature Payload

The signature is computed using:
`<timestamp>.<raw-json-body>`

### Example Verification (Node.js)

```javascript
const crypto = require("crypto");

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expected = `sha256=${hmac.digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

## Supported Events

- `appointment.created`: Triggered when a new booking is requested.
- `appointment.cancelled`: Triggered when an appointment is cancelled by admin or guest.
- `slot.created`: Triggered when a new availability slot is added.
- `test`: Sent when you click "Test Delivery" in settings.
