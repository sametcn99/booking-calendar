import { config } from "../config";
import { t } from "../i18n";
import { BookingLinkRepository } from "../repositories/BookingLinkRepository";
import type { BookingLink } from "../types";

export class BookingLinkService {
	private linkRepo: BookingLinkRepository;

	constructor() {
		this.linkRepo = new BookingLinkRepository();
	}

	async getAllLinks(): Promise<BookingLink[]> {
		return this.linkRepo.findAll();
	}

	async createLinkWithConfig(input: {
		expiresInDays?: number;
		name?: string;
		allowedSlotIds: number[];
	}): Promise<{
		link: BookingLink;
		url: string;
	}> {
		const slugId = await this.generateUniqueSlugId();
		const expiresInDays = input.expiresInDays ?? 7;
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);
		const allowedSlotIds = [...new Set(input.allowedSlotIds)];

		const name = await this.resolveLinkName(input.name);

		const link = await this.linkRepo.create({
			name,
			slug_id: slugId,
			allowed_slot_ids: allowedSlotIds,
			expires_at: expiresAt.toISOString(),
		});

		const url = `${config.baseUrl}/book/${slugId}`;

		return { link, url };
	}

	async validateToken(identifier: string): Promise<BookingLink | null> {
		return this.linkRepo.findValidBySlug(identifier);
	}

	async deleteLink(id: number): Promise<boolean> {
		return this.linkRepo.delete(id);
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

	private generateSlugId(length: number = 8): string {
		const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
		const bytes = crypto.getRandomValues(new Uint8Array(length));
		return Array.from(bytes)
			.map((value) => alphabet[value % alphabet.length])
			.join("");
	}

	private async generateUniqueSlugId(): Promise<string> {
		for (let attempt = 0; attempt < 10; attempt++) {
			const candidate = this.generateSlugId();
			const existing = await this.linkRepo.findBySlug(candidate);
			if (!existing) return candidate;
		}

		return `${this.generateSlugId(6)}${Date.now().toString(36).slice(-2)}`;
	}
}
