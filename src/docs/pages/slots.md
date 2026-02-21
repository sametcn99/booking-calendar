# Availability Slots Management

Slots are the foundational "Time Inventory" of the Booking Calendar system. This page is where administrators manufacture the time they want to sell or share.

## The Concept of a "Slot"

A slot is not an appointment; it is a **container of potential**.

- **Duration**: Can span 30 minutes or 12 hours.
- **Capacity**: Multiple guests can potentially book into a single slot if the duration allows.
- **Ownership**: Can be assigned to specific booking links.

## Administrative Controls

### Creating a Slot (`CreateSlotModal`)

- **Time Range**: Select specific start and end dates/times.
- **Naming**: Optional descriptive name (e.g., "Monday Office Hours").
- **Validation**: Ensures start time is before end time and not in the distant past.

### Managing the List (`SlotsListSection`)

- **Toggle Status**: Instantly enable/disable a slot. Disabled slots disappear from all public booking pages.
- **Renaming**: Edit the internal name without affecting the time range.
- **Deletion**: Remove the slot (Note: This does not delete existing appointments made within that time frame).

## Filtering & Search

- **Active**: Slots that are currently enabled and in the future.
- **Inactive**: Manually disabled slots.
- **Past**: Archived slots that have already occurred.

## Technical Workflow

### Data Fetching

Managed by `useSlotsPage`, which interacts with `/api/slots`:

- **Real-time Status Sync**: Updates the list state immediately upon toggle or rename.
- **Date Localization**: Uses the administrator's locale to display readable time ranges.

### Integration

Slots are the primary resource used by:

1. **Links Page**: To decide which availability is tied to which URL.
2. **Booking Page**: To render the selectable options for guests.
3. **Dashboard**: To show upcoming availability on the main calendar.
