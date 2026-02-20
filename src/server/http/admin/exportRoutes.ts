import type { AdminRouteHandler } from "../types";

export const handleAdminExportRoutes: AdminRouteHandler = async (args) => {
	const { pathname, method, corsHeaders, url } = args;

	if (pathname !== "/api/admin/export/ics" || method !== "GET") {
		return null;
	}

	const from = url.searchParams.get("from");
	const to = url.searchParams.get("to");

	const [appointmentsResult, plannerResult] = await Promise.all([
		args.appointmentController.getAllAppointments(),
		args.plannerController.getAllEvents(),
	]);

	const appointments = (appointmentsResult.body.data || []) as Array<{
		id: number;
		name: string;
		email?: string | null;
		meeting_place?: string | null;
		note?: string | null;
		start_at: string;
		end_at: string;
		canceled_at?: string | null;
	}>;
	const plannerEvents = (plannerResult.body.data || []) as Array<{
		id: number;
		title: string;
		description?: string | null;
		start_at: string;
		end_at: string;
	}>;

	const formatDate = (date: Date): string =>
		date
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\.\d{3}/, "");

	const now = formatDate(new Date());
	const events: string[] = [];

	for (const appointment of appointments) {
		if (appointment.canceled_at) continue;
		const start = new Date(appointment.start_at);
		const end = new Date(appointment.end_at);
		if (from && start < new Date(from)) continue;
		if (to && end > new Date(to)) continue;
		events.push(
			[
				"BEGIN:VEVENT",
				`UID:appt-${appointment.id}@booking-calendar`,
				`DTSTAMP:${now}`,
				`DTSTART:${formatDate(start)}`,
				`DTEND:${formatDate(end)}`,
				`SUMMARY:${appointment.name}`,
				`DESCRIPTION:${[
					appointment.meeting_place
						? `Meeting place: ${appointment.meeting_place}`
						: null,
					appointment.note || null,
				]
					.filter(Boolean)
					.join("\\n")}`,
				"STATUS:CONFIRMED",
				"END:VEVENT",
			].join("\r\n"),
		);
	}

	for (const plannerEvent of plannerEvents) {
		const start = new Date(plannerEvent.start_at);
		const end = new Date(plannerEvent.end_at);
		if (from && start < new Date(from)) continue;
		if (to && end > new Date(to)) continue;
		events.push(
			[
				"BEGIN:VEVENT",
				`UID:planner-${plannerEvent.id}@booking-calendar`,
				`DTSTAMP:${now}`,
				`DTSTART:${formatDate(start)}`,
				`DTEND:${formatDate(end)}`,
				`SUMMARY:${plannerEvent.title}`,
				plannerEvent.description
					? `DESCRIPTION:${plannerEvent.description.replace(/\n/g, "\\n")}`
					: "",
				"STATUS:CONFIRMED",
				"END:VEVENT",
			]
				.filter(Boolean)
				.join("\r\n"),
		);
	}

	const icsContent = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Booking Calendar//EN",
		"CALSCALE:GREGORIAN",
		...events,
		"END:VCALENDAR",
	].join("\r\n");

	return new Response(icsContent, {
		status: 200,
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": "attachment; filename=calendar-export.ics",
			...corsHeaders,
		},
	});
};
