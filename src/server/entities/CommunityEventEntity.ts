import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "community_events" })
export class CommunityEventEntity {
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

	@Column({ type: "text", unique: true })
	share_token!: string;

	@Column({ type: "integer", default: 3 })
	required_approvals!: number;

	@Column({ type: "integer", default: 0 })
	current_approvals!: number;

	@Column({ type: "text", default: "pending" })
	status!: string; // pending | active | canceled

	@CreateDateColumn({ type: "datetime" })
	created_at!: string;
}
