import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	Unique,
} from "typeorm";

@Entity({ name: "booking_links" })
@Unique(["slug_id"])
export class BookingLinkEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "text", default: "" })
	name!: string;

	@Column({ type: "text" })
	slug_id!: string;

	@Column({ type: "text", default: "[]" })
	allowed_slot_ids!: string;

	@Column({ type: "text" })
	expires_at!: string;

	@CreateDateColumn({ type: "datetime" })
	created_at!: string;
}
