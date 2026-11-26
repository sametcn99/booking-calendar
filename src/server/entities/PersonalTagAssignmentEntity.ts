import {
	Check,
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { AppointmentEntity } from "./AppointmentEntity";
import { CommunityEventEntity } from "./CommunityEventEntity";
import { PersonalTagEntity } from "./PersonalTagEntity";
import { PlannerEventEntity } from "./PlannerEventEntity";

@Entity({ name: "personal_tag_assignments" })
@Check(
	"(appointment_id IS NOT NULL) + (community_id IS NOT NULL) + (planner_id IS NOT NULL) = 1",
)
@Index(["tag_id", "appointment_id"], { unique: true })
@Index(["tag_id", "community_id"], { unique: true })
@Index(["tag_id", "planner_id"], { unique: true })
export class PersonalTagAssignmentEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "integer" })
	tag_id!: number;

	@Index()
	@Column({ type: "integer", nullable: true })
	appointment_id!: number | null;

	@Index()
	@Column({ type: "integer", nullable: true })
	community_id!: number | null;

	@Index()
	@Column({ type: "integer", nullable: true })
	planner_id!: number | null;

	@ManyToOne(() => PersonalTagEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "tag_id" })
	tag!: PersonalTagEntity;

	@ManyToOne(() => AppointmentEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "appointment_id" })
	appointment!: AppointmentEntity | null;

	@ManyToOne(() => CommunityEventEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "community_id" })
	community!: CommunityEventEntity | null;

	@ManyToOne(() => PlannerEventEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "planner_id" })
	planner!: PlannerEventEntity | null;
}
