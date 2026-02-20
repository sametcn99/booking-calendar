import { t } from "../i18n";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { SlotRepository } from "../repositories/SlotRepository";
import type {
	AvailabilitySlot,
	CreateSlotInput,
	PublicAvailabilitySlot,
} from "../types";

export class SlotService {
	private slotRepo: SlotRepository;
	private appointmentRepo: AppointmentRepository;

	constructor() {
		this.slotRepo = new SlotRepository();
		this.appointmentRepo = new AppointmentRepository();
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

		return this.slotRepo.create({
			...input,
			name: slotName,
		});
	}

	async toggleSlotActive(
		id: number,
		isActive: boolean,
	): Promise<AvailabilitySlot | null> {
		const slot = await this.slotRepo.findById(id);
		if (!slot) throw new Error(t("slot.notFound"));
		return this.slotRepo.update(id, { is_active: isActive });
	}

	async renameSlot(id: number, name: string): Promise<AvailabilitySlot | null> {
		const slot = await this.slotRepo.findById(id);
		if (!slot) throw new Error(t("slot.notFound"));

		const slotName = name.trim();
		if (!slotName) {
			throw new Error(t("slot.nameRequired"));
		}

		return this.slotRepo.update(id, { name: slotName });
	}

	async deleteSlot(id: number): Promise<boolean> {
		const slot = await this.slotRepo.findById(id);
		if (!slot) throw new Error(t("slot.notFound"));
		return this.slotRepo.delete(id);
	}
}
