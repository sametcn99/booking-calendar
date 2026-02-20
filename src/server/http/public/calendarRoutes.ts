import { t } from "../../i18n";
import { SettingsRepository } from "../../repositories/SettingsRepository";
import type { PublicRouteHandler } from "../types";
import { jsonResponse } from "../utils";

export const handlePublicCalendarRoutes: PublicRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname !== "/api/public/calendar" || method !== "GET") {
		return null;
	}

	const settingsRepo = new SettingsRepository();
	const sharingEnabled = await settingsRepo.get("calendar_sharing");
	if (sharingEnabled !== "true") {
		return jsonResponse(
			403,
			{ success: false, error: t("general.forbidden") },
			corsHeaders,
		);
	}

	const [slotsResult, appointmentsResult, plannerResult, communityResult] =
		await Promise.all([
			args.slotController.getAllSlots(),
			args.appointmentController.getAllAppointments(),
			args.plannerController.getAllEvents(),
			args.communityEventController.getAllEvents(),
		]);
	return jsonResponse(
		200,
		{
			success: true,
			data: {
				slots: slotsResult.body.data,
				appointments: appointmentsResult.body.data,
				planner_events: plannerResult.body.data,
				community_events: communityResult.body.data,
			},
		},
		corsHeaders,
	);
};
