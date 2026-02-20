import type { EntityManager } from "typeorm";
import { AppDataSource } from "../db/data-source";
import { AppointmentEntity } from "../entities/AppointmentEntity";
import type {
	Appointment,
	AppointmentWithSlot,
	CreateAppointmentInput,
} from "../types";
import { generateUniqueSlugId } from "../utils/slug";

export class AppointmentRepository {
	private repo(manager?: EntityManager) {
		return manager
			? manager.getRepository(AppointmentEntity)
			: AppDataSource.getRepository(AppointmentEntity);
	}

	async findAll(): Promise<AppointmentWithSlot[]> {
		const rows = await this.repo()
			.createQueryBuilder("a")
			.leftJoin("availability_slots", "s", "s.id = a.slot_id")
			.select([
				"a.id as id",
				"a.slot_id as slot_id",
				"a.name as name",
				"a.email as email",
				"a.meeting_place as meeting_place",
				"a.note as note",
				"COALESCE(a.start_at, s.start_at) as start_at",
				"COALESCE(a.end_at, s.end_at) as end_at",
				"a.slug_id as slug_id",
				"a.canceled_at as canceled_at",
				"a.canceled_by as canceled_by",
				"a.created_at as created_at",
			])
			.orderBy("a.created_at", "DESC")
			.getRawMany<AppointmentWithSlot>();

		return rows;
	}

	async findById(id: number): Promise<AppointmentWithSlot | null> {
		const row = await this.repo()
			.createQueryBuilder("a")
			.leftJoin("availability_slots", "s", "s.id = a.slot_id")
			.select([
				"a.id as id",
				"a.slot_id as slot_id",
				"a.name as name",
				"a.email as email",
				"a.meeting_place as meeting_place",
				"a.note as note",
				"COALESCE(a.start_at, s.start_at) as start_at",
				"COALESCE(a.end_at, s.end_at) as end_at",
				"a.slug_id as slug_id",
				"a.canceled_at as canceled_at",
				"a.canceled_by as canceled_by",
				"a.created_at as created_at",
			])
			.where("a.id = :id", { id })
			.getRawOne<AppointmentWithSlot>();

		return row ?? null;
	}

	async hasOverlapInSlot(
		slotId: number,
		startAt: string,
		endAt: string,
		manager?: EntityManager,
	): Promise<boolean> {
		const count = await this.repo(manager)
			.createQueryBuilder("a")
			.where("a.slot_id = :slotId", { slotId })
			.andWhere("a.canceled_at IS NULL")
			.andWhere("NOT (a.end_at <= :startAt OR a.start_at >= :endAt)", {
				startAt,
				endAt,
			})
			.getCount();

		return count > 0;
	}

	async findActiveIntervalsBySlotIds(
		slotIds: number[],
		manager?: EntityManager,
	): Promise<Array<{ slot_id: number; start_at: string; end_at: string }>> {
		if (slotIds.length === 0) {
			return [];
		}

		return this.repo(manager)
			.createQueryBuilder("a")
			.select([
				"a.slot_id as slot_id",
				"a.start_at as start_at",
				"a.end_at as end_at",
			])
			.where("a.slot_id IN (:...slotIds)", { slotIds })
			.andWhere("a.canceled_at IS NULL")
			.andWhere("a.end_at >= :now", { now: new Date().toISOString() })
			.orderBy("a.start_at", "ASC")
			.getRawMany<{ slot_id: number; start_at: string; end_at: string }>();
	}

	async create(
		input: CreateAppointmentInput,
		manager?: EntityManager,
	): Promise<Appointment> {
		const repo = this.repo(manager);
		const slugId = await generateUniqueSlugId(async (candidate) => {
			const existing = await repo.findOne({ where: { slug_id: candidate } });
			return Boolean(existing);
		});
		const created = repo.create({
			slot_id: input.slot_id,
			name: input.name,
			email: input.email || null,
			meeting_place: input.meeting_place || null,
			note: input.note || null,
			start_at: input.start_at,
			end_at: input.end_at,
			slug_id: slugId,
			canceled_at: null,
			canceled_by: null,
		});
		const saved = await repo.save(created);
		return {
			id: saved.id,
			slot_id: saved.slot_id,
			name: saved.name,
			email: saved.email,
			meeting_place: saved.meeting_place,
			note: saved.note,
			start_at: saved.start_at || input.start_at,
			end_at: saved.end_at || input.end_at,
			slug_id: saved.slug_id,
			canceled_at: saved.canceled_at,
			canceled_by: saved.canceled_by,
			created_at: saved.created_at,
		};
	}

	async findBySlugId(slugId: string): Promise<AppointmentWithSlot | null> {
		const row = await this.repo()
			.createQueryBuilder("a")
			.leftJoin("availability_slots", "s", "s.id = a.slot_id")
			.select([
				"a.id as id",
				"a.slot_id as slot_id",
				"a.name as name",
				"a.email as email",
				"a.meeting_place as meeting_place",
				"a.note as note",
				"COALESCE(a.start_at, s.start_at) as start_at",
				"COALESCE(a.end_at, s.end_at) as end_at",
				"a.slug_id as slug_id",
				"a.canceled_at as canceled_at",
				"a.canceled_by as canceled_by",
				"a.created_at as created_at",
			])
			.where("a.slug_id = :slugId", { slugId })
			.getRawOne<AppointmentWithSlot>();

		return row ?? null;
	}

	async markCancelled(
		id: number,
		canceledBy: "admin" | "guest",
	): Promise<AppointmentWithSlot | null> {
		await this.repo().update(id, {
			canceled_at: new Date().toISOString(),
			canceled_by: canceledBy,
		});
		return this.findById(id);
	}

	async markCancelledBySlugId(
		slugId: string,
		canceledBy: "admin" | "guest",
	): Promise<AppointmentWithSlot | null> {
		await this.repo().update(
			{ slug_id: slugId },
			{
				canceled_at: new Date().toISOString(),
				canceled_by: canceledBy,
			},
		);
		return this.findBySlugId(slugId);
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.repo().delete(id);
		return !!result.affected;
	}

	async deleteBySlugId(slugId: string): Promise<boolean> {
		const result = await this.repo().delete({ slug_id: slugId });
		return !!result.affected;
	}
}
