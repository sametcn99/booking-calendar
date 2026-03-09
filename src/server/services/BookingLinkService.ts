import { config } from "../config";
import { t } from "../i18n";
import { BookingLinkRepository } from "../repositories/BookingLinkRepository";
import type { BookingLink } from "../types";
import { generateUniqueSlugId } from "../utils/slug";
import { WebhookService } from "./WebhookService";

export class BookingLinkService {
	private linkRepo: BookingLinkRepository;
	private webhookService: WebhookService;

	constructor() {
		this.linkRepo = new BookingLinkRepository();
		this.webhookService = new WebhookService();
	}

	async getAllLinks(): Promise<BookingLink[]> {
		return this.linkRepo.findAll();
	}

	async createLinkWithConfig(input: {
		expiresInDays?: number;
		name?: string;
		allowedSlotIds: number[];
		requiresApproval?: boolean;
	}): Promise<{
		link: BookingLink;
		url: string;
	}> {
		const slugId = await this.generateUniqueSlugId();
		const expiresInDays = input.expiresInDays ?? 7;

		if (
			typeof expiresInDays !== "number" ||
			!Number.isSafeInteger(expiresInDays) ||
			expiresInDays < 1
		) {
			throw new Error(t("link.invalidExpiresDays"));
		}

		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);
		const allowedSlotIds = [...new Set(input.allowedSlotIds)];

		const name = await this.resolveLinkName(input.name);

		const link = await this.linkRepo.create({
			name,
			slug_id: slugId,
			allowed_slot_ids: allowedSlotIds,
			expires_at: expiresAt.toISOString(),
			requires_approval: input.requiresApproval,
		});

		const url = `${config.baseUrl}/book/${slugId}`;

		this.webhookService
			.sendEvent("booking_link.created", { link, url })
			.catch((error) =>
				console.error("Failed to send booking_link.created webhook:", error),
			);

		return { link, url };
	}

	async validateToken(identifier: string): Promise<BookingLink | null> {
		return this.linkRepo.findValidBySlug(identifier);
	}

	async deleteLink(id: number): Promise<boolean> {
		const links = await this.linkRepo.findAll();
		const existing = links.find((link) => link.id === id) ?? null;
		const deleted = await this.linkRepo.delete(id);
		if (deleted && existing) {
			this.webhookService
				.sendEvent("booking_link.deleted", { link: existing })
				.catch((error) =>
					console.error("Failed to send booking_link.deleted webhook:", error),
				);
		}
		return deleted;
	}

	async updateLink(
		id: number,
		input: {
			name?: string;
			expiresAt?: string;
			allowedSlotIds?: number[];
			requiresApproval?: boolean;
		},
	): Promise<BookingLink | null> {
		const updatePayload: Parameters<typeof this.linkRepo.update>[1] = {};
		if (input.name !== undefined) {
			updatePayload.name = await this.resolveLinkName(input.name);
		}
		if (input.expiresAt !== undefined) {
			updatePayload.expires_at = input.expiresAt;
		}
		if (input.allowedSlotIds !== undefined) {
			updatePayload.allowed_slot_ids = [...new Set(input.allowedSlotIds)];
		}
		if (input.requiresApproval !== undefined) {
			updatePayload.requires_approval = input.requiresApproval;
		}

		const updated = await this.linkRepo.update(id, updatePayload);
		if (updated) {
			this.webhookService
				.sendEvent("booking_link.updated", {
					link: updated,
					changed_fields: Object.keys(updatePayload),
				})
				.catch((error) =>
					console.error("Failed to send booking_link.updated webhook:", error),
				);
		}
		return updated;
	}

	private async resolveLinkName(name?: string): Promise<string> {
		const trimmed = name?.trim();
		if (trimmed) {
			return trimmed;
		}

		const prefix = t("link.defaultNamePrefix");
		const existingNames = await this.linkRepo.findNamesByPrefix(prefix);
		const usedIndexes = existingNames
			.map((existingName) => {
				const suffix = existingName.slice(prefix.length).trim();
				if (!/^\d+$/.test(suffix)) return 0;
				return Number.parseInt(suffix, 10);
			})
			.filter((value) => value > 0);

		const nextIndex = usedIndexes.length > 0 ? Math.max(...usedIndexes) + 1 : 1;
		return `${prefix} ${nextIndex}`;
	}

	private async generateUniqueSlugId(): Promise<string> {
		return generateUniqueSlugId(async (candidate) => {
			const existing = await this.linkRepo.findBySlug(candidate);
			return Boolean(existing);
		});
	}
}
