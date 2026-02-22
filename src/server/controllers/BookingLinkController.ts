import { t } from "../i18n";
import { SlotRepository } from "../repositories/SlotRepository";
import { BookingLinkService } from "../services/BookingLinkService";
import type { ApiResponse } from "../types";

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return t("error.unexpected");
}

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
		requires_approval?: boolean;
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

		try {
			const result = await this.linkService.createLinkWithConfig({
				expiresInDays: body.expires_in_days,
				name: body.name,
				allowedSlotIds: slotIds,
				requiresApproval: body.requires_approval,
			});
			return { status: 201, body: { success: true, data: result } };
		} catch (err: unknown) {
			return {
				status: 400,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
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

	async updateLink(
		id: number,
		body: {
			name?: string;
			expires_at?: string;
			slot_ids?: number[];
			requires_approval?: boolean;
		},
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			const result = await this.linkService.updateLink(id, {
				name: body.name,
				expiresAt: body.expires_at,
				allowedSlotIds: body.slot_ids,
				requiresApproval: body.requires_approval,
			});
			if (!result) {
				return {
					status: 404,
					body: { success: false, error: t("link.notFound") },
				};
			}
			return { status: 200, body: { success: true, data: result } };
		} catch (err: unknown) {
			return {
				status: 400,
				body: { success: false, error: getErrorMessage(err) },
			};
		}
	}
}
