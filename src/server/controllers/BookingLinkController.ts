import { t } from "../i18n";
import { SlotRepository } from "../repositories/SlotRepository";
import { BookingLinkService } from "../services/BookingLinkService";
import type { ApiResponse } from "../types";

export class BookingLinkController {
	private linkService: BookingLinkService;
	private slotRepo: SlotRepository;

	constructor() {
		this.linkService = new BookingLinkService();
		this.slotRepo = new SlotRepository();
	}

	async getAllLinks(): Promise<{ status: number; body: ApiResponse }> {
		const links = await this.linkService.getAllLinks();
		return { status: 200, body: { success: true, data: links } };
	}

	async createLink(body: {
		expires_in_days?: number;
		name?: string;
		slot_ids?: number[];
	}): Promise<{ status: number; body: ApiResponse }> {
		const slotIds = Array.isArray(body.slot_ids)
			? [...new Set(body.slot_ids.filter((value) => Number.isInteger(value)))]
			: [];

		if (slotIds.length === 0) {
			return {
				status: 400,
				body: { success: false, error: t("link.slotSelectionRequired") },
			};
		}

		const existingSlots = await this.slotRepo.findByIds(slotIds);
		if (existingSlots.length !== slotIds.length) {
			return {
				status: 400,
				body: { success: false, error: t("link.invalidSlots") },
			};
		}

		const result = await this.linkService.createLinkWithConfig({
			expiresInDays: body.expires_in_days || 7,
			name: body.name,
			allowedSlotIds: slotIds,
		});
		return { status: 201, body: { success: true, data: result } };
	}

	async validateToken(
		token: string,
	): Promise<{ status: number; body: ApiResponse }> {
		const link = await this.linkService.validateToken(token);
		if (!link) {
			return {
				status: 404,
				body: { success: false, error: t("link.invalidToken") },
			};
		}
		return { status: 200, body: { success: true, data: link } };
	}

	async deleteLink(id: number): Promise<{ status: number; body: ApiResponse }> {
		const deleted = await this.linkService.deleteLink(id);
		if (!deleted) {
			return {
				status: 404,
				body: { success: false, error: t("link.notFound") },
			};
		}
		return { status: 200, body: { success: true } };
	}
}
