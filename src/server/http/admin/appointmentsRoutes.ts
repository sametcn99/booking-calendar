import { t } from "../../i18n";
import type { AdminRouteHandler } from "../types";
import { extractPathParam, jsonResponse, matchRoute } from "../utils";

export const handleAdminAppointmentRoutes: AdminRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname === "/api/admin/appointments" && method === "GET") {
		const result = await args.appointmentController.getAllAppointments();
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (
		matchRoute(pathname, "/api/admin/appointments/:slugId") &&
		method === "DELETE"
	) {
		const slugId = extractPathParam(
			pathname,
			"/api/admin/appointments/:slugId",
		);
		if (!slugId) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRoute") },
				corsHeaders,
			);
		}
		const result = await args.appointmentController.deleteAppointment(slugId);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (
		matchRoute(pathname, "/api/admin/appointments/:slugId/cancel") &&
		method === "PATCH"
	) {
		const slugId = extractPathParam(
			pathname,
			"/api/admin/appointments/:slugId/cancel",
		);
		if (!slugId) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRoute") },
				corsHeaders,
			);
		}
		const result = await args.appointmentController.cancelAppointment(slugId);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	return null;
};
