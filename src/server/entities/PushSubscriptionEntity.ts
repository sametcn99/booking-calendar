import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "push_subscriptions" })
export class PushSubscriptionEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "text", unique: true })
	endpoint!: string;

	@Column({ type: "text" })
	p256dh!: string;

	@Column({ type: "text" })
	auth!: string;

	@CreateDateColumn({ type: "datetime" })
	created_at!: string;

	@Column({ type: "text", nullable: true })
	user_agent!: string | null;
}
