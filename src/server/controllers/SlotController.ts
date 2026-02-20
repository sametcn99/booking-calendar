import { t } from "../i18n";
import { SlotService } from "../services/SlotService";
import type { ApiResponse } from "../types";

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return t("error.unexpected");
}

export class SlotController {
	private slotService: SlotService;

	constructor() {
		this.slotService = new SlotService();
	}

	async getAllSlots(): Promise<{ status: number; body: ApiResponse }> {
		const slots = await this.slotService.getAllSlots();
		return { status: 200, body: { success: true, data: slots } };
	}

	async getAvailableSlots(
		slotIds?: number[],
	): Promise<{ status: number; body: ApiResponse }> {
		const slots =
			await this.slotService.getAvailableSlotsWithBusyIntervals(slotIds);
		return { status: 200, body: { success: true, data: slots } };
	}

	async createSlot(body: {
		name?: string;
		start_at?: string;
		end_at?: string;
	}): Promise<{ status: number; body: ApiResponse }> {
		if (!body.name || !body.start_at || !body.end_at) {
			return {
				status: 400,
				body: { success: false, error: t("slot.nameAndDatesRequired") },
			};
		}

		try {
			const slot = await this.slotService.createSlot({
				name: body.name,
				start_at: body.start_at,
				end_at: body.end_at,
			});
			return { status: 201, body: { success: true, data: slot } };
		} catch (err: unknown) {
			return {
				status: 400,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}

	async toggleSlotActive(
		id: number,
		body: { is_active?: boolean },
	): Promise<{ status: number; body: ApiResponse }> {
		if (body.is_active === undefined) {
			return {
				status: 400,
				body: { success: false, error: t("general.isActiveRequired") },
			};
		}

		try {
			const slot = await this.slotService.toggleSlotActive(id, body.is_active);
			return { status: 200, body: { success: true, data: slot } };
		} catch (err: unknown) {
			return {
				status: 404,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}

	async deleteSlot(id: number): Promise<{ status: number; body: ApiResponse }> {
		try {
			await this.slotService.deleteSlot(id);
			return { status: 200, body: { success: true } };
		} catch (err: unknown) {
			return {
				status: 404,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}

	async renameSlot(
		id: number,
		body: { name?: string },
	): Promise<{ status: number; body: ApiResponse }> {
		if (!body.name) {
			return {
				status: 400,
				body: { success: false, error: t("slot.nameRequired") },
			};
		}

		try {
			const slot = await this.slotService.renameSlot(id, body.name);
			return { status: 200, body: { success: true, data: slot } };
		} catch (err: unknown) {
			const message = getErrorMessage(err);
			const status = message === t("slot.notFound") ? 404 : 400;
			return {
				status,
				body: { success: false, error: message },
			};
		}
	}
}
