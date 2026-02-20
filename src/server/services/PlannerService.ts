import { t } from "../i18n";
import { PlannerRepository } from "../repositories/PlannerRepository";

export class PlannerService {
	private plannerRepo = new PlannerRepository();

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

		return this.plannerRepo.create({
			title: input.title,
			description: input.description,
			start_at: input.start_at,
			end_at: input.end_at,
			color: input.color,
		});
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

		return this.plannerRepo.update(id, payload);
	}

	async deleteEvent(id: number) {
		const existing = await this.plannerRepo.findById(id);
		if (!existing) {
			throw new Error(t("planner.notFound"));
		}

		await this.plannerRepo.delete(id);
	}
}
