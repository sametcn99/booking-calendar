# Webhook Notifications

Booking Calendar supports both outbound webhook notifications and inbound signed webhook commands. This allows you to mirror events to external systems and let trusted automations call selected Booking Calendar actions.

## Configuration

Navigate to **Settings -> Webhook Notifications** in the admin panel to:

1. Enable/Disable outbound webhook delivery.
2. Set your outbound **Webhook URL** (must be `https` in production).
3. Set an outbound **Signing Secret** (minimum 16 characters).
4. Enable inbound webhook commands.
5. Set an inbound **Signing Secret** and allowed scopes.
6. Send a test event to verify outbound connectivity.

## Endpoints

- Outbound events: configured destination URL in settings
- Inbound commands: `/api/public/webhooks/inbound`

## Shared Security Headers

Outbound deliveries and inbound signed commands use the following headers:

| Header                         | Description                              |
| ------------------------------ | ---------------------------------------- |
| `X-BookingCalendar-Signature`  | HMAC SHA-256 signature (`sha256=<hmac>`) |
| `X-BookingCalendar-Timestamp`  | Unix timestamp of the event              |
| `X-BookingCalendar-Request-Id` | Unique UUID for replay protection        |

Outbound deliveries also include:

| Header                          | Description                                     |
| ------------------------------- | ----------------------------------------------- |
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

## Inbound Commands

Inbound commands are sent as a signed `POST` request to `/api/public/webhooks/inbound`.

### Request Body

```json
{
  "action": "admin.community-events.approve",
  "params": {
    "slugId": "community-event-slug"
  },
  "data": {
    "full_name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}
```

### Scope Model

Inbound commands are restricted by the scopes selected in the admin settings. Each scope enables a small set of actions.

Current scopes:

- `admin.slots`
- `admin.appointments`
- `admin.links`
- `admin.planner`
- `admin.community-events`
- `public.booking`
- `public.appointment`
- `public.community`

### Approval-Related Commands

- `admin.appointments.approve`
- `admin.appointments.reject`
- `admin.appointments.cancel`
- `admin.community-events.approve`
- `public.community.approve`

### New Admin Community Approval Command

`admin.community-events.approve` allows trusted automation to submit an approval entry for a community event through the admin webhook scope.

Required parameters:

- `params.slugId`
- `data.full_name`

Optional fields:

- `data.email`

This command uses the same validation and activation logic as the existing community approval flow. If the approval reaches the required threshold, the community event becomes active and the normal notifications/webhooks continue to fire.

## Supported Outbound Events

- `appointment.created`: Triggered when a new booking is requested.
- `appointment.cancelled`: Triggered when an appointment is cancelled by admin or guest.
- `slot.created`: Triggered when a new availability slot is added.
- `test`: Sent when you click "Test Delivery" in settings.
