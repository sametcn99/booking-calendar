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

	async findBySlugId(slugId: string): Promise<CommunityEventEntity | null> {
		return this.repo().findOneBy({ slug_id: slugId });
	}

	async create(input: {
		title: string;
		description?: string;
		start_at: string;
		end_at: string;
		color?: string;
		required_approvals: number;
		slug_id: string;
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
			slug_id: input.slug_id,
		});
		return this.repo().save(entity);
	}

	async incrementApproval(
		id: number,
		approverEmail?: string,
	): Promise<CommunityEventEntity | null> {
		const event = await this.findById(id);
		if (!event) return null;

		const normalizedEmail = approverEmail?.trim().toLowerCase();
		const approverEmails: string[] = (() => {
			try {
				const parsed = JSON.parse(event.approver_emails_json);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		})();

		if (normalizedEmail && approverEmails.includes(normalizedEmail)) {
			return event;
		}

		event.current_approvals += 1;
		if (normalizedEmail) {
			approverEmails.push(normalizedEmail);
			event.approver_emails_json = JSON.stringify(approverEmails);
		}
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

	async deleteBySlugId(slugId: string): Promise<boolean> {
		const result = await this.repo().delete({ slug_id: slugId });
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
