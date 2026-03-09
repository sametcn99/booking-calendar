import { t } from "../i18n";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { SlotRepository } from "../repositories/SlotRepository";
import type {
	AvailabilitySlot,
	CreateSlotInput,
	PublicAvailabilitySlot,
} from "../types";
import { WebhookService } from "./WebhookService";

export class SlotService {
	private slotRepo: SlotRepository;
	private appointmentRepo: AppointmentRepository;
	private webhookService: WebhookService;

	constructor() {
		this.slotRepo = new SlotRepository();
		this.appointmentRepo = new AppointmentRepository();
		this.webhookService = new WebhookService();
	}

	async getAllSlots(): Promise<AvailabilitySlot[]> {
		return this.slotRepo.findAll();
	}

	async getAvailableSlots(slotIds?: number[]): Promise<AvailabilitySlot[]> {
		if (slotIds && slotIds.length > 0) {
			return this.slotRepo.findAvailableByIds(slotIds);
		}

		return this.slotRepo.findAvailable();
	}

	async getAvailableSlotsWithBusyIntervals(
		slotIds?: number[],
	): Promise<PublicAvailabilitySlot[]> {
		const slots = await this.getAvailableSlots(slotIds);
		if (slots.length === 0) {
			return [];
		}

		const slotIdList = slots.map((slot) => slot.id);
		const intervals =
			await this.appointmentRepo.findActiveIntervalsBySlotIds(slotIdList);

		const busyBySlotId = new Map<
			number,
			Array<{ start_at: string; end_at: string }>
		>();

		for (const interval of intervals) {
			const existing = busyBySlotId.get(interval.slot_id) || [];
			existing.push({
				start_at: interval.start_at,
				end_at: interval.end_at,
			});
			busyBySlotId.set(interval.slot_id, existing);
		}

		return slots.map((slot) => ({
			...slot,
			busy_intervals: busyBySlotId.get(slot.id) || [],
		}));
	}

	async createSlot(input: CreateSlotInput): Promise<AvailabilitySlot> {
		const slotName = input.name.trim();
		if (!slotName) {
			throw new Error(t("slot.nameRequired"));
		}

		const startDate = new Date(input.start_at);
		const endDate = new Date(input.end_at);

		if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
			throw new Error(t("slot.invalidDate"));
		}

		if (endDate <= startDate) {
			throw new Error(t("slot.endAfterStart"));
		}

		const slot = await this.slotRepo.create({
			...input,
			name: slotName,
		});

		this.webhookService
			.sendEvent("slot.created", { slot })
			.catch((error) =>
				console.error("Failed to send slot.created webhook:", error),
			);

		return slot;
	}

	async toggleSlotActive(
		id: number,
		isActive: boolean,
	): Promise<AvailabilitySlot | null> {
		const slot = await this.slotRepo.findById(id);
		if (!slot) throw new Error(t("slot.notFound"));
		const updated = await this.slotRepo.update(id, { is_active: isActive });
		if (updated) {
			this.webhookService
				.sendEvent("slot.updated", {
					slot: updated,
					changed_fields: ["is_active"],
				})
				.catch((error) =>
					console.error("Failed to send slot.updated webhook:", error),
				);
		}
		return updated;
	}

	async renameSlot(id: number, name: string): Promise<AvailabilitySlot | null> {
		const slot = await this.slotRepo.findById(id);
		if (!slot) throw new Error(t("slot.notFound"));

		const slotName = name.trim();
		if (!slotName) {
			throw new Error(t("slot.nameRequired"));
		}

		const updated = await this.slotRepo.update(id, { name: slotName });
		if (updated) {
			this.webhookService
				.sendEvent("slot.updated", { slot: updated, changed_fields: ["name"] })
				.catch((error) =>
					console.error("Failed to send slot.updated webhook:", error),
				);
		}
		return updated;
	}

	async updateSlot(
		id: number,
		input: Partial<CreateSlotInput>,
	): Promise<AvailabilitySlot | null> {
		const slot = await this.slotRepo.findById(id);
		if (!slot) throw new Error(t("slot.notFound"));

		const updatePayload: Parameters<typeof this.slotRepo.update>[1] = {};

		if (input.name !== undefined) {
			const name = input.name.trim();
			if (!name) throw new Error(t("slot.nameRequired"));
			updatePayload.name = name;
		}

		if (input.start_at !== undefined || input.end_at !== undefined) {
			const startAt = input.start_at ?? slot.start_at;
			const endAt = input.end_at ?? slot.end_at;

			const startDate = new Date(startAt);
			const endDate = new Date(endAt);

			if (
				Number.isNaN(startDate.getTime()) ||
				Number.isNaN(endDate.getTime())
			) {
				throw new Error(t("slot.invalidDate"));
			}

			if (endDate <= startDate) {
				throw new Error(t("slot.endAfterStart"));
			}

			updatePayload.start_at = startAt;
			updatePayload.end_at = endAt;
		}

		const updated = await this.slotRepo.update(id, updatePayload);
		if (updated) {
			this.webhookService
				.sendEvent("slot.updated", {
					slot: updated,
					changed_fields: Object.keys(updatePayload),
				})
				.catch((error) =>
					console.error("Failed to send slot.updated webhook:", error),
				);
		}
		return updated;
	}

	async deleteSlot(id: number): Promise<boolean> {
		const slot = await this.slotRepo.findById(id);
		if (!slot) throw new Error(t("slot.notFound"));

		const appointmentCount = await this.appointmentRepo.countBySlotId(id);
		if (appointmentCount > 0) {
			// If there are appointments, archive the slot instead of deleting it
			const archived = await this.slotRepo.update(id, { is_active: false });
			if (archived) {
				this.webhookService
					.sendEvent("slot.archived", {
						slot: archived,
						reason: "has_appointments",
					})
					.catch((error) =>
						console.error("Failed to send slot.archived webhook:", error),
					);
			}
			return true;
		}

		const deleted = await this.slotRepo.delete(id);
		if (deleted) {
			this.webhookService
				.sendEvent("slot.deleted", { slot })
				.catch((error) =>
					console.error("Failed to send slot.deleted webhook:", error),
				);
		}
		return deleted;
	}
}
