# Planner Management

The Planner is an internal-only scheduling tool designed for events that do not require guest interaction but consume the administrator's time.

## Planner Events vs. Appointments

- **Planner Events**: Created by the Admin. No guest email/link needed. Ideal for breaks, personal meetings, or travel.
- **Appointments**: Created by Guests via links. Contains guest contact data and link-tracking.

## Navigation & Discovery

The Planner features a specialized time-based filtering bar:

- **All**: The complete history and future of planner events.
- **Upcoming**: Events scheduled for the future.
- **Ongoing**: Events currently in progress based on the system clock.
- **Past**: Historical events.

## Creating & Editing Events

### `PlannerEventModal`

- **Title**: Mandatory name for the event.
- **Description**: Optional field for detailed notes or agendas.
- **Time Range**: Precise start and end times.
- **Validation**: Prevents overlapping events if the administrator chooses to maintain a strict schedule.

### `PlannerEventCard`

- Provides a visual summary of the event state (Ongoing events often have a distinct highlight).
- Includes quick Edit/Delete controls.

## Technical Architecture

### State Logic: `usePlannerPage`

- **Real-time Filtering**: Leverages the system's current time to categorize events into "Ongoing", "Past", or "Upcoming" without page reloads.
- **API Connectivity**: Maps directly to the `/api/planner` endpoints.
- **Form Synchronization**: Handles complex date-time object manipulations between the UI and the database-ready JSON format.

### Display Logic

Utilizes `baseui` components to ensure the UI remains consistent with the rest of the administrative dashboard, providing a premium, native-app feel.
