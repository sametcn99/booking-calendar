import { t } from "../../i18n";
import type { AdminRouteHandler } from "../types";
import {
	extractPathParam,
	jsonResponse,
	matchRoute,
	parseJsonBody,
} from "../utils";

export const handleAdminCommunityEventRoutes: AdminRouteHandler = async (
	args,
) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname === "/api/admin/community-events" && method === "GET") {
		const result = await args.communityEventController.getAllEvents();
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (pathname === "/api/admin/community-events" && method === "POST") {
		const body = await parseJsonBody<{
			title?: string;
			description?: string;
			start_at?: string;
			end_at?: string;
			color?: string;
			required_approvals?: number;
		}>(args.request);
		const result = await args.communityEventController.createEvent(body);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (
		matchRoute(pathname, "/api/admin/community-events/:slugId") &&
		method === "DELETE"
	) {
		const slugId = extractPathParam(
			pathname,
			"/api/admin/community-events/:slugId",
		);
		if (!slugId) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRoute") },
				corsHeaders,
			);
		}
		const result = await args.communityEventController.deleteEvent(slugId);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	return null;
};
