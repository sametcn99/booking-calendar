import { AppDataSource } from "../db/data-source";
import { PlannerEventEntity } from "../entities/PlannerEventEntity";

export class PlannerRepository {
	private repo() {
		return AppDataSource.getRepository(PlannerEventEntity);
	}

	async findAll(): Promise<PlannerEventEntity[]> {
		return this.repo().find({ order: { start_at: "ASC" } });
	}

	async findById(id: number): Promise<PlannerEventEntity | null> {
		return this.repo().findOneBy({ id });
	}

	async create(input: {
		title: string;
		description?: string;
		start_at: string;
		end_at: string;
		color?: string;
	}): Promise<PlannerEventEntity> {
		const entity = this.repo().create({
			title: input.title,
			description: input.description ?? null,
			start_at: input.start_at,
			end_at: input.end_at,
			color: input.color ?? null,
		});
		return this.repo().save(entity);
	}

	async update(
		id: number,
		payload: {
			title?: string;
			description?: string;
			start_at?: string;
			end_at?: string;
			color?: string;
		},
	): Promise<PlannerEventEntity | null> {
		await this.repo().update(id, payload);
		return this.findById(id);
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.repo().delete(id);
		return !!result.affected;
	}
}
