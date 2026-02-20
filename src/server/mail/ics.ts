import type { AppointmentWithSlot } from "../types";

export function generateICS(appointment: AppointmentWithSlot): string {
	const startDate = new Date(appointment.start_at);
	const endDate = new Date(appointment.end_at);

	const formatDate = (d: Date): string => {
		return d
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\.\d{3}/, "");
	};

	const uid = `${appointment.id}-${Date.now()}@booking-calendar`;
	const now = formatDate(new Date());

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Booking Calendar//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:REQUEST",
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${now}`,
		`DTSTART:${formatDate(startDate)}`,
		`DTEND:${formatDate(endDate)}`,
		`SUMMARY:Appointment with ${appointment.name}`,
		`DESCRIPTION:${[
			appointment.meeting_place
				? `Meeting place: ${appointment.meeting_place}`
				: null,
			appointment.note ? appointment.note : "No notes",
		]
			.filter(Boolean)
			.join("\\n")
			.replace(/\n/g, "\\n")}`,
		`ORGANIZER:mailto:${appointment.email || "no-reply@example.com"}`,
		"STATUS:CONFIRMED",
		"END:VEVENT",
		"END:VCALENDAR",
	].join("\r\n");
}
