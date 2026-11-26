import { t } from "../i18n";
import { getAuthenticatedUser } from "../middleware/auth";
import { handleAdminAppointmentRoutes } from "./admin/appointmentsRoutes";
import { handleAdminAuthRoutes } from "./admin/authRoutes";
import { handleAdminCommunityEventRoutes } from "./admin/communityRoutes";
import { handleAdminExportRoutes } from "./admin/exportRoutes";
import { handleAdminLinkRoutes } from "./admin/linksRoutes";
import { handleAdminPersonalTagRoutes } from "./admin/personalTagsRoutes";
import { handleAdminPlannerRoutes } from "./admin/plannerRoutes";
import { handleAdminPushRoutes } from "./admin/pushRoutes";
import { handleAdminSettingsRoutes } from "./admin/settingsRoutes";
import { handleAdminSlotRoutes } from "./admin/slotsRoutes";
import type { AdminRouteHandler, RouteHandlerArgs } from "./types";
import { jsonResponse } from "./utils";

const adminHandlers: AdminRouteHandler[] = [
	handleAdminAuthRoutes,
	handleAdminSlotRoutes,
	handleAdminAppointmentRoutes,
	handleAdminLinkRoutes,
	handleAdminSettingsRoutes,
	handleAdminPlannerRoutes,
	handleAdminPersonalTagRoutes,
	handleAdminPushRoutes,
	handleAdminExportRoutes,
	handleAdminCommunityEventRoutes,
];

export async function handleAdminRoutes(
	args: RouteHandlerArgs,
): Promise<Response | null> {
	const { pathname, corsHeaders } = args;

	if (!pathname.startsWith("/api/admin")) {
		return null;
	}

	const rawUser = await getAuthenticatedUser(args.request);
	if (!rawUser) {
		return jsonResponse(
			401,
			{ success: false, error: t("general.unauthorized") },
			corsHeaders,
		);
	}

	const user = { username: rawUser.username };

	for (const handler of adminHandlers) {
		const response = await handler({ ...args, user });
		if (response) {
			return response;
		}
	}

	return jsonResponse(
		404,
		{ success: false, error: t("general.notFound") },
		corsHeaders,
	);
}
