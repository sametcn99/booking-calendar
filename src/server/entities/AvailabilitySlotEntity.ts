import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from "typeorm";
import { AppointmentEntity } from "./AppointmentEntity";

@Entity({ name: "availability_slots" })
export class AvailabilitySlotEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "text" })
	start_at!: string;

	@Column({ type: "text" })
	end_at!: string;

	@Column({ type: "text", nullable: true })
	name!: string | null;

	@Column({ type: "integer", default: 1 })
	is_active!: number;

	@CreateDateColumn({ type: "datetime" })
	created_at!: string;

	@OneToMany(
		() => AppointmentEntity,
		(appointment) => appointment.slot,
	)
	appointments!: AppointmentEntity[];
}
