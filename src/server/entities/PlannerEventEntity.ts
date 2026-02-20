import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "planner_events" })
export class PlannerEventEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "text" })
	title!: string;

	@Column({ type: "text", nullable: true })
	description!: string | null;

	@Column({ type: "text" })
	start_at!: string;

	@Column({ type: "text" })
	end_at!: string;

	@Column({ type: "text", nullable: true })
	color!: string | null;

	@CreateDateColumn({ type: "datetime" })
	created_at!: string;
}
