# Features

Booking Calendar is packed with features designed to make appointment management seamless and secure.

## 🛠 Admin Panel

A powerful dashboard to manage your availability and bookings.

- **Dynamic Slots:** Create and manage booking slots with customizable durations.
- **Appointment Management:** View, approve, reject, or cancel appointments.
- **Admin Approval:** Optional moderation layer for guest-created bookings.
- **Shareable Links:** Generate persistent links for your booking page.

### Personal tags

Add personal tags to appointments, events, and planner entries from a list row, item details, or the dashboard calendar. Select one or more tags to match items carrying any selected tag, or use **Show only tagged**. Select several rows to apply or remove a tag in one operation.

In **Manage tags**, rename tags, choose a color, check usage counts, and delete tags. Deleting a tag removes it from every assigned item. Tags are scoped to the signed-in administrator and excluded from public links, shared calendars, and calendar exports.

## 📅 Public Booking Page

A clean, mobile-optimized page for your guests to book appointments.

- **No Account Required:** Guests can book without creating an account.
- **Double-Booking Prevention:** Real-time slot availability checks.
- **Instant Confirmation:** Automated email confirmations for guests.

## 🔔 Notifications

Stay informed with multiple notification channels.

- **Email:** Automated notifications for bookings, cancellations, and reminders.
- **ICS Attachments:** Seamless calendar integration with `.ics` files.
- **Push Notifications:** Native browser push alerts for new appointments.
- **Webhooks:** Mirror events to external services (e.g., Discord, Slack).

## 📱 Progressive Web App (PWA)

Install Booking Calendar on your devices for a native-like experience.

- **Offline Access:** Basic UI available offline.
- **Home Screen Icon:** Quick access from your phone or desktop.
- **Fast Performance:** Optimized for mobile browsing.

## 🔒 Security & Privacy

- **Self-Hosted:** You own your data.
- **Rate Limiting:** IP-based protection against spam.
- **HMAC Signatures:** Secure webhook delivery verification.
- **Token-based Actions:** Secure cancellation links without requiring login.

## 📊 Integrations

- **CalDAV Sync:** Read busy periods from your CalDAV calendars without exposing event details and write approved bookings back to a selected calendar.
- **ICS Export:** Export your calendar for integration with Google Calendar, Apple Calendar, or Outlook.
- **Webhook Events:** Trigger external workflows on specific booking events.
