import type { AdminRouteHandler } from "../types";
import {
	extractPathParam,
	jsonResponse,
	matchRoute,
	parseJsonBody,
} from "../utils";

export const handleAdminPlannerRoutes: AdminRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname === "/api/admin/planner" && method === "GET") {
		const result = await args.plannerController.getAllEvents();
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (pathname === "/api/admin/planner" && method === "POST") {
		const body = await parseJsonBody<{
			title?: string;
			description?: string;
			start_at?: string;
			end_at?: string;
			color?: string;
		}>(args.request);
		const result = await args.plannerController.createEvent(body);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (matchRoute(pathname, "/api/admin/planner/:id") && method === "PATCH") {
		const id = Number(extractPathParam(pathname, "/api/admin/planner/:id"));
		const body = await parseJsonBody<{
			title?: string;
			description?: string;
			start_at?: string;
			end_at?: string;
			color?: string;
		}>(args.request);
		const result = await args.plannerController.updateEvent(id, body);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (matchRoute(pathname, "/api/admin/planner/:id") && method === "DELETE") {
		const id = Number(extractPathParam(pathname, "/api/admin/planner/:id"));
		const result = await args.plannerController.deleteEvent(id);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	return null;
};
