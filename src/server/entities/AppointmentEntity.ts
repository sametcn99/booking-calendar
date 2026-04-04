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
	slug_id!: string | null;

	@Column({ type: "text", default: "approved" })
	status!: "pending" | "approved" | "rejected";

	@Column({ type: "text", nullable: true })
	canceled_at!: string | null;

	@Column({ type: "text", nullable: true })
	canceled_by!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_uid!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_calendar_url!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_href!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_etag!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_last_synced_at!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_sync_error!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_error_category!: string | null;

	@Column({ type: "boolean", nullable: true })
	caldav_error_retryable!: boolean | null;

	@Column({ type: "integer", nullable: true })
	caldav_retry_count!: number | null;

	@Column({ type: "text", nullable: true })
	caldav_next_retry_at!: string | null;

	@Column({ type: "integer", default: 0 })
	caldav_conflict_count!: number;

	@Column({ type: "text", nullable: true })
	caldav_last_conflict_at!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_conflict_state!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_conflict_detail!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_remote_etag!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_queue_status!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_queued_at!: string | null;

	@Column({ type: "text", nullable: true })
	caldav_sync_policy!: string | null;

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
