# Community Events System

Community Events are public gatherings or initiatives that rely on a crowdsourced approval model.

## The Approval Workflow

1. **Creation**: An administrator or user proposes an event.
2. **Pending State**: The event is created with `status: pending`. It is NOT yet visible on the public schedule.
3. **Crowd Approval**: A unique approval link is shared. Users enter their names and "Vouch" for the event.
4. **Activation**: Once the `required_approvals` threshold is met, the event status flips to `approved`.
5. **Visibility**: The event now appears on the **Public Calendar** and the **Dashboard**.

## Functional Components

### `CommunityEventsSection`

- **Event List**: Shows all current proposals and their live approval count.
- **Creation Form**: Dedicated interface to set event title, description, time, and the number of required approvals.

### `CommunityEventCard` (Internal)

- Displays current progress (e.g., "3 of 5 approvals").
- Provides the "Copy Approval Link" action for administrators.

## Technical Details

### `useCommunityEvents` Logic

- **Progress Tracking**: Calculates the percentage of approvals for visual progress bars.
- **Status Updates**: Monitors the transition from pending to approved.
- **API Mapping**: Uses `/api/community-events` for all CRUD operations.

### Approval Security

While designed for simplicity, the system tracks "already approved" status at the browser level (local storage) and optionally via IP/Session on the backend to prevent duplicate voting.
