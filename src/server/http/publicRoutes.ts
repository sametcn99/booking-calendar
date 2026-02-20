import { handlePublicAppointmentRoutes } from "./public/appointmentRoutes";
import { handlePublicAuthAndSettingsRoutes } from "./public/authAndSettingsRoutes";
import { handlePublicBookingRoutes } from "./public/bookingRoutes";
import { handlePublicCalendarRoutes } from "./public/calendarRoutes";
import { handlePublicCommunityRoutes } from "./public/communityRoutes";
import { handlePublicDocsRoutes } from "./public/docsRoutes";
import type { PublicRouteHandler, RouteHandlerArgs } from "./types";

const publicHandlers: PublicRouteHandler[] = [
	handlePublicDocsRoutes,
	handlePublicAuthAndSettingsRoutes,
	handlePublicBookingRoutes,
	handlePublicCalendarRoutes,
	handlePublicAppointmentRoutes,
	handlePublicCommunityRoutes,
];

export async function handlePublicRoutes(
	args: RouteHandlerArgs,
): Promise<Response | null> {
	for (const handler of publicHandlers) {
		const response = await handler(args);
		if (response) {
			return response;
		}
	}

	return null;
}
