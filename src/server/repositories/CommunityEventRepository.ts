import { AppDataSource } from "../db/data-source";
import { CommunityEventEntity } from "../entities/CommunityEventEntity";

export class CommunityEventRepository {
	private repo() {
		return AppDataSource.getRepository(CommunityEventEntity);
	}

	async findAll(): Promise<CommunityEventEntity[]> {
		return this.repo().find({ order: { created_at: "DESC" } });
	}

	async findById(id: number): Promise<CommunityEventEntity | null> {
		return this.repo().findOneBy({ id });
	}

	async findByShareToken(token: string): Promise<CommunityEventEntity | null> {
		return this.repo().findOneBy({ share_token: token });
	}

	async create(input: {
		title: string;
		description?: string;
		start_at: string;
		end_at: string;
		color?: string;
		required_approvals: number;
		share_token: string;
	}): Promise<CommunityEventEntity> {
		const entity = this.repo().create({
			title: input.title,
			description: input.description ?? null,
			start_at: input.start_at,
			end_at: input.end_at,
			color: input.color ?? null,
			required_approvals: input.required_approvals,
			current_approvals: 0,
			status: "pending",
			share_token: input.share_token,
		});
		return this.repo().save(entity);
	}

	async incrementApproval(id: number): Promise<CommunityEventEntity | null> {
		const event = await this.findById(id);
		if (!event) return null;
		event.current_approvals += 1;
		if (event.current_approvals >= event.required_approvals) {
			event.status = "active";
		}
		return this.repo().save(event);
	}

	async updateStatus(
		id: number,
		status: string,
	): Promise<CommunityEventEntity | null> {
		const event = await this.findById(id);
		if (!event) return null;
		event.status = status;
		return this.repo().save(event);
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.repo().delete(id);
		return !!result.affected;
	}

	async findExpiredPending(): Promise<CommunityEventEntity[]> {
		const now = new Date().toISOString();
		return this.repo()
			.createQueryBuilder("ce")
			.where("ce.status = :status", { status: "pending" })
			.andWhere("ce.start_at <= :now", { now })
			.getMany();
	}
}
