import { In } from "typeorm";
import { AppDataSource } from "../db/data-source";
import { AvailabilitySlotEntity } from "../entities/AvailabilitySlotEntity";
import type { AvailabilitySlot, CreateSlotInput } from "../types";

export class SlotRepository {
	private repo() {
		return AppDataSource.getRepository(AvailabilitySlotEntity);
	}

	async findAll(): Promise<AvailabilitySlot[]> {
		return this.repo().find({ order: { start_at: "ASC" } });
	}

	async findActive(): Promise<AvailabilitySlot[]> {
		return this.repo().find({
			where: { is_active: 1 },
			order: { start_at: "ASC" },
		});
	}

	async findAvailable(): Promise<AvailabilitySlot[]> {
		return this.findActive();
	}

	async findAvailableByIds(ids: number[]): Promise<AvailabilitySlot[]> {
		if (ids.length === 0) return [];

		return this.repo().find({
			where: { is_active: 1, id: In(ids) },
			order: { start_at: "ASC" },
		});
	}

	async findByIds(ids: number[]): Promise<AvailabilitySlot[]> {
		if (ids.length === 0) return [];

		return this.repo().find({
			where: { id: In(ids) },
		});
	}

	async findById(id: number): Promise<AvailabilitySlot | null> {
		return this.repo().findOneBy({ id });
	}

	async create(input: CreateSlotInput): Promise<AvailabilitySlot> {
		const created = this.repo().create({
			name: input.name,
			start_at: input.start_at,
			end_at: input.end_at,
			is_active: 1,
		});
		return this.repo().save(created);
	}

	async update(
		id: number,
		payload: { is_active?: boolean; name?: string },
	): Promise<AvailabilitySlot | null> {
		const updatePayload: { is_active?: number; name?: string } = {};
		if (payload.is_active !== undefined) {
			updatePayload.is_active = payload.is_active ? 1 : 0;
		}
		if (payload.name !== undefined) {
			updatePayload.name = payload.name;
		}

		await this.repo().update(id, updatePayload);
		return this.findById(id);
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.repo().delete(id);
		return !!result.affected;
	}
}
