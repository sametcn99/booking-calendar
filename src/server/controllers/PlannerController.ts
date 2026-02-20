import { t } from "../i18n";
import { PlannerService } from "../services/PlannerService";
import type { ApiResponse } from "../types";

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return t("error.unexpected");
}

export class PlannerController {
	private plannerService: PlannerService;

	constructor() {
		this.plannerService = new PlannerService();
	}

	async getAllEvents(): Promise<{ status: number; body: ApiResponse }> {
		const events = await this.plannerService.getAllEvents();
		return { status: 200, body: { success: true, data: events } };
	}

	async createEvent(body: {
		title?: string;
		description?: string;
		start_at?: string;
		end_at?: string;
		color?: string;
	}): Promise<{ status: number; body: ApiResponse }> {
		try {
			const event = await this.plannerService.createEvent(body);
			return { status: 201, body: { success: true, data: event } };
		} catch (err: unknown) {
			return {
				status: 400,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}

	async updateEvent(
		id: number,
		body: {
			title?: string;
			description?: string;
			start_at?: string;
			end_at?: string;
			color?: string;
		},
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			const event = await this.plannerService.updateEvent(id, body);
			return { status: 200, body: { success: true, data: event } };
		} catch (err: unknown) {
			const message = getErrorMessage(err);
			const status = message === t("planner.notFound") ? 404 : 400;
			return { status, body: { success: false, error: message } };
		}
	}

	async deleteEvent(
		id: number,
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			await this.plannerService.deleteEvent(id);
			return { status: 200, body: { success: true } };
		} catch (err: unknown) {
			return {
				status: 404,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}
}
