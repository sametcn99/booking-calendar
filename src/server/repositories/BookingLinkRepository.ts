import { AppDataSource } from "../db/data-source";
import { BookingLinkEntity } from "../entities/BookingLinkEntity";
import type { BookingLink, CreateBookingLinkInput } from "../types";

export class BookingLinkRepository {
	private repo() {
		return AppDataSource.getRepository(BookingLinkEntity);
	}

	private toDomain(entity: BookingLinkEntity): BookingLink {
		let allowedSlotIds: number[] = [];
		try {
			const parsed = JSON.parse(entity.allowed_slot_ids);
			if (Array.isArray(parsed)) {
				allowedSlotIds = parsed.filter((value) => Number.isInteger(value));
			}
		} catch {
			allowedSlotIds = [];
		}

		return {
			id: entity.id,
			name: entity.name,
			slug_id: entity.slug_id,
			allowed_slot_ids: allowedSlotIds,
			expires_at: entity.expires_at,
			created_at: entity.created_at,
		};
	}

	async findAll(): Promise<BookingLink[]> {
		const rows = await this.repo().find({ order: { created_at: "DESC" } });
		return rows.map((row) => this.toDomain(row));
	}

	async findBySlug(slugId: string): Promise<BookingLink | null> {
		const row = await this.repo().findOneBy({ slug_id: slugId });
		return row ? this.toDomain(row) : null;
	}

	async findValidBySlug(slugId: string): Promise<BookingLink | null> {
		const row = await this.repo()
			.createQueryBuilder("link")
			.where("link.slug_id = :slugId", { slugId })
			.andWhere("datetime(link.expires_at) > datetime('now')")
			.getOne();

		return row ? this.toDomain(row) : null;
	}

	async findNamesByPrefix(prefix: string): Promise<string[]> {
		const rows = await this.repo()
			.createQueryBuilder("link")
			.select("link.name", "name")
			.where("link.name LIKE :prefix", { prefix: `${prefix} %` })
			.getRawMany<{ name: string }>();

		return rows.map((row) => row.name);
	}

	async create(input: CreateBookingLinkInput): Promise<BookingLink> {
		const created = this.repo().create({
			name: input.name,
			slug_id: input.slug_id,
			allowed_slot_ids: JSON.stringify(input.allowed_slot_ids),
			expires_at: input.expires_at,
		});
		const saved = await this.repo().save(created);
		return this.toDomain(saved);
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.repo().delete(id);
		return !!result.affected;
	}
}
