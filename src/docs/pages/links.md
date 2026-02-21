# Booking Links Management

Booking Links are the "Products" of your availability. This page allows administrators to bundle specific time slots into shareable, expiring URLs.

## Features & Configuration

### Link Creation (`CreateLinkModal`)

- **Name**: Internal identifier for the link (e.g., "Technical Interview - Samet").
- **Expiration**: Set a lifespan in days. Once expired, the link automatically becomes invalid.
- **Slot Association**: A multi-select interface to pick exactly which Availability Slots are accessible through this link.

### Link Lifecycle

- **Active**: Currently usable by guests.
- **Expired**: Reached its day-limit or manually deactivated.
- **Draft/Future**: Linked to slots that haven't started yet.

## User Interface Actions

| Action         | Description                                           | Component          |
| :------------- | :---------------------------------------------------- | :----------------- |
| **Copy URL**   | Copies the full public booking URL to the clipboard.  | `LinksListSection` |
| **Delete**     | Removes the link and invalidates the URL immediately. | `LinksListSection` |
| **Reset Form** | Clears the modal for a fresh link creation.           | `LinksHeader`      |

## Technical Implementation

### The Core Logic: `useLinksPage`

- **Dynamic URL Generation**: Combines the application `BASE_URL` with a unique UUID slug.
- **Persistence**: Links are stored with a many-to-many relationship to `Slots`.
- **Validation**: Backend logic ensures that when a link is queried, children slots are checked for availability and time-conflicts.

### Component Breakdown

- **LinksListSection**: A high-efficiency list view with quick-actions.
- **CreateLinkModal**: Features a specialized slot-picker with checkboxes and time-previews.
- **LinksHeader**: Main action bar with filtering and "Create" entry point.
