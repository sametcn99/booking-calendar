import type { AdminRouteHandler } from "../types";
import {
	extractPathParam,
	jsonResponse,
	matchRoute,
	parseJsonBody,
} from "../utils";

export const handleAdminLinkRoutes: AdminRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname === "/api/admin/links" && method === "GET") {
		const result = await args.bookingLinkController.getAllLinks();
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (pathname === "/api/admin/links" && method === "POST") {
		const body = await parseJsonBody<{
			expires_in_days?: number;
			name?: string;
			slot_ids?: number[];
		}>(args.request);
		const result = await args.bookingLinkController.createLink(body);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (matchRoute(pathname, "/api/admin/links/:id") && method === "DELETE") {
		const id = Number(extractPathParam(pathname, "/api/admin/links/:id"));
		const result = await args.bookingLinkController.deleteLink(id);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	return null;
};
