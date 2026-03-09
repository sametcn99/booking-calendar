import { t } from "../../i18n";
import {
	type WebhookInboundScope,
	WebhookService,
} from "../../services/WebhookService";
import type { AdminRouteArgs, PublicRouteHandler } from "../types";
import { jsonResponse } from "../utils";

interface WebhookCommandRequest {
	action?: string;
	params?: Record<string, unknown>;
	data?: unknown;
}

function getStringParam(
	params: Record<string, unknown> | undefined,
	key: string,
): string | null {
	const value = params?.[key];
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function getNumberParam(
	params: Record<string, unknown> | undefined,
	key: string,
): number | null {
	const value = params?.[key];
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim().length > 0) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function invalidWebhookCommandResponse(corsHeaders: Record<string, string>) {
	return jsonResponse(
		400,
		{ success: false, error: t("general.invalidRequest") },
		corsHeaders,
	);
}

async function executeAdminWebhookCommand(
	args: AdminRouteArgs,
	command: WebhookCommandRequest,
): Promise<Response> {
	const { corsHeaders } = args;

	switch (command.action) {
		case "admin.slots.list": {
			const result = await args.slotController.getAllSlots();
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.slots.create": {
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as {
							name?: string;
							start_at?: string;
							end_at?: string;
						})
					: {};
			const result = await args.slotController.createSlot(body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.slots.toggle": {
			const id = getNumberParam(command.params, "id");
			if (!id) return invalidWebhookCommandResponse(corsHeaders);
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as { is_active?: boolean })
					: {};
			const result = await args.slotController.toggleSlotActive(id, body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.slots.rename": {
			const id = getNumberParam(command.params, "id");
			if (!id) return invalidWebhookCommandResponse(corsHeaders);
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as { name?: string })
					: {};
			const result = await args.slotController.renameSlot(id, body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.slots.update": {
			const id = getNumberParam(command.params, "id");
			if (!id) return invalidWebhookCommandResponse(corsHeaders);
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as {
							name?: string;
							start_at?: string;
							end_at?: string;
						})
					: {};
			const result = await args.slotController.updateSlot(id, body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.slots.delete": {
			const id = getNumberParam(command.params, "id");
			if (!id) return invalidWebhookCommandResponse(corsHeaders);
			const result = await args.slotController.deleteSlot(id);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.appointments.list": {
			const status = getStringParam(command.params, "status") as
				| "pending"
				| "approved"
				| "rejected"
				| "all"
				| null;
			const result = await args.appointmentController.getAllAppointments({
				status: status ?? undefined,
			});
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.appointments.approve": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const result =
				await args.appointmentController.approveAppointment(slugId);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.appointments.reject": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const result = await args.appointmentController.rejectAppointment(slugId);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.appointments.cancel": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const result = await args.appointmentController.cancelAppointment(slugId);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.appointments.delete": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const result = await args.appointmentController.deleteAppointment(slugId);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.links.list": {
			const result = await args.bookingLinkController.getAllLinks();
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.links.create": {
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as {
							expires_in_days?: number;
							name?: string;
							slot_ids?: number[];
							requires_approval?: boolean;
						})
					: {};
			const result = await args.bookingLinkController.createLink(body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.links.update": {
			const id = getNumberParam(command.params, "id");
			if (!id) return invalidWebhookCommandResponse(corsHeaders);
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as {
							name?: string;
							expires_at?: string;
							slot_ids?: number[];
							requires_approval?: boolean;
						})
					: {};
			const result = await args.bookingLinkController.updateLink(id, body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.links.delete": {
			const id = getNumberParam(command.params, "id");
			if (!id) return invalidWebhookCommandResponse(corsHeaders);
			const result = await args.bookingLinkController.deleteLink(id);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.planner.list": {
			const result = await args.plannerController.getAllEvents();
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.planner.create": {
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as {
							title?: string;
							description?: string;
							start_at?: string;
							end_at?: string;
							color?: string;
						})
					: {};
			const result = await args.plannerController.createEvent(body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.planner.update": {
			const id = getNumberParam(command.params, "id");
			if (!id) return invalidWebhookCommandResponse(corsHeaders);
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as {
							title?: string;
							description?: string;
							start_at?: string;
							end_at?: string;
							color?: string;
						})
					: {};
			const result = await args.plannerController.updateEvent(id, body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.planner.delete": {
			const id = getNumberParam(command.params, "id");
			if (!id) return invalidWebhookCommandResponse(corsHeaders);
			const result = await args.plannerController.deleteEvent(id);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.community-events.list": {
			const result = await args.communityEventController.getAllEvents();
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.community-events.create": {
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as {
							title?: string;
							description?: string;
							start_at?: string;
							end_at?: string;
							color?: string;
							required_approvals?: number;
						})
					: {};
			const result = await args.communityEventController.createEvent(body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "admin.community-events.delete": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const result = await args.communityEventController.deleteEvent(slugId);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		default:
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
	}
}

async function executePublicWebhookCommand(
	args: Parameters<PublicRouteHandler>[0],
	command: WebhookCommandRequest,
): Promise<Response> {
	const { corsHeaders } = args;

	switch (command.action) {
		case "public.booking.validate": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const result = await args.bookingLinkController.validateToken(slugId);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "public.booking.slots": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
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
		case "public.booking.appointments.create": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as {
							slot_id?: number;
							name?: string;
							email?: string;
							meeting_place?: string;
							note?: string;
							start_at?: string;
							end_at?: string;
						})
					: {};
			const result = await args.appointmentController.createAppointment(
				slugId,
				body,
			);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "public.appointment.get": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const result =
				await args.appointmentController.getAppointmentBySlugId(slugId);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "public.appointment.cancel": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const result =
				await args.appointmentController.cancelAppointmentBySlugId(slugId);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "public.community.get": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const result = await args.communityEventController.getBySlugId(slugId);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		case "public.community.approve": {
			const slugId = getStringParam(command.params, "slugId");
			if (!slugId) return invalidWebhookCommandResponse(corsHeaders);
			const body =
				typeof command.data === "object" && command.data !== null
					? (command.data as { full_name?: string; email?: string })
					: {};
			const result = await args.communityEventController.approve(slugId, body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}
		default:
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
	}
}

function isAdminScope(scope: WebhookInboundScope): boolean {
	return scope.startsWith("admin.");
}

export const handlePublicWebhookRoutes: PublicRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;
	if (pathname !== "/api/public/webhooks/inbound" || method !== "POST") {
		return null;
	}

	const webhookService = new WebhookService();
	const rawBody = await args.request.text();

	let command: WebhookCommandRequest;
	try {
		command = rawBody
			? (JSON.parse(rawBody) as WebhookCommandRequest)
			: ({} as WebhookCommandRequest);
	} catch {
		return invalidWebhookCommandResponse(corsHeaders);
	}

	if (
		!command ||
		typeof command.action !== "string" ||
		!command.action.trim()
	) {
		return invalidWebhookCommandResponse(corsHeaders);
	}

	let inboundSettings: { scopes: WebhookInboundScope[] };
	try {
		inboundSettings = await webhookService.verifyInboundRequest(
			args.request.headers,
			rawBody,
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : t("general.forbidden");
		const status =
			message === t("general.webhookInboundDisabled")
				? 403
				: message === t("general.invalidWebhookSignature") ||
						message === t("general.webhookTimestampExpired") ||
						message === t("general.webhookReplayDetected")
					? 401
					: 403;
		return jsonResponse(
			status,
			{ success: false, error: message },
			corsHeaders,
		);
	}

	if (!webhookService.isActionAllowed(command.action, inboundSettings.scopes)) {
		return jsonResponse(
			403,
			{ success: false, error: t("general.webhookActionNotAllowed") },
			corsHeaders,
		);
	}

	if (inboundSettings.scopes.some((scope) => isAdminScope(scope))) {
		if (command.action.startsWith("admin.")) {
			return executeAdminWebhookCommand(
				{ ...args, user: { username: "webhook" } },
				command,
			);
		}
	}

	return executePublicWebhookCommand(args, command);
};
