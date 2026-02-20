import { t } from "../i18n";
import { CommunityEventRepository } from "../repositories/CommunityEventRepository";

export class CommunityEventService {
	private repo = new CommunityEventRepository();

	async getAllEvents() {
		return this.repo.findAll();
	}

	async createEvent(input: {
		title?: string;
		description?: string;
		start_at?: string;
		end_at?: string;
		color?: string;
		required_approvals?: number;
	}) {
		if (!input.title || !input.start_at || !input.end_at) {
			throw new Error(t("communityEvent.fieldsRequired"));
		}

		const start = new Date(input.start_at);
		const end = new Date(input.end_at);

		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
			throw new Error(t("slot.invalidDate"));
		}

		if (end <= start) {
			throw new Error(t("slot.endAfterStart"));
		}

		if (start <= new Date()) {
			throw new Error(t("communityEvent.mustBeFuture"));
		}

		const requiredApprovals = input.required_approvals ?? 3;
		if (requiredApprovals < 1) {
			throw new Error(t("communityEvent.minApprovals"));
		}

		const shareToken = crypto.randomUUID();

		return this.repo.create({
			title: input.title,
			description: input.description,
			start_at: input.start_at,
			end_at: input.end_at,
			color: input.color,
			required_approvals: requiredApprovals,
			share_token: shareToken,
		});
	}

	async getByShareToken(token: string) {
		const event = await this.repo.findByShareToken(token);
		if (!event) {
			throw new Error(t("communityEvent.notFound"));
		}
		return event;
	}

	async approve(token: string) {
		const event = await this.repo.findByShareToken(token);
		if (!event) {
			throw new Error(t("communityEvent.notFound"));
		}
		if (event.status === "canceled") {
			throw new Error(t("communityEvent.alreadyCanceled"));
		}
		if (event.status === "active") {
			throw new Error(t("communityEvent.alreadyActive"));
		}
		return this.repo.incrementApproval(event.id);
	}

	async deleteEvent(id: number) {
		const event = await this.repo.findById(id);
		if (!event) {
			throw new Error(t("communityEvent.notFound"));
		}
		await this.repo.delete(id);
	}

	async cancelExpiredPending() {
		const expired = await this.repo.findExpiredPending();
		for (const event of expired) {
			await this.repo.updateStatus(event.id, "canceled");
		}
		return expired.length;
	}
}
