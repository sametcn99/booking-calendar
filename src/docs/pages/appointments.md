# Appointments Management

The Appointments page is a robust management interface designed to track, filter, and moderate guest bookings.

![All Appointments](/screenshots/appointments/appointments_all.png)
_The administrative interface for managing the lifecycle of all guest bookings._

## Key Features

### Advanced Filtering

The interface provides a tailored filtering system (`AppointmentsFilterSection`) to manage large volumes of data:

- **Upcoming**: Focus on future commitments.
- **Past**: Review history and completion rates.
- **Canceled**: Audit trail of abandoned or revoked bookings.

### List Navigation

Appointments are displayed in a clean, detailed list (`AppointmentsListSection`):

- **Guest Profiles**: Displays name, email, and any custom notes.
- **Automatic Formatting**: Dates are localized on-the-fly based on the guest's or admin's locale.
- **Direct Actions**: Contextual buttons for cancellation and deletion.

## Administrative Actions

| Action           | Impact                                                                           | Workflow                                         |
| :--------------- | :------------------------------------------------------------------------------- | :----------------------------------------------- |
| **Cancel**       | Marks the appointment as `canceled`. Sends an automated email/push to the guest. | Click "Cancel" → Confirm in Dialog → API Update. |
| **Delete**       | Permanently removes the record from the SQLite database.                         | Click "Delete" → Permanent removal.              |
| **View Details** | Opens a deep-dive view of the specific appointment.                              | Click the appointment row.                       |

## Technical Architecture

### The `useAppointmentsPage` Hook

This hook manages the complex state of the appointment lifecycle:

- **Filtering Logic**: Implements client-side filtering to ensure near-instant list updates.
- **API Orchestration**: Handles the sequence of API calls to `api.getAppointments()`, `api.cancelAppointment()`, and `api.deleteAppointment()`.
- **Error Boundaries**: Captures and displays API failures via Toast notifications without breaking the UI.

### Data Model Integration

The page maps to the `Appointment` entity, ensuring that fields like `start_at`, `end_at`, and `canceled_at` are strictly validated and formatted for the user.
