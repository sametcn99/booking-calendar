# Booking Page (Public)

This is the high-conversion landing page where external guests interact with the booking system. It is optimized for speed, clarity, and mobile responsiveness.

## Entry Logic & Validation

The page is driven by a `slugId` parameter in the URL:

1. **Fetching Configuration**: The system queries the backend to find the specific "Link" associated with the slug.
2. **Availability Check**: Only slots linked to this specific URL are displayed.
3. **Validation States**:
   - **Loading**: A sleek skeleton screen informs the user data is being fetched.
   - **Invalid/Expired**: If the link is deleted or past its expiry date, a refined "Invalid State" component is shown.

## The Booking Workflow

### Phase 1: Slot Selection (`BookingSlotsSection`)

- **Date Picker**: An intuitive calendar subset showing only days with available slots.
- **Interval Mapping**: When a slot is selected, the system calculates and displays "busy" intervals to prevent overbooking.
- **Time Selection**: Guests pick a specific start and end time within the administrator's defined slot.

### Phase 2: Guest Information (`BookingFormSection`)

- **Identity**: Name and Email (Validated for format).
- **Logistics**: Meeting Place (Physical or Virtual).
- **Communication**: A "Note" field for special requests or context.

### Phase 3: Confirmation & Tokenization

Upon successful submission:

1. The API creates a new `Appointment` record.
2. A unique `createdAppointmentToken` is generated.
3. The guest is automatically redirected to their private **Appointment Detail** page.

## Technical Details

### `useBookingPage` Hook Logic

- **Slug Verification**: Executes `api.getLink(slugId)`.
- **Slot Fetching**: Pulls associated slots and their existing appointment density.
- **Form State**: Manages controlled inputs and submission loading states.

### UX Features

- **Responsive Layout**: Adapts perfectly from desktop to narrow mobile screens.
- **Toast Feedback**: Errors (like "Slot already taken") are handled gracefully with Toast messages.
- **Localization**: Every label, placeholder, and date format automatically matches the user's browser language.
