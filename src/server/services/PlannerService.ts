import { t } from "../i18n";
import { PlannerRepository } from "../repositories/PlannerRepository";
import { WebhookService } from "./WebhookService";

export class PlannerService {
	private plannerRepo = new PlannerRepository();
	private webhookService = new WebhookService();

	async getAllEvents() {
		return this.plannerRepo.findAll();
	}

	async createEvent(input: {
		title?: string;
		description?: string;
		start_at?: string;
		end_at?: string;
		color?: string;
	}) {
		if (!input.title || !input.start_at || !input.end_at) {
			throw new Error(t("planner.fieldsRequired"));
		}

		const start = new Date(input.start_at);
		const end = new Date(input.end_at);

		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
			throw new Error(t("slot.invalidDate"));
		}

		if (end <= start) {
			throw new Error(t("slot.endAfterStart"));
		}

		const event = await this.plannerRepo.create({
			title: input.title,
			description: input.description,
			start_at: input.start_at,
			end_at: input.end_at,
			color: input.color,
		});

		this.webhookService
			.sendEvent("planner_event.created", { event })
			.catch((error) =>
				console.error("Failed to send planner_event.created webhook:", error),
			);

		return event;
	}

	async updateEvent(
		id: number,
		payload: {
			title?: string;
			description?: string;
			start_at?: string;
			end_at?: string;
			color?: string;
		},
	) {
		const existing = await this.plannerRepo.findById(id);
		if (!existing) {
			throw new Error(t("planner.notFound"));
		}

		const updated = await this.plannerRepo.update(id, payload);
		if (updated) {
			this.webhookService
				.sendEvent("planner_event.updated", {
					event: updated,
					changed_fields: Object.keys(payload),
				})
				.catch((error) =>
					console.error("Failed to send planner_event.updated webhook:", error),
				);
		}
		return updated;
	}

	async deleteEvent(id: number) {
		const existing = await this.plannerRepo.findById(id);
		if (!existing) {
			throw new Error(t("planner.notFound"));
		}

		await this.plannerRepo.delete(id);
		this.webhookService
			.sendEvent("planner_event.deleted", { event: existing })
			.catch((error) =>
				console.error("Failed to send planner_event.deleted webhook:", error),
			);
	}
}
