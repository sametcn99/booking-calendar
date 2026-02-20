import type { PublicRouteHandler } from "../types";
import {
	extractRequiredPathParam,
	invalidRouteResponse,
	jsonResponse,
	matchRoute,
	parseJsonBody,
} from "../utils";

export const handlePublicBookingRoutes: PublicRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (matchRoute(pathname, "/api/public/book/:slugId") && method === "GET") {
		const slugId = extractRequiredPathParam(
			pathname,
			"/api/public/book/:slugId",
		);
		if (!slugId) {
			return invalidRouteResponse(corsHeaders);
		}
		const result = await args.bookingLinkController.validateToken(slugId);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (
		matchRoute(pathname, "/api/public/book/:slugId/slots") &&
		method === "GET"
	) {
		const slugId = extractRequiredPathParam(
			pathname,
			"/api/public/book/:slugId/slots",
		);
		if (!slugId) {
			return invalidRouteResponse(corsHeaders);
		}

		const validationResult =
			await args.bookingLinkController.validateToken(slugId);
		if (validationResult.status !== 200) {
			return jsonResponse(
				validationResult.status,
				validationResult.body,
				corsHeaders,
			);
		}

		const validatedLink = validationResult.body.data as
			| { allowed_slot_ids?: number[] }
			| undefined;
		const result = await args.slotController.getAvailableSlots(
			validatedLink?.allowed_slot_ids || [],
		);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (
		matchRoute(pathname, "/api/public/book/:slugId/appointments") &&
		method === "POST"
	) {
		const slugId = extractRequiredPathParam(
			pathname,
			"/api/public/book/:slugId/appointments",
		);
		if (!slugId) {
			return invalidRouteResponse(corsHeaders);
		}
		const body = await parseJsonBody<{
			slot_id?: number;
			name?: string;
			email?: string;
			meeting_place?: string;
			note?: string;
			start_at?: string;
			end_at?: string;
		}>(args.request);
		const result = await args.appointmentController.createAppointment(
			slugId,
			body,
		);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	return null;
};
