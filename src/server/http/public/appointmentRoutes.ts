import { t } from "../../i18n";
import type { PublicRouteHandler } from "../types";
import {
	extractRequiredPathParam,
	invalidRouteResponse,
	jsonResponse,
	matchRoute,
} from "../utils";

export const handlePublicAppointmentRoutes: PublicRouteHandler = async (
	args,
) => {
	const { pathname, method, corsHeaders } = args;

	if (
		matchRoute(pathname, "/api/public/appointment/:slugId") &&
		method === "GET"
	) {
		const slugId = extractRequiredPathParam(
			pathname,
			"/api/public/appointment/:slugId",
		);
		if (!slugId) {
			return invalidRouteResponse(corsHeaders);
		}

		const result =
			await args.appointmentController.getAppointmentBySlugId(slugId);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (
		matchRoute(pathname, "/api/public/appointment/:slugId/cancel") &&
		method === "POST"
	) {
		const slugId = extractRequiredPathParam(
			pathname,
			"/api/public/appointment/:slugId/cancel",
		);
		if (!slugId) {
			return invalidRouteResponse(corsHeaders);
		}

		const result =
			await args.appointmentController.cancelAppointmentBySlugId(slugId);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (
		matchRoute(pathname, "/api/public/appointments/cancel/:slugId") &&
		method === "GET"
	) {
		const slugId = extractRequiredPathParam(
			pathname,
			"/api/public/appointments/cancel/:slugId",
		);
		if (!slugId) {
			return invalidRouteResponse(corsHeaders);
		}

		const result =
			await args.appointmentController.cancelAppointmentBySlugId(slugId);
		if (result.status === 200) {
			return new Response(
				`<html><body style='font-family:Arial,sans-serif;padding:24px;background:#0a0a0a;color:#e0d6f0;'><h2>${t("cancelPage.successTitle")}</h2><p>${t("cancelPage.successMessage")}</p></body></html>`,
				{
					status: 200,
					headers: { "Content-Type": "text/html", ...corsHeaders },
				},
			);
		}

		return new Response(
			`<html><body style='font-family:Arial,sans-serif;padding:24px;background:#0a0a0a;color:#e0d6f0;'><h2>${t("cancelPage.failTitle")}</h2><p>${String(result.body.error || t("cancelPage.failDefault"))}</p></body></html>`,
			{
				status: result.status,
				headers: { "Content-Type": "text/html", ...corsHeaders },
			},
		);
	}

	return null;
};
