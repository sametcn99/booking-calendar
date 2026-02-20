import { t } from "../i18n";
import { CommunityEventService } from "../services/CommunityEventService";
import type { ApiResponse } from "../types";

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return t("error.unexpected");
}

export class CommunityEventController {
	private service: CommunityEventService;

	constructor() {
		this.service = new CommunityEventService();
	}

	async getAllEvents(): Promise<{ status: number; body: ApiResponse }> {
		const events = await this.service.getAllEvents();
		return { status: 200, body: { success: true, data: events } };
	}

	async createEvent(body: {
		title?: string;
		description?: string;
		start_at?: string;
		end_at?: string;
		color?: string;
		required_approvals?: number;
	}): Promise<{ status: number; body: ApiResponse }> {
		try {
			const event = await this.service.createEvent(body);
			return { status: 201, body: { success: true, data: event } };
		} catch (err: unknown) {
			return {
				status: 400,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}

	async getByShareToken(
		token: string,
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			const event = await this.service.getByShareToken(token);
			return { status: 200, body: { success: true, data: event } };
		} catch (err: unknown) {
			return {
				status: 404,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}

	async approve(
		token: string,
		body: { email?: string },
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			const event = await this.service.approve(token, body.email);
			return { status: 200, body: { success: true, data: event } };
		} catch (err: unknown) {
			return {
				status: 400,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}

	async deleteEvent(
		id: number,
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			await this.service.deleteEvent(id);
			return { status: 200, body: { success: true } };
		} catch (err: unknown) {
			return {
				status: 404,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}

	async cancelExpiredPending(): Promise<{
		status: number;
		body: ApiResponse;
	}> {
		const count = await this.service.cancelExpiredPending();
		return { status: 200, body: { success: true, data: { canceled: count } } };
	}
}
