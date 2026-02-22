# Appointments Management

The Appointments page is a robust management interface designed to track, filter, and moderate guest bookings.

![All Appointments](/screenshots/appointments/appointments_all.png)
_The administrative interface for managing the lifecycle of all guest bookings._

## Key Features

### Global Filtering & Search

The interface features a powerful, reusable filtering system (`ListFiltersBar`) that provides:

- **Full-Text Search**: Search by guest name, email, meeting place, or notes.
- **Date Range Selection**: Filter appointments within a specific start and end date.
- **Advanced Sorting**: Toggle between "Newest first" and "Oldest first" views.
- **Smart Status Filters**: Quick buttons for `Active`, `Canceled`, and `Past` statuses.
- **URL Persistence**: All active filters are automatically synchronized with the URL. This allows you to refresh the page or share a specific filtered view with other administrators.

### Visibility Highlights

- **`ListFiltersFeedback`**: Provides immediate feedback on how many results matched the current criteria vs. the total count.
- **Empty States**: Contextual messages and "Clear All" actions when no items match the active filters.

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

- **Filtering & Search**: Integrates the `useListFilters` hook to provide debounced search, date range filtering, and URL state management.
- **API Orchestration**: Handles the sequence of API calls to `api.getAppointments()`, `api.cancelAppointment()`, and `api.deleteAppointment()`.
- **Error Boundaries**: Captures and displays API failures via Toast notifications without breaking the UI.

### Data Model Integration

The page maps to the `Appointment` entity, ensuring that fields like `start_at`, `end_at`, and `canceled_at` are strictly validated and formatted for the user.
