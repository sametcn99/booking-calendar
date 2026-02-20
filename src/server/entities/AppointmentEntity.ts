import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { AvailabilitySlotEntity } from "./AvailabilitySlotEntity";

@Entity({ name: "appointments" })
export class AppointmentEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "integer" })
	slot_id!: number;

	@Column({ type: "text" })
	name!: string;

	@Column({ type: "text", nullable: true })
	email!: string | null;

	@Column({ type: "text", nullable: true })
	meeting_place!: string | null;

	@Column({ type: "text", nullable: true })
	note!: string | null;

	@Column({ type: "text", nullable: true })
	start_at!: string | null;

	@Column({ type: "text", nullable: true })
	end_at!: string | null;

	@Column({ type: "text", nullable: true, unique: true })
	cancel_token!: string | null;

	@Column({ type: "text", nullable: true })
	canceled_at!: string | null;

	@Column({ type: "text", nullable: true })
	canceled_by!: string | null;

	@CreateDateColumn({ type: "datetime" })
	created_at!: string;

	@ManyToOne(
		() => AvailabilitySlotEntity,
		(slot) => slot.appointments,
		{
			onDelete: "CASCADE",
		},
	)
	@JoinColumn({ name: "slot_id" })
	slot!: AvailabilitySlotEntity;
}
