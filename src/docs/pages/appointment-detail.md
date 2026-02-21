# Appointment Details (Guest View)

This is the private portal for a guest who has recently booked an appointment. It acts as their "digital receipt" and management hub.

## Information Transparency

The guest can view all data associated with their booking:

- **Full Name & Contact**: Verification of their input.
- **Time & Date**: Clearly formatted in their local timezone.
- **Meeting Place**: Instructions on where the meeting will occur (e.g., a physical address or a Zoom link).
- **Personal Note**: The context they provided during booking.

## Guest Actions

### 1. Cancellation Management

Guests have the autonomy to cancel their own appointments:

- **Confirmation Dialog**: A mandatory confirmation step prevents accidental cancellations.
- **System Notification**: Once canceled, the administrator is notified via Push/Email, and the slot is potentially freed up depending on system settings.

### 2. Sharing & Persistence

- **Public Link**: Each appointment has a persistent, unique URL.
- **Copy-to-Clipboard**: A mini-utility to quickly save or share the link for future reference.

## Technical Architecture

### Data Security: Slug-based Access

The page identifies the appointment via a unique `slugId` rather than an integer ID. This prevents unauthorized users from "guessing" other guests' appointment URLs.

### Dynamic States

- **Loading**: Fetching appointment data from `api.getPublicAppointment(slugId)`.
- **Already Canceled**: If the appointment is canceled, the interface transforms to show a status notice, and the "Cancel" button is removed.
- **Error Handling**: Displays clear messages if the appointment cannot be found or the link is invalid.

### Layout & Style

Uses a centered, card-based layout (`var(--color-bg-secondary)`) to provide a focused and professional experience for the guest.
