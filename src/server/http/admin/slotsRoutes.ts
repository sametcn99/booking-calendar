import type { AdminRouteHandler } from "../types";
import {
	extractPathParam,
	jsonResponse,
	matchRoute,
	parseJsonBody,
} from "../utils";

export const handleAdminSlotRoutes: AdminRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname === "/api/admin/slots" && method === "GET") {
		const result = await args.slotController.getAllSlots();
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (pathname === "/api/admin/slots" && method === "POST") {
		const body = await parseJsonBody<{
			start_at?: string;
			end_at?: string;
		}>(args.request);
		const result = await args.slotController.createSlot(body);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (matchRoute(pathname, "/api/admin/slots/:id") && method === "PATCH") {
		const id = Number(extractPathParam(pathname, "/api/admin/slots/:id"));
		const body = await parseJsonBody<{ is_active?: boolean }>(args.request);
		const result = await args.slotController.toggleSlotActive(id, body);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (matchRoute(pathname, "/api/admin/slots/:id/name") && method === "PATCH") {
		const id = Number(extractPathParam(pathname, "/api/admin/slots/:id/name"));
		const body = await parseJsonBody<{ name?: string }>(args.request);
		const result = await args.slotController.renameSlot(id, body);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (matchRoute(pathname, "/api/admin/slots/:id") && method === "DELETE") {
		const id = Number(extractPathParam(pathname, "/api/admin/slots/:id"));
		const result = await args.slotController.deleteSlot(id);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	return null;
};
